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


UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "data", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
