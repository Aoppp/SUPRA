from sqlalchemy.orm import Session, joinedload
from models import Assembly, BuildingBlock, DrivingForce, Morphology, CharacterizationMethod, Property, WorkProgress
from schemas import SearchParams, AssemblyCreate, WorkProgressCreate
import os


def get_building_block_list(db: Session):
    return db.query(BuildingBlock).order_by(BuildingBlock.name).all()


def get_morphology_list(db: Session):
    return db.query(Morphology).order_by(Morphology.name).all()


def get_driving_force_list(db: Session):
    return db.query(DrivingForce).order_by(DrivingForce.name).all()


def get_property_list(db: Session):
    return db.query(Property).order_by(Property.name).all()


def get_assembly_detail(db: Session, assembly_id: int):
    return (
        db.query(Assembly)
        .options(
            joinedload(Assembly.building_block),
            joinedload(Assembly.morphology),
            joinedload(Assembly.characterization_method),
            joinedload(Assembly.driving_forces),
            joinedload(Assembly.properties),
        )
        .filter(Assembly.id == assembly_id)
        .first()
    )


def search_assemblies(db: Session, params: SearchParams):
    query = db.query(Assembly).options(
        joinedload(Assembly.building_block),
        joinedload(Assembly.morphology),
        joinedload(Assembly.driving_forces),
        joinedload(Assembly.properties),
    )

    if params.name:
        query = query.filter(Assembly.name.ilike(f"%{params.name}%"))

    if params.building_block:
        query = query.join(Assembly.building_block).filter(
            BuildingBlock.name.ilike(f"%{params.building_block}%")
        )

    if params.morphology:
        query = query.join(Assembly.morphology).filter(
            Morphology.name.ilike(f"%{params.morphology}%")
        )

    if params.driving_force:
        query = query.join(Assembly.driving_forces).filter(
            DrivingForce.name.ilike(f"%{params.driving_force}%")
        )

    if params.property:
        query = query.join(Assembly.properties).filter(
            Property.name.ilike(f"%{params.property}%")
        )

    if params.solvent:
        query = query.filter(Assembly.solvent.ilike(f"%{params.solvent}%"))

    if params.assembly_type:
        query = query.filter(Assembly.assembly_type.ilike(f"%{params.assembly_type}%"))

    if params.size_min is not None:
        query = query.filter(Assembly.size_nm_min >= params.size_min)
    if params.size_max is not None:
        query = query.filter(Assembly.size_nm_max <= params.size_max)

    query = query.distinct()

    total = query.count()
    results = (
        query
        .offset((params.page - 1) * params.page_size)
        .limit(params.page_size)
        .all()
    )

    return total, results


def create_assembly(db: Session, data: AssemblyCreate):
    a = Assembly(**data.model_dump(exclude_unset=True))
    db.add(a)
    db.commit()
    db.refresh(a)
    return a


def search_by_cas(db: Session, cas: str):
    """Find assemblies by CAS number partial match."""
    from sqlalchemy.orm import joinedload
    return (
        db.query(Assembly)
        .filter(Assembly.cas_number.ilike(f"%{cas}%"))
        .options(
            joinedload(Assembly.building_block),
            joinedload(Assembly.morphology),
            joinedload(Assembly.driving_forces),
            joinedload(Assembly.properties),
        )
        .order_by(Assembly.id)
        .all()
    )


def get_work_progress_list(db: Session):
    return db.query(WorkProgress).order_by(WorkProgress.created_at.desc()).all()


def create_work_progress(db: Session, data: WorkProgressCreate, file_path: str | None = None):
    wp = WorkProgress(
        person_name=data.person_name,
        file_name=data.file_name,
        file_path=file_path,
        file_type=data.file_type,
        description=data.description,
    )
    db.add(wp)
    db.commit()
    db.refresh(wp)
    return wp


def delete_work_progress(db: Session, wp_id: int):
    wp = db.query(WorkProgress).filter(WorkProgress.id == wp_id).first()
    if not wp:
        return False
    if wp.file_path:
        file_path = os.path.join(UPLOAD_DIR, os.path.basename(wp.file_path))
        if os.path.exists(file_path):
            os.remove(file_path)
    db.delete(wp)
    db.commit()
    return True


