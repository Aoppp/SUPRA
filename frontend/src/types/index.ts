export interface BuildingBlock {
  id: number;
  name: string;
  molecular_formula?: string;
  smiles?: string;
  category?: string;
}

export interface DrivingForce {
  id: number;
  name: string;
  category?: string;
}

export interface Morphology {
  id: number;
  name: string;
  description?: string;
}

export interface CharacterizationMethod {
  id: number;
  name: string;
  category?: string;
}

export interface Property {
  id: number;
  name: string;
  category?: string;
}

export interface AssemblyDriveMethod {
  id: number;
  name: string;
}

export interface CompoundTypeCount {
  type: string;
  count: number;
}

export interface AssemblyListItem {
  id: number;
  name: string;
  english_name?: string;
  compound_image?: string;
  compound_type?: string;
  molecular_weight?: number;
  smiles?: string;
  cas_number?: string;
  assembly_type?: string;
  particle_size?: string;
  aqueous_phase?: string;
  organic_phase?: string;
  solute?: string;
  concentration?: string;
  size_nm_min?: number;
  size_nm_max?: number;
  doi?: string;
  biological_activity?: string;
  building_block?: BuildingBlock;
  morphology?: Morphology;
  assembly_drive_method?: AssemblyDriveMethod;
  driving_forces: DrivingForce[];
  properties: Property[];
  is_cosmetic: boolean;
  is_drug: boolean;
  is_food: boolean;
  component_count?: string;
  responsiveness?: string;
  surface_modification?: string;
  category?: string;
  foodmate_url?: string;
}

export interface AssemblyDetail {
  id: number;
  name: string;
  english_name?: string;
  view_count?: number;
  compound_image?: string;
  compound_type?: string;
  molecular_weight?: number;
  smiles?: string;
  cas_number?: string;
  assembly_type?: string;
  particle_size?: string;
  aqueous_phase?: string;
  organic_phase?: string;
  solute?: string;
  concentration?: string;
  component_ratio?: string;
  preparation_method?: string;
  size_nm_min?: number;
  size_nm_max?: number;
  size_note?: string;
  size_source?: string;
  doi?: string;
  biological_activity?: string;
  assembly_temperature?: string;
  temperature_note?: string;
  ph_value?: string;
  ph_note?: string;
  stirring_condition?: string;
  assembly_time?: string;
  molecular_characteristics?: string;
  notes?: string;
  is_cosmetic: boolean;
  cosmetic_note?: string;
  is_drug: boolean;
  drug_note?: string;
  is_food: boolean;
  food_note?: string;
  food_category?: string;
  food_daily_intake?: string;
  regulations?: string;
  component_count?: string;
  responsiveness?: string;
  surface_modification?: string;
  url?: string;
  building_block?: BuildingBlock;
  morphology?: Morphology;
  assembly_drive_method?: AssemblyDriveMethod;
  driving_forces: DrivingForce[];
  properties: Property[];
  category?: string;
  foodmate_url?: string;
}

export interface SearchResult {
  total: number;
  page: number;
  page_size: number;
  results: AssemblyListItem[];
}

export interface WorkProgress {
  id: number;
  person_name: string;
  file_name: string;
  file_path?: string;
  file_type?: string;
  description?: string;
  created_at?: string;
}

export interface VisitLog {
  id: number;
  ip_address: string;
  path: string;
  user_agent?: string;
  referer?: string;
  created_at?: string;
}

export interface VisitListResult {
  total: number;
  page: number;
  page_size: number;
  results: VisitLog[];
}

export interface AdminStats {
  total_visits: number;
  unique_ips: number;
  today_visits: number;
  today_unique_ips: number;
  total_assemblies: number;
  total_molecule_views: number;
  daily_trend: { date: string; count: number }[];
}

export interface TopMolecule {
  id: number;
  name: string;
  view_count: number;
  english_name?: string;
}

export interface TrendDailyPoint {
  date: string;
  visits: number;
  unique_ips: number;
}

export interface TrendData {
  daily: TrendDailyPoint[];
}
