from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date


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


class AssemblyDriveMethodOut(BaseModel):
    id: int
    name: str
    model_config = {"from_attributes": True}


class CompoundTypeCount(BaseModel):
    type: str
    count: int


class CompoundGroupItem(BaseModel):
    representative_id: int
    name: str
    english_name: Optional[str] = None
    compound_image: Optional[str] = None
    compound_type: Optional[str] = None
    molecular_weight: Optional[float] = None
    cas_number: Optional[str] = None
    forms_count: int = 1
    assembly_types: list[str] = []
    is_cosmetic: bool = False
    is_drug: bool = False
    is_food: bool = False
    category: Optional[str] = None


class CompoundGroupResult(BaseModel):
    total: int
    page: int
    page_size: int
    results: list[CompoundGroupItem]


class AssemblyListItem(BaseModel):
    id: int
    name: str
    english_name: Optional[str] = None
    compound_image: Optional[str] = None
    compound_type: Optional[str] = None
    molecular_weight: Optional[float] = None
    smiles: Optional[str] = None
    cas_number: Optional[str] = None
    assembly_type: Optional[str] = None
    particle_size: Optional[str] = None
    aqueous_phase: Optional[str] = None
    organic_phase: Optional[str] = None
    solute: Optional[str] = None
    concentration: Optional[str] = None
    size_nm_min: Optional[float] = None
    size_nm_max: Optional[float] = None
    doi: Optional[str] = None
    biological_activity: Optional[str] = None
    building_block: Optional[BuildingBlockOut] = None
    morphology: Optional[MorphologyOut] = None
    driving_forces: list[DrivingForceOut] = []
    properties: list[PropertyOut] = []
    assembly_drive_method: Optional[AssemblyDriveMethodOut] = None
    is_cosmetic: bool = False
    is_drug: bool = False
    is_food: bool = False
    component_count: Optional[str] = None
    responsiveness: Optional[str] = None
    surface_modification: Optional[str] = None
    is_single_component: Optional[bool] = True
    assembly_components: Optional[str] = None
    category: Optional[str] = None
    foodmate_url: Optional[str] = None
    model_config = {"from_attributes": True}


class AssemblyDetail(BaseModel):
    id: int
    name: str
    english_name: Optional[str] = None
    compound_image: Optional[str] = None
    compound_type: Optional[str] = None
    molecular_weight: Optional[float] = None
    smiles: Optional[str] = None
    cas_number: Optional[str] = None
    assembly_type: Optional[str] = None
    particle_size: Optional[str] = None
    aqueous_phase: Optional[str] = None
    organic_phase: Optional[str] = None
    solute: Optional[str] = None
    concentration: Optional[str] = None
    component_ratio: Optional[str] = None
    preparation_method: Optional[str] = None
    size_nm_min: Optional[float] = None
    size_nm_max: Optional[float] = None
    size_note: Optional[str] = None
    size_source: Optional[str] = None
    doi: Optional[str] = None
    biological_activity: Optional[str] = None
    assembly_temperature: Optional[str] = None
    temperature_note: Optional[str] = None
    ph_value: Optional[str] = None
    ph_note: Optional[str] = None
    stirring_condition: Optional[str] = None
    assembly_time: Optional[str] = None
    molecular_characteristics: Optional[str] = None
    notes: Optional[str] = None

    # Application classification
    is_cosmetic: bool = False
    cosmetic_note: Optional[str] = None
    is_drug: bool = False
    drug_note: Optional[str] = None
    is_food: bool = False
    food_note: Optional[str] = None
    food_category: Optional[str] = None
    food_daily_intake: Optional[str] = None
    regulations: Optional[str] = None

    # Physicochemical properties
    water_solubility: Optional[str] = None
    log_p: Optional[float] = None
    bioavailability: Optional[str] = None
    natural_source: Optional[str] = None

    # Assembly process
    is_single_component: Optional[bool] = True
    assembly_components: Optional[str] = None
    component_count: Optional[str] = None
    responsiveness: Optional[str] = None
    surface_modification: Optional[str] = None

    # External links
    url: Optional[str] = None

    # Stats
    view_count: Optional[int] = 0

    building_block: Optional[BuildingBlockOut] = None
    morphology: Optional[MorphologyOut] = None
    assembly_drive_method: Optional[AssemblyDriveMethodOut] = None
    driving_forces: list[DrivingForceOut] = []
    properties: list[PropertyOut] = []
    category: Optional[str] = None
    foodmate_url: Optional[str] = None
    model_config = {"from_attributes": True}


