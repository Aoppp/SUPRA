"""Import data from 超分子数据收集2.0_自组装.xlsx into the SUPRA database."""
import re
import sys
import openpyxl
from database import engine, Base, get_db
from models import Assembly, BuildingBlock, DrivingForce, Morphology, Property

EXCEL_PATH = "/Users/ao/Desktop/web_dev/超分子数据收集2.0_自组装.xlsx"


def get_or_create(db, model, **kwargs):
    """Get existing record or create a new one."""
    instance = db.query(model).filter_by(**kwargs).first()
    if not instance:
        instance = model(**kwargs)
        db.add(instance)
        db.flush()
    return instance


def split_items(text: str) -> list[str]:
    """Split text by semicolons, newlines, or numbered items. Returns cleaned non-empty strings."""
    if not text:
        return []
    # Normalize separators
    text = text.replace("；", ";").replace("\n", ";").replace("\r", ";")
    # Split and clean
    parts = [p.strip() for p in text.split(";") if p.strip()]
    # Remove leading numbers like "1.", "2.", "1. ", etc.
    cleaned = []
    for p in parts:
        p = re.sub(r'^\d+[\.\、\s]+', '', p).strip()
        if p:
            cleaned.append(p)
    return cleaned


def import_data():
    Base.metadata.create_all(bind=engine)
    db = next(get_db())

    wb = openpyxl.load_workbook(EXCEL_PATH)
    ws = wb.active

    print(f"Reading {ws.max_row - 1} rows from sheet '{ws.title}'...")

    imported = 0
    for row_idx in range(2, ws.max_row + 1):
        cells = {ws.cell(row=1, column=c).value: ws.cell(row=row_idx, column=c).value
                 for c in range(1, ws.max_column + 1)
                 if ws.cell(row=1, column=c).value}

        compound_name = cells.get("化合物")
        if not compound_name or not str(compound_name).strip():
            continue

        # --- Building Block (化合物类型) ---
        bb_name = str(cells.get("化合物类型", "")).strip()
        bb = get_or_create(db, BuildingBlock, name=bb_name) if bb_name else None

        # --- Morphology (形貌类型) ---
        morph_raw = str(cells.get("形貌类型", "")).strip().split("\n")[0].split("；")[0].split(";")[0].strip()
        morph_name = re.sub(r'^\d+[\.\、\s]+', '', morph_raw).strip()
        morph = get_or_create(db, Morphology, name=morph_name, description=morph_name) if morph_name else None

        # --- Driving Forces (组装驱动力分析) ---
        df_names = split_items(str(cells.get("组装驱动力分析", "")))
        driving_forces = []
        for df_name in df_names:
            df = get_or_create(db, DrivingForce, name=df_name)
            driving_forces.append(df)

        # --- Properties (生物活性) ---
        prop_names = split_items(str(cells.get("生物活性", "")))
        properties = []
        for p_name in prop_names:
            if len(p_name) > 200:
                p_name = p_name[:200]
            p = get_or_create(db, Property, name=p_name)
            properties.append(p)

        # --- Particle size extraction for size_nm ---
        size_text = str(cells.get("粒径", "") or "")
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

        # --- Split solvent/concentration ---
        solvent_text = str(cells.get("溶剂类型及浓度", "") or "")
        solvent = solvent_text[:100] if solvent_text else None
        concentration = None

        # --- Description: combine 分子的特征参数 + 备注 ---
        desc_parts = []
        mol_char = str(cells.get("分子的特征参数", "") or "").strip()
        if mol_char:
            desc_parts.append(mol_char)
        description = "\n".join(desc_parts) if desc_parts else None

        # --- Assembly ---
        assembly = Assembly(
            name=str(compound_name).strip(),
            compound_image=str(cells.get("化合物图片", "")).strip() or None,
            cas_number=str(cells.get("CAS号", "")).strip() or None,
            assembly_type=str(cells.get("组装类型", "")).strip().replace("\n", "; ") or None,
            particle_size=size_text or None,
            solvent=solvent,
            concentration=concentration,
            preparation_method=str(cells.get("实验方法", "")).strip() or None,
            size_nm_min=size_nm_min,
            size_nm_max=size_nm_max,
            doi=str(cells.get("参考文献（DOI号）", "")).strip() or None,
            description=description,
            assembly_temperature=str(cells.get("组装温度", "")).strip() or None,
            ph_value=str(cells.get("pH值", "")).strip() or None,
            stirring_condition=str(cells.get("搅拌/超声条件", "")).strip() or None,
            assembly_time=str(cells.get("组装（搅拌）时间", "")).strip() or None,
            molecular_characteristics=mol_char or None,
            notes=str(cells.get("备注", "")).strip() or None,
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
