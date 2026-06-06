"""Import data from 超分子数据收集2.0_自组装_修改(1).xlsx into the SUPRA database."""
import os
import re
import openpyxl
from database import engine, Base, get_db
from models import Assembly, BuildingBlock, DrivingForce, Morphology, Property

EXCEL_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "超分子数据收集2.0_自组装_修改(1).xlsx")
IMAGES_DIR = os.path.join(os.path.dirname(__file__), "..", "frontend", "public", "images")


def get_or_create(db, model, **kwargs):
    instance = db.query(model).filter_by(**kwargs).first()
    if not instance:
        instance = model(**kwargs)
        db.add(instance)
        db.flush()
    return instance


def split_items(text: str) -> list[str]:
    if not text:
        return []
    text = text.replace("；", ";").replace("\n", ";").replace("\r", ";")
    parts = [p.strip() for p in text.split(";") if p.strip()]
    cleaned = []
    for p in parts:
        p = re.sub(r'^\d+[\.\、\s]+', '', p).strip()
        if p:
            cleaned.append(p)
    return cleaned


def import_data():
    # Drop and recreate all tables
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = next(get_db())

    wb = openpyxl.load_workbook(EXCEL_PATH)
    ws = wb.active

    # Column mapping (1-indexed) based on the standardized template:
    # 1:序号 2:化合物类型 3:化合物 4:英文名称 5:化合物图片 6:SMILES号 7:CAS号
    # 8:组装类型 9:组装驱动力分析 10:形貌类型 11:粒径
    # 12:溶剂信息(溶剂体系) 13:溶质 14:浓度 15:溶剂备注
    # 16:组装温度 17:pH值 18:搅拌/超声条件 19:组装时间
    # 20:生物活性 21:实验方法 22:参考文献DOI 23:分子的特征参数 24:备注
    COL = {
        "compound_type": 2,
        "compound_name": 3,
        "english_name": 4,
        "compound_image": 5,
        "smiles": 6,
        "cas": 7,
        "assembly_type": 8,
        "driving_force": 9,
        "morphology": 10,
        "particle_size": 11,
        "solvent": 12,
        "solute": 13,
        "concentration": 14,
        "solvent_note": 15,
        "temperature": 16,
        "ph": 17,
        "stirring": 18,
        "assembly_time": 19,
        "biological_activity": 20,
        "preparation_method": 21,
        "doi": 22,
        "molecular_char": 23,
        "notes": 24,
    }

    # --- Extract embedded images, map by Excel row (1-indexed) ---
    # An image covers a row if its anchor range (from_row..to_row) includes it.
    # OneCellAnchor only has from_row; TwoCellAnchor has both from_row and to_row.
    os.makedirs(IMAGES_DIR, exist_ok=True)
    row_images: dict[int, list[tuple[bytes, str]]] = {}
    for img in ws._images:
        img_data = img._data()  # call once — subsequent calls fail on closed zip
        img_fmt = img.format or "png"
        af = img.anchor._from
        at = img.anchor.to if hasattr(img.anchor, "to") else None
        from_excel = af.row + 1
        to_excel = (at.row + 1) if at else from_excel
        for r in range(from_excel, to_excel + 1):
            row_images.setdefault(r, []).append((img_data, img_fmt))

    print(f"Found {len(ws._images)} images covering {len(row_images)} rows. Reading {ws.max_row - 2} data rows...")

    imported = 0
    for row_idx in range(3, ws.max_row + 1):
        def cell(c):
            v = ws.cell(row=row_idx, column=c).value
            return str(v).strip() if v is not None else ""

        compound_name = cell(COL["compound_name"])
        if not compound_name:
            continue

        # --- Building Block ---
        bb_name = cell(COL["compound_type"])
        bb = get_or_create(db, BuildingBlock, name=bb_name) if bb_name else None

        # --- Morphology ---
        morph_raw = cell(COL["morphology"]).split("\n")[0].split("；")[0].split(";")[0].strip()
        morph_name = re.sub(r'^\d+[\.\、\s]+', '', morph_raw).strip()
        morph = get_or_create(db, Morphology, name=morph_name, description=morph_name) if morph_name else None

        # --- Driving Forces ---
        df_names = split_items(cell(COL["driving_force"]))
        df_names = [df for df in df_names if not df.startswith("—")]
        driving_forces = []
        for df_name in df_names:
            df = get_or_create(db, DrivingForce, name=df_name)
            driving_forces.append(df)

        # --- Properties (from 生物活性) ---
        bio_text = cell(COL["biological_activity"])
        prop_names = split_items(bio_text)
        properties = []
        for p_name in prop_names:
            if len(p_name) > 200:
                p_name = p_name[:200]
            p = get_or_create(db, Property, name=p_name)
            properties.append(p)

        # --- Particle size extraction ---
        size_text = cell(COL["particle_size"])
        size_nm_min = None
        size_nm_max = None
        nm_match = re.search(r'(\d+\.?\d*)\s*(?:±|–|-)\s*(\d+\.?\d*)\s*nm', size_text)
        if nm_match:
            size_nm_min = float(nm_match.group(1))
            size_nm_max = float(nm_match.group(2))
        else:
            nm_single = re.search(r'(\d+\.?\d*)\s*nm', size_text)
            if nm_single:
                size_nm_min = float(nm_single.group(1))
                size_nm_max = float(nm_single.group(1))

        mol_char = cell(COL["molecular_char"])
        doi_val = cell(COL["doi"])

        # Fix column misalignment: 4 rows have col 22→23→24 shifted right
        # col 22 actually contains molecular_char, col 23 actually contains extra notes
        _MISALIGNED = {"金丝桃素", "芦荟大黄素", "丹参酮 ⅡA", "柔红霉素"}
        _shifted_notes: str | None = None
        if compound_name in _MISALIGNED:
            _shifted_notes = mol_char  # col 23 content is actually notes
            mol_char = doi_val          # col 22 content is molecular_char
            doi_val = ""                # DOI is missing

        # --- Notes ---
        solvent_note = cell(COL["solvent_note"])
        main_notes = cell(COL["notes"])
        notes_parts = []
        if solvent_note and solvent_note != "—":
            notes_parts.append(f"[溶剂备注] {solvent_note}")
        if main_notes and main_notes != "—":
            notes_parts.append(main_notes)
        if _shifted_notes and _shifted_notes != "—":
            notes_parts.append(_shifted_notes)
        combined_notes = "\n".join(notes_parts) if notes_parts else None

        # --- Extract and save compound image ---
        compound_image = None
        imgs = row_images.get(row_idx)
        if imgs:
            img_data, img_fmt = imgs[0]  # use first image
            img_filename = f"{row_idx}.{img_fmt}"
            img_path = os.path.join(IMAGES_DIR, img_filename)
            with open(img_path, "wb") as f:
                f.write(img_data)
            compound_image = f"/images/{img_filename}"

        assembly = Assembly(
            name=compound_name,
            english_name=cell(COL["english_name"]) or None,
            compound_image=compound_image,
            smiles=cell(COL["smiles"]) or None,
            cas_number=cell(COL["cas"]) or None,
            assembly_type=cell(COL["assembly_type"]).replace(";\n", "; ").replace("\n", "; ") or None,
            particle_size=size_text or None,
            solvent=cell(COL["solvent"])[:200] if cell(COL["solvent"]) else None,
            solute=cell(COL["solute"])[:300] if cell(COL["solute"]) else None,
            concentration=cell(COL["concentration"])[:200] if cell(COL["concentration"]) else None,
            preparation_method=cell(COL["preparation_method"]) or None,
            size_nm_min=size_nm_min,
            size_nm_max=size_nm_max,
            doi=doi_val or None,
            description=mol_char or None,
            biological_activity=bio_text or None,
            assembly_temperature=cell(COL["temperature"]) or None,
            ph_value=cell(COL["ph"]) or None,
            stirring_condition=cell(COL["stirring"]) or None,
            assembly_time=cell(COL["assembly_time"]) or None,
            molecular_characteristics=mol_char or None,
            notes=combined_notes,
            building_block_id=bb.id if bb else None,
            morphology_id=morph.id if morph else None,
        )
        assembly.driving_forces = driving_forces
        assembly.properties = properties
        db.add(assembly)

        imported += 1
        if imported % 10 == 0:
            db.flush()
            print(f"  Imported {imported} entries...")

    db.commit()
    db.close()

    # Stats
    db2 = next(get_db())
    print(f"\nDone! Imported {imported} assemblies.")
    print(f"  Building Blocks: {db2.query(BuildingBlock).count()}")
    print(f"  Morphologies: {db2.query(Morphology).count()}")
    print(f"  Driving Forces: {db2.query(DrivingForce).count()}")
    print(f"  Properties: {db2.query(Property).count()}")
    print(f"  Assemblies: {db2.query(Assembly).count()}")
    db2.close()


if __name__ == "__main__":
    import_data()
