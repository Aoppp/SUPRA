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

export interface AssemblyListItem {
  id: number;
  name: string;
  compound_image?: string;
  cas_number?: string;
  assembly_type?: string;
  particle_size?: string;
  doi?: string;
  building_block?: BuildingBlock;
  morphology?: Morphology;
  driving_forces: DrivingForce[];
  properties: Property[];
  description?: string;
}


export interface AssemblyDetail {
  id: number;
  name: string;
  compound_image?: string;
  cas_number?: string;
  assembly_type?: string;
  particle_size?: string;
  solvent?: string;
  concentration?: string;
  preparation_method?: string;
  size_nm_min?: number;
  size_nm_max?: number;
  doi?: string;
  description?: string;
  building_block?: BuildingBlock;
  morphology?: Morphology;
  characterization_method?: CharacterizationMethod;
  driving_forces: DrivingForce[];
  properties: Property[];
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
