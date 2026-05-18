from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class BuildingBlockOut(BaseModel):
    id: int
    name: str
    molecular_formula: Optional[str] = None
    smiles: Optional[str] = None
    category: Optional[str] = None
    model_config = {"from_attributes": True}


class DrivingForceOut(BaseModel):
    id: int
    name: str
    category: Optional[str] = None
    model_config = {"from_attributes": True}


class MorphologyOut(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    model_config = {"from_attributes": True}


class CharacterizationMethodOut(BaseModel):
    id: int
    name: str
    category: Optional[str] = None
    model_config = {"from_attributes": True}


class PropertyOut(BaseModel):
    id: int
    name: str
    category: Optional[str] = None
    model_config = {"from_attributes": True}


class AssemblyListItem(BaseModel):
    id: int
    name: str
    compound_image: Optional[str] = None
    cas_number: Optional[str] = None
    assembly_type: Optional[str] = None
    particle_size: Optional[str] = None
    doi: Optional[str] = None
    building_block: Optional[BuildingBlockOut] = None
    morphology: Optional[MorphologyOut] = None
    driving_forces: list[DrivingForceOut] = []
    properties: list[PropertyOut] = []
    description: Optional[str] = None
    model_config = {"from_attributes": True}


class AssemblyDetail(BaseModel):
    id: int
    name: str
    compound_image: Optional[str] = None
    cas_number: Optional[str] = None
    assembly_type: Optional[str] = None
    particle_size: Optional[str] = None
    solvent: Optional[str] = None
    concentration: Optional[str] = None
    preparation_method: Optional[str] = None
    size_nm_min: Optional[float] = None
    size_nm_max: Optional[float] = None
    doi: Optional[str] = None
    description: Optional[str] = None
    assembly_temperature: Optional[str] = None
    ph_value: Optional[str] = None
    stirring_condition: Optional[str] = None
    assembly_time: Optional[str] = None
    molecular_characteristics: Optional[str] = None
    notes: Optional[str] = None
    building_block: Optional[BuildingBlockOut] = None
    morphology: Optional[MorphologyOut] = None
    characterization_method: Optional[CharacterizationMethodOut] = None
    driving_forces: list[DrivingForceOut] = []
    properties: list[PropertyOut] = []
    model_config = {"from_attributes": True}


class SearchParams(BaseModel):
    name: Optional[str] = None
    building_block: Optional[str] = None
    morphology: Optional[str] = None
    driving_force: Optional[str] = None
    property: Optional[str] = None
    solvent: Optional[str] = None
    size_min: Optional[float] = None
    size_max: Optional[float] = None
    page: int = 1
    page_size: int = 20


class SearchResult(BaseModel):
    total: int
    page: int
    page_size: int
    results: list[AssemblyListItem]


class AssemblyCreate(BaseModel):
    name: str
    compound_image: Optional[str] = None
    cas_number: Optional[str] = None
    assembly_type: Optional[str] = None
    particle_size: Optional[str] = None
    solvent: Optional[str] = None
    concentration: Optional[str] = None
    preparation_method: Optional[str] = None
    size_nm_min: Optional[float] = None
    size_nm_max: Optional[float] = None
    doi: Optional[str] = None
    description: Optional[str] = None
    assembly_temperature: Optional[str] = None
    ph_value: Optional[str] = None
    stirring_condition: Optional[str] = None
    assembly_time: Optional[str] = None
    molecular_characteristics: Optional[str] = None
    notes: Optional[str] = None
    building_block_id: Optional[int] = None
    morphology_id: Optional[int] = None
    characterization_method_id: Optional[int] = None


class WorkProgressOut(BaseModel):
    id: int
    person_name: str
    file_name: str
    file_path: Optional[str] = None
    file_type: Optional[str] = None
    description: Optional[str] = None
    created_at: Optional[str] = None
    model_config = {"from_attributes": True}


class WorkProgressCreate(BaseModel):
    person_name: str
    file_name: str
    file_type: Optional[str] = None
    description: Optional[str] = None
