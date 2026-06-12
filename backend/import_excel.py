"""Import data from the standardized 超分子数据库 Excel into the SUPRA database.

Excel format: 53 columns, 3-row merged header, data starts row 4.
"""
import os
import re
import openpyxl
from database import engine, Base, get_db
from models import Assembly, BuildingBlock, DrivingForce, Morphology, Property, AssemblyDriveMethod

EXCEL_PATH = os.environ.get(
    "EXCEL_PATH",
    os.path.join(os.path.dirname(__file__), "data", "260611_超分子数据库整理_修改(2).xlsx"),
)
IMAGES_DIR = os.environ.get(
    "IMAGES_DIR",
    os.path.join(os.path.dirname(__file__), "data", "images"),
)


def split_items(text: str) -> list[str]:
    if not text:
        return []
    text = text.replace("；", ";").replace("\n", ";").replace("\r", ";")
    parts = [p.strip() for p in text.split(";") if p.strip()]
    cleaned = []
    for p in parts:
        p = re.sub(r'^\d+[\.\、\s]+', '', p).strip()
        if p and not p.startswith("—"):
            cleaned.append(p)
    return cleaned


def parse_size_range(size_text: str) -> tuple[float | None, float | None]:
    if not size_text:
        return None, None
    m = re.search(r'(\d+\.?\d*)\s*±\s*(\d+\.?\d*)', size_text)
    if m:
        return float(m.group(1)) - float(m.group(2)), float(m.group(1)) + float(m.group(2))
    m = re.search(r'(\d+\.?\d*)\s*[–\-~]\s*(\d+\.?\d*)', size_text)
    if m:
        return float(m.group(1)), float(m.group(2))
    m = re.search(r'(\d+\.?\d*)', size_text)
    if m:
        v = float(m.group(1))
        return v, v
    return None, None


def clean_cas(cas: str) -> str:
    """Normalize CAS number: replace non-breaking hyphens, extract first valid CAS."""
    cas = cas.replace("‑", "-").strip()
    # If contains multiple CAS numbers like "Rg1：22427-39-0   Rb1：41753-43-9"
    # Extract the first CAS-like pattern
    m = re.search(r'(\d{2,7}-\d{2}-\d)', cas)
    if m:
        return m.group(1)
    return cas


