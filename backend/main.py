from fastapi import FastAPI, Depends, Query, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import Optional
import io
import os
import shutil
from datetime import datetime

import openpyxl

from database import engine, Base, get_db

import crud
import schemas

app = FastAPI(title="SUPRA API", description="Supramolecular Assembly Database API", version="0.1.0")

CORS_ORIGINS = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,http://localhost:3000",
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/search", response_model=schemas.SearchResult)
def search(
    name: Optional[str] = Query(None),
    building_block: Optional[str] = Query(None),
    morphology: Optional[str] = Query(None),
    driving_force: Optional[str] = Query(None),
    property: Optional[str] = Query(None),
    solvent: Optional[str] = Query(None),
    assembly_type: Optional[str] = Query(None),
    size_min: Optional[float] = Query(None),
    size_max: Optional[float] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    params = schemas.SearchParams(
        name=name, building_block=building_block, morphology=morphology,
        driving_force=driving_force, property=property, solvent=solvent,
        assembly_type=assembly_type,
        size_min=size_min, size_max=size_max,
        page=page, page_size=page_size,
    )
    total, results = crud.search_assemblies(db, params)
    items = [schemas.AssemblyListItem.model_validate(r) for r in results]
    for item in items:
        item.category = crud.get_category(item.id)
        item.foodmate_url = crud.get_foodmate_url(item.id, item.name)
    return schemas.SearchResult(
        total=total, page=page, page_size=page_size,
        results=items,
    )


@app.get("/api/assemblies/{assembly_id}", response_model=schemas.AssemblyDetail)
def get_assembly(assembly_id: int, db: Session = Depends(get_db)):
    a = crud.get_assembly_detail(db, assembly_id)
    if not a:
        raise HTTPException(status_code=404, detail="Assembly not found")
    result = schemas.AssemblyDetail.model_validate(a)
    result.category = crud.get_category(result.id)
    result.foodmate_url = crud.get_foodmate_url(result.id, result.name)
    return result


@app.get("/api/building-blocks", response_model=list[schemas.BuildingBlockOut])
def list_building_blocks(db: Session = Depends(get_db)):
    return crud.get_building_block_list(db)


@app.get("/api/morphologies", response_model=list[schemas.MorphologyOut])
def list_morphologies(db: Session = Depends(get_db)):
    return crud.get_morphology_list(db)


@app.get("/api/driving-forces", response_model=list[schemas.DrivingForceOut])
def list_driving_forces(db: Session = Depends(get_db)):
    return crud.get_driving_force_list(db)


@app.get("/api/properties", response_model=list[schemas.PropertyOut])
def list_properties(db: Session = Depends(get_db)):
    return crud.get_property_list(db)


@app.post("/api/assemblies", response_model=schemas.AssemblyDetail)
def create_assembly(data: schemas.AssemblyCreate, db: Session = Depends(get_db)):
    return crud.create_assembly(db, data)


@app.post("/api/assemblies/batch")
async def batch_create_assemblies(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename or not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="Please upload an Excel file (.xlsx or .xls)")

    contents = await file.read()
    try:
        wb = openpyxl.load_workbook(io.BytesIO(contents))
    except Exception:
        raise HTTPException(status_code=400, detail="Failed to parse Excel file")

    ws = wb.active
    if ws.max_row < 2:
        raise HTTPException(status_code=400, detail="Excel file has no data rows")

    # Read header row
    headers = {c: str(ws.cell(row=1, column=c).value or "").strip().lower().replace(" ", "_")
               for c in range(1, ws.max_column + 1)}

    # Read data rows into list of dicts
    rows: list[dict] = []
    for r in range(2, ws.max_row + 1):
        row = {}
        for c in range(1, ws.max_column + 1):
            key = headers.get(c, f"col_{c}")
            val = ws.cell(row=r, column=c).value
            row[key] = str(val).strip() if val is not None else ""
        # Skip completely empty rows
        if any(v for v in row.values()):
            rows.append(row)

    if not rows:
        raise HTTPException(status_code=400, detail="No data rows found in Excel file")

    created, errors = crud.batch_create_assemblies(db, rows)
    return {"created": created, "errors": errors, "total_rows": len(rows)}


@app.delete("/api/assemblies/{assembly_id}")
def delete_assembly(assembly_id: int, db: Session = Depends(get_db)):
    a = crud.get_assembly_detail(db, assembly_id)
    if not a:
        raise HTTPException(status_code=404, detail="Assembly not found")
    db.delete(a)
    db.commit()
    return {"ok": True}


@app.get("/api/search-by-cas")
def search_by_cas(cas: str = Query(...), db: Session = Depends(get_db)):
    """Find assemblies by CAS number (exact or partial match)."""
    results = crud.search_by_cas(db, cas)
    items = [schemas.AssemblyListItem.model_validate(r) for r in results]
    for item in items:
        item.category = crud.get_category(item.id)
        item.foodmate_url = crud.get_foodmate_url(item.id, item.name)
    return items


@app.get("/api/workbench", response_model=list[schemas.WorkProgressOut])
def list_work_progress(db: Session = Depends(get_db)):
    return crud.get_work_progress_list(db)


@app.post("/api/workbench", response_model=schemas.WorkProgressOut)
async def upload_work_progress(
    person_name: str = Form(...),
    file_name: str = Form(...),
    file_type: str = Form("other"),
    description: str = Form(""),
    file: UploadFile | None = File(None),
    db: Session = Depends(get_db),
):
    file_path = None
    if file and file.filename:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        safe_name = f"{timestamp}_{file.filename}"
        dest = os.path.join(crud.UPLOAD_DIR, safe_name)
        with open(dest, "wb") as f:
            shutil.copyfileobj(file.file, f)
        file_path = f"/uploads/{safe_name}"

    data = schemas.WorkProgressCreate(
        person_name=person_name,
        file_name=file_name,
        file_type=file_type,
        description=description,
    )
    return crud.create_work_progress(db, data, file_path)


@app.delete("/api/workbench/{wp_id}")
def delete_work_progress(wp_id: int, db: Session = Depends(get_db)):
    ok = crud.delete_work_progress(db, wp_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Work progress entry not found")
    return {"ok": True}


@app.get("/api/structure-image/{assembly_id}")
def structure_image(assembly_id: int, db: Session = Depends(get_db)):
    """Generate a 2D chemical structure image from SMILES using RDKit."""
    from fastapi.responses import Response
    a = crud.get_assembly_detail(db, assembly_id)
    if not a or not a.smiles:
        raise HTTPException(status_code=404, detail="No SMILES available")

    try:
        from rdkit import Chem
        from rdkit.Chem import Draw
        from rdkit.Chem.Draw import rdMolDraw2D
        import io

        mol = Chem.MolFromSmiles(a.smiles)
        if mol is None:
            raise HTTPException(status_code=404, detail="Invalid SMILES")

        drawer = rdMolDraw2D.MolDraw2DCairo(300, 200)
        opts = drawer.drawOptions()
        opts.addStereoAnnotation = True
        drawer.DrawMolecule(mol)
        drawer.FinishDrawing()
        png_data = drawer.GetDrawingText()

        return Response(content=png_data, media_type="image/png")
    except ImportError:
        raise HTTPException(status_code=500, detail="RDKit not available")


# Serve uploaded files
@app.get("/uploads/{filepath:path}")
def serve_upload(filepath: str):
    path = os.path.join(crud.UPLOAD_DIR, filepath)
    if not os.path.exists(path):
        raise HTTPException(status_code=404)
    from fastapi.responses import FileResponse
    return FileResponse(path)
