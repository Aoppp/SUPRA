from sqlalchemy.orm import Session, joinedload
from models import Assembly, BuildingBlock, DrivingForce, Morphology, Property, AssemblyDriveMethod, WorkProgress
from schemas import SearchParams, AssemblyCreate, WorkProgressCreate
import os
import re
from datetime import date, timedelta


def get_building_block_list(db: Session):
    return db.query(BuildingBlock).order_by(BuildingBlock.name).all()


def get_morphology_list(db: Session):
    return db.query(Morphology).order_by(Morphology.name).all()


def get_driving_force_list(db: Session):
    return db.query(DrivingForce).order_by(DrivingForce.name).all()


def get_property_list(db: Session):
    return db.query(Property).order_by(Property.name).all()


def get_assembly_drive_method_list(db: Session):
    return db.query(AssemblyDriveMethod).order_by(AssemblyDriveMethod.name).all()


def get_assembly_detail(db: Session, assembly_id: int):
    return (
        db.query(Assembly)
        .options(
            joinedload(Assembly.building_block),
            joinedload(Assembly.morphology),
            joinedload(Assembly.characterization_method),
            joinedload(Assembly.assembly_drive_method),
            joinedload(Assembly.driving_forces),
            joinedload(Assembly.properties),
        )
        .filter(Assembly.id == assembly_id)
        .first()
    )


def search_assemblies(db: Session, params: SearchParams):
    query = _build_base_query(db, params).options(
        joinedload(Assembly.building_block),
        joinedload(Assembly.morphology),
        joinedload(Assembly.assembly_drive_method),
        joinedload(Assembly.driving_forces),
        joinedload(Assembly.properties),
    )
    total = query.count()
    results = (
        query
        .offset((params.page - 1) * params.page_size)
        .limit(params.page_size)
        .all()
    )
    return total, results


def create_assembly(db: Session, data: AssemblyCreate):
    dump = data.model_dump(exclude_unset=True)
    df_ids = dump.pop("driving_force_ids", None)
    prop_ids = dump.pop("property_ids", None)
    a = Assembly(**dump)
    if df_ids:
        dfs = db.query(DrivingForce).filter(DrivingForce.id.in_(df_ids)).all()
        a.driving_forces = dfs
    if prop_ids:
        props = db.query(Property).filter(Property.id.in_(prop_ids)).all()
        a.properties = props
    db.add(a)
    db.commit()
    db.refresh(a)
    return a


def search_by_cas(db: Session, cas: str):
    return (
        db.query(Assembly)
        .filter(Assembly.cas_number.ilike(f"%{cas}%"))
        .options(
            joinedload(Assembly.building_block),
            joinedload(Assembly.morphology),
            joinedload(Assembly.assembly_drive_method),
            joinedload(Assembly.driving_forces),
            joinedload(Assembly.properties),
        )
        .order_by(Assembly.id)
        .all()
    )


def compute_category(a: Assembly) -> str | None:
    """Compute application category from is_cosmetic/is_drug/is_food flags."""
    cats = []
    if a.is_food:
        cats.append("食品")
    if a.is_cosmetic:
        cats.append("化妆品")
    if a.is_drug:
        cats.append("药品")
    if not cats:
        return None
    return "、".join(cats)


def compute_foodmate_url(a: Assembly) -> str | None:
    """Generate foodmate.net search URL for food ingredients."""
    if not a.is_food:
        return None
    from urllib.parse import quote
    return f"https://2760.foodmate.net/addtives/search?keyword={quote(a.name)}"


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


def _split_items(text: str) -> list[str]:
    """Split text by semicolons, newlines and clean. Returns non-empty strings."""
    if not text:
        return []
    text = text.replace("；", ";").replace("\n", ";").replace("\r", ";")
    parts = [p.strip() for p in text.split(";") if p.strip()]
    cleaned = [re.sub(r'^\d+[\.\、\s]+', '', p).strip() for p in parts]
    return [c for c in cleaned if c]


def _parse_bool(val: str) -> bool:
    """Parse Chinese yes/no to boolean."""
    return val.strip() == "是"


def _parse_size_range(size_text: str) -> tuple[float | None, float | None]:
    """Extract min/max particle size from text. Handles: 222.0±7.57, 200–300, 50, etc."""
    if not size_text:
        return None, None
    # Range with ±
    m = re.search(r'(\d+\.?\d*)\s*±\s*(\d+\.?\d*)', size_text)
    if m:
        return float(m.group(1)) - float(m.group(2)), float(m.group(1)) + float(m.group(2))
    # Range with – or -
    m = re.search(r'(\d+\.?\d*)\s*[–\-~]\s*(\d+\.?\d*)', size_text)
    if m:
        return float(m.group(1)), float(m.group(2))
    # Single number
    m = re.search(r'(\d+\.?\d*)', size_text)
    if m:
        v = float(m.group(1))
        return v, v
    return None, None