def batch_create_assemblies(db: Session, rows: list[dict]):
    """Create assemblies from a list of dicts (parsed from Excel rows).
    Each dict should have keys matching Assembly fields plus:
    - building_block: str name (lookup or create)
    - morphology: str name (lookup or create)
    - driving_forces: str (semicolon-separated names)
    - properties: str (semicolon-separated names)
    Returns (created_count, error_rows).
    """
    created = 0
    errors: list[dict] = []

    for i, row in enumerate(rows):
        try:
            name = (row.get("name") or "").strip()
            if not name:
                errors.append({"row": i + 1, "error": "name is required"})
                continue

            # Building block by name
            bb = None
            bb_name = (row.get("building_block") or "").strip()
            if bb_name:
                bb = db.query(BuildingBlock).filter(BuildingBlock.name == bb_name).first()
                if not bb:
                    bb = BuildingBlock(name=bb_name)
                    db.add(bb)
                    db.flush()

            # Morphology by name
            morph = None
            morph_name = (row.get("morphology") or "").strip()
            if morph_name:
                morph = db.query(Morphology).filter(Morphology.name == morph_name).first()
                if not morph:
                    morph = Morphology(name=morph_name, description=morph_name)
                    db.add(morph)
                    db.flush()

            # Driving forces
            driving_forces = []
            df_text = (row.get("driving_forces") or "").strip()
            if df_text:
                for df_name in _split_items(df_text):
                    df = db.query(DrivingForce).filter(DrivingForce.name == df_name).first()
                    if not df:
                        df = DrivingForce(name=df_name)
                        db.add(df)
                        db.flush()
                    driving_forces.append(df)

            # Properties
            properties = []
            prop_text = (row.get("properties") or "").strip()
            if prop_text:
                for p_name in _split_items(prop_text):
                    if len(p_name) > 200:
                        p_name = p_name[:200]
                    p = db.query(Property).filter(Property.name == p_name).first()
                    if not p:
                        p = Property(name=p_name)
                        db.add(p)
                        db.flush()
                    properties.append(p)

            # Parse size range
            size_min = None
            size_max = None
            smin = row.get("size_nm_min")
            smax = row.get("size_nm_max")
            if smin is not None and str(smin).strip():
                try:
                    size_min = float(smin)
                except ValueError:
                    pass
            if smax is not None and str(smax).strip():
                try:
                    size_max = float(smax)
                except ValueError:
                    pass

            assembly = Assembly(
                name=name,
                english_name=str(row.get("english_name", "")).strip() or None,
                compound_image=str(row.get("compound_image", "")).strip() or None,
                smiles=str(row.get("smiles", "")).strip() or None,
                cas_number=str(row.get("cas_number", "")).strip() or None,
                assembly_type=str(row.get("assembly_type", "")).strip() or None,
                particle_size=str(row.get("particle_size", "")).strip() or None,
                solvent=str(row.get("solvent", "")).strip()[:200] or None,
                solute=str(row.get("solute", "")).strip()[:300] or None,
                concentration=str(row.get("concentration", "")).strip()[:200] or None,
                preparation_method=str(row.get("preparation_method", "")).strip() or None,
                size_nm_min=size_min,
                size_nm_max=size_max,
                doi=str(row.get("doi", "")).strip() or None,
                description=str(row.get("description", "")).strip() or None,
                biological_activity=str(row.get("biological_activity", "")).strip() or None,
                assembly_temperature=str(row.get("assembly_temperature", "")).strip() or None,
                ph_value=str(row.get("ph_value", "")).strip() or None,
                stirring_condition=str(row.get("stirring_condition", "")).strip() or None,
                assembly_time=str(row.get("assembly_time", "")).strip() or None,
                molecular_characteristics=str(row.get("molecular_characteristics", "")).strip() or None,
                notes=str(row.get("notes", "")).strip() or None,
                building_block_id=bb.id if bb else None,
                morphology_id=morph.id if morph else None,
                driving_forces=driving_forces,
                properties=properties,
            )
            db.add(assembly)
            db.flush()
            created += 1
        except Exception as e:
            errors.append({"row": i + 1, "error": str(e)})

    if created > 0:
        db.commit()
    return created, errors


def _split_items(text: str) -> list[str]:
    """Split text by semicolons, newlines and clean. Returns non-empty strings."""
    import re
    if not text:
        return []
    text = text.replace("；", ";").replace("\n", ";").replace("\r", ";")
    parts = [p.strip() for p in text.split(";") if p.strip()]
    return [re.sub(r'^\d+[\.\、\s]+', '', p).strip() for p in parts]


# Category lookup: 食品=GB 2760 foodmate, 化妆品=cosmetic ingredient directory
_CATEGORY_MAP: dict[int, str] = {}
for _fid in [6, 31, 48, 49, 52, 66]:
    _CATEGORY_MAP[_fid] = "食品"
for _cid in [3, 5, 6, 10, 14, 32, 48, 49, 50, 52, 62]:
    _existing = _CATEGORY_MAP.get(_cid)
    _CATEGORY_MAP[_cid] = "食品和化妆品" if _existing else "化妆品"


def get_category(assembly_id: int) -> str | None:
    cat = _CATEGORY_MAP.get(assembly_id)
    if cat:
        return cat
    return "药品"


# Foodmate GB 2760 faid mapping (same IDs as cfsa.net.cn / foodmate.net)
_FOODMATE_FAID: dict[int, int] = {
    6: 87,    # 姜黄素
    31: 278,  # 皂树皮提取物 (皂树皂苷)
    48: 49,   # 甘草酸 → 甘草酸盐
    49: 49,   # 甘草酸 → 甘草酸盐
    52: 253,  # 叶黄素
    66: 229,  # 甜菊糖苷
}


def get_foodmate_url(assembly_id: int, name: str) -> str | None:
    cat = _CATEGORY_MAP.get(assembly_id)
    if cat and "食品" in cat:
        faid = _FOODMATE_FAID.get(assembly_id)
        if faid:
            return f"https://2760.foodmate.net/addtives/faid/{faid}.html"
        from urllib.parse import quote
        return f"https://2760.foodmate.net/addtives/search?keyword={quote(name)}"
    return None


UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "data", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