def import_data():
    # Drop and recreate all tables
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = next(get_db())

    wb = openpyxl.load_workbook(EXCEL_PATH)
    ws = wb.active

    # Data starts at row 4 (rows 1-3 are merged headers)
    DATA_START = 4

    # Column mapping (1-indexed) for the new standardized template:
    COL = {
        "compound_type": 2,
        "compound_name": 3,
        "english_name": 4,
        "compound_image": 5,
        "smiles": 6,
        "cas": 7,
        "app_name": 8,
        "is_cosmetic": 9,
        "cosmetic_note": 10,
        "is_drug": 11,
        "drug_note": 12,
        "is_food": 13,
        "food_note": 14,
        "food_category": 15,
        "food_daily_intake": 16,
        "regulations": 17,
        "component_count": 18,
        "assembly_drive_method": 19,
        "assembly_type": 20,
        "responsiveness": 21,
        "surface_modification": 22,
        "driving_force": 23,
        "morphology": 24,
        "particle_size": 25,
        "size_note": 26,
        "size_source": 27,
        "aqueous_phase": 28,
        "organic_phase": 29,
        "solute": 30,
        "concentration": 31,
        "component_ratio": 32,
        "temperature": 33,
        "temperature_note": 34,
        "ph": 35,
        "ph_note": 36,
        "stirring": 37,
        "assembly_time": 38,
        "biological_activity": 39,
        "preparation_method": 40,
        "doi": 41,
        "molecular_char": 42,
        "notes": 43,
        "url": 44,
    }

    # --- Extract embedded images ---
    os.makedirs(IMAGES_DIR, exist_ok=True)
    row_images: dict[int, list[tuple[bytes, str]]] = {}

    # Use openpyxl's _images first (works on macOS/Windows)
    for img in ws._images:
        img_data = img._data()
        img_fmt = img.format or "png"
        af = img.anchor._from
        at = img.anchor.to if hasattr(img.anchor, "to") else None
        from_excel = af.row + 1
        to_excel = (at.row + 1) if at else from_excel
        for r in range(from_excel, to_excel + 1):
            row_images.setdefault(r, []).append((img_data, img_fmt))

    # Fallback: extract directly from ZIP (fixes Linux openpyxl bug)
    if not row_images:
        import zipfile
        from xml.etree import ElementTree as ET
        with zipfile.ZipFile(EXCEL_PATH) as z:
            # Parse drawing relationships: rId → media file
            drawing_rels = {}
            rels_path = "xl/drawings/_rels/drawing1.xml.rels"
            if rels_path in z.namelist():
                ns = {"r": "http://schemas.openxmlformats.org/package/2006/relationships"}
                tree = ET.fromstring(z.read(rels_path))
                for rel in tree:
                    rid = rel.get("Id")
                    target = rel.get("Target")
                    if target and "image" in target.lower():
                        drawing_rels[rid] = target.replace("../media/", "")

            # Parse drawing XML: image anchor row → media rId
            drawing_path = "xl/drawings/drawing1.xml"
            if drawing_path in z.namelist():
                ns = {
                    "xdr": "http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing",
                    "a": "http://schemas.openxmlformats.org/drawingml/2006/main",
                }
                tree = ET.fromstring(z.read(drawing_path))
                for anchor in tree.iter("{%s}twoCellAnchor" % ns["xdr"]):
                    from_el = anchor.find("xdr:from", ns)
                    to_el = anchor.find("xdr:to", ns)
                    if from_el is None:
                        continue
                    from_row = int(from_el.find("xdr:row", ns).text)
                    to_row = (int(to_el.find("xdr:row", ns).text) + 1) if to_el is not None else from_row + 1
                    # Excel rows are 0-indexed, +1 for 1-indexed display row
                    for r in range(from_row + 1, to_row + 1):
                        # Find blip embed rId
                        for blip in anchor.iter("{%s}blip" % ns["a"]):
                            embed = blip.get("{http://schemas.openxmlformats.org/officeDocument/2006/relationships}embed")
                            if embed and embed in drawing_rels:
                                media_file = drawing_rels[embed]
                                img_bytes = z.read(f"xl/media/{media_file}")
                                fmt = media_file.rsplit(".", 1)[-1]
                                row_images.setdefault(r, []).append((img_bytes, fmt))

            z.close()

    print(f"Found {sum(len(v) for v in row_images.values())} images covering {len(row_images)} rows.")
    print(f"Reading {ws.max_row - DATA_START + 1} data rows...")

    imported = 0
    for row_idx in range(DATA_START, ws.max_row + 1):
        def cell(c):
            v = ws.cell(row=row_idx, column=c).value
            return str(v).strip() if v is not None else ""

        compound_name = cell(COL["compound_name"])
        if not compound_name:
            continue

        # --- Building Block (normalize names) ---
        bb_name = cell(COL["compound_type"])
        if bb_name == "生物碱类":
            bb_name = "生物碱"
        bb = None
        if bb_name:
            bb = db.query(BuildingBlock).filter_by(name=bb_name).first()
            if not bb:
                bb = BuildingBlock(name=bb_name)
                db.add(bb)
                db.flush()

        # --- Morphology ---
        morph_raw = cell(COL["morphology"]).split("\n")[0].split("；")[0].split(";")[0].strip()
        morph_name = re.sub(r'^\d+[\.\、\s]+', '', morph_raw).strip()
        morph = None
        if morph_name:
            morph = db.query(Morphology).filter_by(name=morph_name).first()
            if not morph:
                morph = Morphology(name=morph_name, description=morph_name)
                db.add(morph)
                db.flush()

        # --- Assembly Drive Method ---
        dm_name = cell(COL["assembly_drive_method"])
        drive_method = None
        if dm_name:
            drive_method = db.query(AssemblyDriveMethod).filter_by(name=dm_name).first()
            if not drive_method:
                drive_method = AssemblyDriveMethod(name=dm_name)
                db.add(drive_method)
                db.flush()

        # --- Driving Forces ---
        df_names = split_items(cell(COL["driving_force"]))
        driving_forces = []
        for df_name in df_names:
            df = db.query(DrivingForce).filter_by(name=df_name).first()
            if not df:
                df = DrivingForce(name=df_name)
                db.add(df)
                db.flush()
            driving_forces.append(df)

        # --- Properties (from biological activity) ---
        bio_text = cell(COL["biological_activity"])
        prop_names = split_items(bio_text)
        properties = []
        for p_name in prop_names:
            if len(p_name) > 200:
                p_name = p_name[:200]
            p = db.query(Property).filter_by(name=p_name).first()
            if not p:
                p = Property(name=p_name)
                db.add(p)
                db.flush()
            properties.append(p)

        # --- Particle size ---
        size_text = cell(COL["particle_size"])
        size_min, size_max = parse_size_range(size_text)

        # --- CAS normalization ---
        cas = clean_cas(cell(COL["cas"]))

        # --- Boolean helpers ---
        def opt(k, default=None):
            v = cell(k)
            if not v or v == "无":
                return default
            return v

        # --- Extract and save compound image ---
        compound_image = None
        imgs = row_images.get(row_idx)
        if imgs:
            img_data, img_fmt = imgs[0]
            img_filename = f"{row_idx}.{img_fmt}"
            img_path = os.path.join(IMAGES_DIR, img_filename)
            with open(img_path, "wb") as f:
                f.write(img_data)
            compound_image = f"/images/{img_filename}"

        assembly = Assembly(
            name=compound_name,
            english_name=opt(COL["english_name"]),
            compound_image=compound_image,
            smiles=opt(COL["smiles"]),
            cas_number=cas or None,
            assembly_type=opt(COL["assembly_type"]),
            particle_size=size_text or None,
            aqueous_phase=opt(COL["aqueous_phase"]),
            organic_phase=opt(COL["organic_phase"]),
            solute=opt(COL["solute"]),
            concentration=opt(COL["concentration"]),
            component_ratio=opt(COL["component_ratio"]),
            preparation_method=opt(COL["preparation_method"]),
            size_nm_min=size_min,
            size_nm_max=size_max,
            size_note=opt(COL["size_note"]),
            size_source=opt(COL["size_source"]),
            doi=opt(COL["doi"]),
            biological_activity=bio_text or None,
            assembly_temperature=opt(COL["temperature"]),
            temperature_note=opt(COL["temperature_note"]),
            ph_value=opt(COL["ph"]),
            ph_note=opt(COL["ph_note"]),
            stirring_condition=opt(COL["stirring"]),
            assembly_time=opt(COL["assembly_time"]),
            molecular_characteristics=opt(COL["molecular_char"]),
            notes=opt(COL["notes"]),
            is_cosmetic=cell(COL["is_cosmetic"]) == "是",
            cosmetic_note=opt(COL["cosmetic_note"]),
            is_drug=cell(COL["is_drug"]) == "是",
            drug_note=opt(COL["drug_note"]),
            is_food=cell(COL["is_food"]) == "是",
            food_note=opt(COL["food_note"]),
            food_category=opt(COL["food_category"]),
            food_daily_intake=opt(COL["food_daily_intake"]),
            regulations=opt(COL["regulations"]),
            component_count=opt(COL["component_count"]),
            responsiveness=opt(COL["responsiveness"]),
            surface_modification=opt(COL["surface_modification"]),
            url=opt(COL["url"]),
            building_block_id=bb.id if bb else None,
            morphology_id=morph.id if morph else None,
            assembly_drive_method_id=drive_method.id if drive_method else None,
        )
        assembly.driving_forces = driving_forces
        assembly.properties = properties
        db.add(assembly)

        imported += 1
        if imported % 20 == 0:
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
    print(f"  Assembly Drive Methods: {db2.query(AssemblyDriveMethod).count()}")
    print(f"  Assemblies: {db2.query(Assembly).count()}")
    db2.close()


if __name__ == "__main__":
    import_data()