def batch_create_assemblies(db: Session, rows: list[dict]):
    """Create assemblies from parsed Excel rows (new 53-column format).
    Replaces existing Assembly data on success; rolls back entirely on total failure.
    Returns (created_count, error_rows).
    """
    old_ids = {a.id for a in db.query(Assembly).all()}
    new_ids: list[int] = []
    created = 0
    errors: list[dict] = []

    for i, row in enumerate(rows):
        try:
            name = (row.get("name") or "").strip()
            if not name:
                errors.append({"row": i + 1, "error": "name is required"})
                continue

            # Building block
            bb = None
            bb_name = (row.get("building_block") or "").strip()
            if bb_name:
                # Normalize: 生物碱类→生物碱
                if bb_name == "生物碱类":
                    bb_name = "生物碱"
                bb = db.query(BuildingBlock).filter(BuildingBlock.name == bb_name).first()
                if not bb:
                    bb = BuildingBlock(name=bb_name)
                    db.add(bb)
                    db.flush()

            # Morphology
            morph = None
            morph_name = (row.get("morphology") or "").strip()
            if morph_name:
                morph = db.query(Morphology).filter(Morphology.name == morph_name).first()
                if not morph:
                    morph = Morphology(name=morph_name, description=morph_name)
                    db.add(morph)
                    db.flush()

            # Assembly drive method
            drive_method = None
            dm_name = (row.get("assembly_drive_method") or "").strip()
            if dm_name:
                drive_method = db.query(AssemblyDriveMethod).filter(
                    AssemblyDriveMethod.name == dm_name
                ).first()
                if not drive_method:
                    drive_method = AssemblyDriveMethod(name=dm_name)
                    db.add(drive_method)
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

            # Properties (from biological activity)
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

            size_min, size_max = _parse_size_range(
                row.get("particle_size", "") or ""
            )

            def _opt(k, default=None):
                v = (row.get(k) or "").strip()
                if not v or v == "无":
                    return default
                return v

            def _opt_bool(k):
                return _parse_bool(row.get(k) or "")

            mw_raw = row.get("molecular_weight")
            molecular_weight = None
            if mw_raw:
                try:
                    molecular_weight = float(mw_raw)
                except (TypeError, ValueError):
                    pass

            assembly = Assembly(
                name=name,
                english_name=_opt("english_name"),
                compound_image=_opt("compound_image"),
                compound_type=_opt("compound_type"),
                molecular_weight=molecular_weight,
                smiles=_opt("smiles"),
                cas_number=_opt("cas_number"),
                assembly_type=_opt("assembly_type"),
                particle_size=_opt("particle_size"),
                aqueous_phase=_opt("aqueous_phase"),
                organic_phase=_opt("organic_phase"),
                solute=_opt("solute"),
                concentration=_opt("concentration"),
                component_ratio=_opt("component_ratio"),
                preparation_method=_opt("preparation_method"),
                size_nm_min=size_min,
                size_nm_max=size_max,
                size_note=_opt("size_note"),
                size_source=_opt("size_source"),
                doi=_opt("doi"),
                biological_activity=_opt("biological_activity"),
                assembly_temperature=_opt("assembly_temperature"),
                temperature_note=_opt("temperature_note"),
                ph_value=_opt("ph_value"),
                ph_note=_opt("ph_note"),
                stirring_condition=_opt("stirring_condition"),
                assembly_time=_opt("assembly_time"),
                molecular_characteristics=_opt("molecular_characteristics"),
                notes=_opt("notes"),
                is_cosmetic=_opt_bool("is_cosmetic"),
                cosmetic_note=_opt("cosmetic_note"),
                is_drug=_opt_bool("is_drug"),
                drug_note=_opt("drug_note"),
                is_food=_opt_bool("is_food"),
                food_note=_opt("food_note"),
                food_category=_opt("food_category"),
                food_daily_intake=_opt("food_daily_intake"),
                regulations=_opt("regulations"),
                component_count=_opt("component_count"),
                responsiveness=_opt("responsiveness"),
                surface_modification=_opt("surface_modification"),
                url=_opt("url"),
                building_block_id=bb.id if bb else None,
                morphology_id=morph.id if morph else None,
                assembly_drive_method_id=drive_method.id if drive_method else None,
                driving_forces=driving_forces,
                properties=properties,
            )
            db.add(assembly)
            db.flush()
            new_ids.append(assembly.id)
            created += 1
        except Exception as e:
            errors.append({"row": i + 1, "error": str(e)})

    if created > 0:
        # Replace old assemblies (but keep new ones) in a single transaction
        db.query(Assembly).filter(Assembly.id.in_(old_ids)).delete(synchronize_session='fetch')
        db.commit()
    return created, errors


UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "data", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


def increment_view_count(db: Session, assembly_id: int):
    a = db.query(Assembly).filter(Assembly.id == assembly_id).first()
    if a:
        a.view_count = (a.view_count or 0) + 1
        db.commit()


def log_visit(db: Session, ip: str, path: str, ua: str | None = None, referer: str | None = None):
    from models import VisitLog
    v = VisitLog(ip_address=ip, path=path, user_agent=ua, referer=referer)
    db.add(v)
    db.commit()


def get_visits(
    db: Session,
    page: int = 1,
    page_size: int = 20,
    date_from: str | None = None,
    date_to: str | None = None,
):
    from models import VisitLog
    from sqlalchemy import func as sa_func
    q = db.query(VisitLog)
    if date_from:
        q = q.filter(sa_func.date(VisitLog.created_at) >= date_from)
    if date_to:
        q = q.filter(sa_func.date(VisitLog.created_at) <= date_to)
    total = q.count()
    results = q.order_by(VisitLog.created_at.desc()) \
        .offset((page - 1) * page_size) \
        .limit(page_size).all()
    return total, results


def get_admin_stats(db: Session, date_from: str | None = None, date_to: str | None = None):
    from models import VisitLog
    from sqlalchemy import func as sa_func, distinct
    from datetime import date as date_type

    today = date.today()

    base = db.query(VisitLog)
    if date_from:
        base = base.filter(sa_func.date(VisitLog.created_at) >= date_from)
    if date_to:
        base = base.filter(sa_func.date(VisitLog.created_at) <= date_to)

    total_visits = base.count()
    # Count unique IPs within the filtered range
    ip_q = db.query(distinct(VisitLog.ip_address))
    if date_from:
        ip_q = ip_q.filter(sa_func.date(VisitLog.created_at) >= date_from)
    if date_to:
        ip_q = ip_q.filter(sa_func.date(VisitLog.created_at) <= date_to)
    unique_ips = ip_q.count()
    today_visits = db.query(sa_func.count(VisitLog.id)) \
        .filter(sa_func.date(VisitLog.created_at) == today).scalar() or 0
    today_unique = db.query(sa_func.count(distinct(VisitLog.ip_address))) \
        .filter(sa_func.date(VisitLog.created_at) == today).scalar() or 0
    total_assemblies = db.query(sa_func.count(Assembly.id)).scalar() or 0
    total_views = db.query(sa_func.sum(Assembly.view_count)).scalar() or 0

    # Daily trend for last 7 days (always show recent week)
    trend = []
    for i in range(6, -1, -1):
        d = today - timedelta(days=i)
        count = db.query(sa_func.count(VisitLog.id)) \
            .filter(sa_func.date(VisitLog.created_at) == d).scalar() or 0
        trend.append({"date": d.isoformat(), "count": count})

    return dict(
        total_visits=total_visits,
        unique_ips=unique_ips,
        today_visits=today_visits,
        today_unique_ips=today_unique,
        total_assemblies=total_assemblies,
        total_molecule_views=total_views,
        daily_trend=trend,
    )


def get_trend_data(db: Session, date_from: str, date_to: str):
    from models import VisitLog
    from sqlalchemy import func as sa_func, distinct

    daily = []
    d = date.fromisoformat(date_from)
    end = date.fromisoformat(date_to)
    while d <= end:
        day_visits = db.query(sa_func.count(VisitLog.id)) \
            .filter(sa_func.date(VisitLog.created_at) == d).scalar() or 0
        day_ips = db.query(sa_func.count(distinct(VisitLog.ip_address))) \
            .filter(sa_func.date(VisitLog.created_at) == d).scalar() or 0
        daily.append({
            "date": d.isoformat(),
            "visits": day_visits,
            "unique_ips": day_ips,
        })
        d += timedelta(days=1)
    return daily


def get_top_molecules(db: Session, n: int = 20):
    return db.query(Assembly) \
        .order_by(Assembly.view_count.desc()) \
        .limit(n).all()


def export_visits_csv(db: Session):
    from models import VisitLog
    import csv
    import io
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "IP地址", "访问路径", "User-Agent", "Referer", "时间"])
    for v in db.query(VisitLog).order_by(VisitLog.created_at.desc()).all():
        writer.writerow([v.id, v.ip_address, v.path, v.user_agent or "", v.referer or "",
                          v.created_at.isoformat() if v.created_at else ""])
    return output.getvalue()