class SearchParams(BaseModel):
    name: Optional[str] = None
    compound_type: Optional[str] = None
    building_block: Optional[str] = None
    morphology: Optional[str] = None
    driving_force: Optional[str] = None
    property: Optional[str] = None
    assembly_type: Optional[str] = None
    assembly_drive_method: Optional[str] = None
    aqueous_phase: Optional[str] = None
    organic_phase: Optional[str] = None
    is_cosmetic: Optional[bool] = None
    is_drug: Optional[bool] = None
    is_food: Optional[bool] = None
    responsiveness: Optional[str] = None
    surface_modification: Optional[str] = None
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
    english_name: Optional[str] = None
    compound_image: Optional[str] = None
    compound_type: Optional[str] = None
    molecular_weight: Optional[float] = None
    smiles: Optional[str] = None
    cas_number: Optional[str] = None
    assembly_type: Optional[str] = None
    particle_size: Optional[str] = None
    aqueous_phase: Optional[str] = None
    organic_phase: Optional[str] = None
    solute: Optional[str] = None
    concentration: Optional[str] = None
    component_ratio: Optional[str] = None
    preparation_method: Optional[str] = None
    size_nm_min: Optional[float] = None
    size_nm_max: Optional[float] = None
    size_note: Optional[str] = None
    size_source: Optional[str] = None
    doi: Optional[str] = None
    biological_activity: Optional[str] = None
    assembly_temperature: Optional[str] = None
    temperature_note: Optional[str] = None
    ph_value: Optional[str] = None
    ph_note: Optional[str] = None
    stirring_condition: Optional[str] = None
    assembly_time: Optional[str] = None
    molecular_characteristics: Optional[str] = None
    notes: Optional[str] = None
    is_cosmetic: bool = False
    cosmetic_note: Optional[str] = None
    is_drug: bool = False
    drug_note: Optional[str] = None
    is_food: bool = False
    food_note: Optional[str] = None
    food_category: Optional[str] = None
    food_daily_intake: Optional[str] = None
    regulations: Optional[str] = None
    component_count: Optional[str] = None
    responsiveness: Optional[str] = None
    surface_modification: Optional[str] = None
    url: Optional[str] = None
    building_block_id: Optional[int] = None
    morphology_id: Optional[int] = None
    assembly_drive_method_id: Optional[int] = None
    driving_force_ids: Optional[list[int]] = None
    property_ids: Optional[list[int]] = None


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


class LoginRequest(BaseModel):
    password: str


class TokenResponse(BaseModel):
    token: str


class VisitLogOut(BaseModel):
    id: int
    ip_address: str
    path: str
    user_agent: Optional[str] = None
    referer: Optional[str] = None
    created_at: Optional[datetime] = None
    model_config = {"from_attributes": True}


class VisitListResult(BaseModel):
    total: int
    page: int
    page_size: int
    results: list[VisitLogOut]


class AdminStats(BaseModel):
    total_visits: int
    unique_ips: int
    today_visits: int
    today_unique_ips: int
    total_assemblies: int
    total_molecule_views: int
    daily_trend: list[dict]


class TopMolecule(BaseModel):
    id: int
    name: str
    view_count: int
    english_name: Optional[str] = None
    model_config = {"from_attributes": True}


class TrendDailyPoint(BaseModel):
    date: str
    visits: int
    unique_ips: int


class TrendData(BaseModel):
    daily: list[TrendDailyPoint]