def _build_base_query(db: Session, params: SearchParams):
    """Build a filtered Assembly query (no grouping)."""
    query = db.query(Assembly)

    if params.name:
        query = query.filter(Assembly.name.ilike(f"%{params.name}%"))
    if params.compound_type:
        query = query.filter(Assembly.compound_type == params.compound_type)
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
    if params.assembly_type:
        query = query.filter(Assembly.assembly_type.ilike(f"%{params.assembly_type}%"))
    if params.assembly_drive_method:
        query = query.join(Assembly.assembly_drive_method).filter(
            AssemblyDriveMethod.name.ilike(f"%{params.assembly_drive_method}%")
        )
    if params.is_cosmetic is not None:
        query = query.filter(Assembly.is_cosmetic == params.is_cosmetic)
    if params.is_drug is not None:
        query = query.filter(Assembly.is_drug == params.is_drug)
    if params.is_food is not None:
        query = query.filter(Assembly.is_food == params.is_food)
    if params.size_min is not None:
        query = query.filter(Assembly.size_nm_min >= params.size_min)
    if params.size_max is not None:
        query = query.filter(Assembly.size_nm_max <= params.size_max)
    return query.distinct()


def search_compounds_grouped(db: Session, params: SearchParams):
    """Return one entry per compound name with forms_count."""
    from sqlalchemy import func as sa_func

    base = _build_base_query(db, params)

    # Subquery: distinct names with count + min id as representative
    name_sub = (
        base.with_entities(
            Assembly.name,
            sa_func.min(Assembly.id).label("rep_id"),
            sa_func.count(Assembly.id).label("forms_count"),
        )
        .group_by(Assembly.name)
        .subquery()
    )

    # Join back to full Assembly for representative row data
    query = (
        db.query(Assembly, name_sub.c.forms_count)
        .join(name_sub, Assembly.id == name_sub.c.rep_id)
        .order_by(Assembly.name)
    )

    total = query.count()
    rows = (
        query
        .offset((params.page - 1) * params.page_size)
        .limit(params.page_size)
        .all()
    )

    # For each representative, fetch all assembly_types across all rows with same name
    results = []
    names_on_page = [a.name for a, _ in rows]
    # Get all assembly_types for these names matching filters
    base_for_types = _build_base_query(db, params)
    atypes_rows = (
        base_for_types
        .filter(Assembly.name.in_(names_on_page))
        .with_entities(Assembly.name, Assembly.assembly_type)
        .all()
    )
    atypes_by_name: dict[str, list[str]] = {}
    for n, at in atypes_rows:
        if at:
            atypes_by_name.setdefault(n, [])
            if at not in atypes_by_name[n]:
                atypes_by_name[n].append(at)

    for assembly, forms_count in rows:
        results.append({
            "representative_id": assembly.id,
            "name": assembly.name,
            "english_name": assembly.english_name,
            "compound_image": assembly.compound_image,
            "compound_type": assembly.compound_type,
            "molecular_weight": assembly.molecular_weight,
            "cas_number": assembly.cas_number,
            "forms_count": forms_count,
            "assembly_types": atypes_by_name.get(assembly.name, []),
            "is_cosmetic": assembly.is_cosmetic,
            "is_drug": assembly.is_drug,
            "is_food": assembly.is_food,
            "category": compute_category(assembly),
        })

    return total, results


def get_compound_assemblies(db: Session, name: str):
    """Return all assembly records for a compound name."""
    return (
        db.query(Assembly)
        .options(
            joinedload(Assembly.morphology),
            joinedload(Assembly.assembly_drive_method),
            joinedload(Assembly.driving_forces),
        )
        .filter(Assembly.name == name)
        .order_by(Assembly.id)
        .all()
    )


def get_compound_type_counts(db: Session):
    from sqlalchemy import func as sa_func
    rows = (
        db.query(Assembly.compound_type, sa_func.count(Assembly.id).label("count"))
        .filter(Assembly.compound_type.isnot(None))
        .filter(Assembly.compound_type != "")
        .group_by(Assembly.compound_type)
        .order_by(sa_func.count(Assembly.id).desc())
        .all()
    )
    return [{"type": r[0], "count": r[1]} for r in rows]


def export_molecule_stats_csv(db: Session):
    import csv
    import io
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "化合物名称", "英文名", "CAS号", "查看次数"])
    for a in db.query(Assembly).order_by(Assembly.view_count.desc()).all():
        writer.writerow([a.id, a.name, a.english_name or "", a.cas_number or "", a.view_count or 0])
    return output.getvalue()
