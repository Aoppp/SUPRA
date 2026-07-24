from sqlalchemy import Column, Integer, String, Float, ForeignKey, Table, Text, Boolean, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
from datetime import datetime

assembly_driving_forces = Table(
    "assembly_driving_forces",
    Base.metadata,
    Column("assembly_id", Integer, ForeignKey("assemblies.id"), primary_key=True),
    Column("driving_force_id", Integer, ForeignKey("driving_forces.id"), primary_key=True),
)

assembly_properties = Table(
    "assembly_properties",
    Base.metadata,
    Column("assembly_id", Integer, ForeignKey("assemblies.id"), primary_key=True),
    Column("property_id", Integer, ForeignKey("properties.id"), primary_key=True),
    Column("property_value", String(200)),
    Column("measurement_condition", String(200)),
)


class BuildingBlock(Base):
    __tablename__ = "building_blocks"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), unique=True, nullable=False)
    molecular_formula = Column(String(100))
    smiles = Column(String(500))
    category = Column(String(100))

    assemblies = relationship("Assembly", back_populates="building_block")


class DrivingForce(Base):
    __tablename__ = "driving_forces"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), unique=True, nullable=False)
    category = Column(String(100))

    assemblies = relationship("Assembly", secondary=assembly_driving_forces,
                               back_populates="driving_forces")


class Morphology(Base):
    __tablename__ = "morphologies"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), unique=True, nullable=False)
    description = Column(Text)

    assemblies = relationship("Assembly", back_populates="morphology")


class CharacterizationMethod(Base):
    __tablename__ = "characterization_methods"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), unique=True, nullable=False)
    category = Column(String(100))

    assemblies = relationship("Assembly", back_populates="characterization_method")


class Property(Base):
    __tablename__ = "properties"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), unique=True, nullable=False)
    category = Column(String(100))

    assemblies = relationship("Assembly", secondary=assembly_properties,
                              back_populates="properties")


class AssemblyDriveMethod(Base):
    __tablename__ = "assembly_drive_methods"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), unique=True, nullable=False)

    assemblies = relationship("Assembly", back_populates="assembly_drive_method")


class Assembly(Base):
    __tablename__ = "assemblies"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(300), nullable=False)
    english_name = Column(String(300))
    compound_image = Column(String(500))
    smiles = Column(String(1000))
    cas_number = Column(String(50))
    assembly_type = Column(String(200))
    particle_size = Column(String(200))
    aqueous_phase = Column(String(200))
    organic_phase = Column(String(200))
    solute = Column(String(300))
    concentration = Column(String(200))
    component_ratio = Column(String(200))
    preparation_method = Column(Text)
    size_nm_min = Column(Float)
    size_nm_max = Column(Float)
    size_note = Column(String(500))
    size_source = Column(String(500))
    doi = Column(String(200))
    biological_activity = Column(Text)
    assembly_temperature = Column(String(200))
    temperature_note = Column(String(500))
    ph_value = Column(String(100))
    ph_note = Column(String(500))
    stirring_condition = Column(String(200))
    assembly_time = Column(String(200))
    molecular_characteristics = Column(Text)
    notes = Column(Text)

    # Compound classification
    compound_type = Column(String(100))
    molecular_weight = Column(Float)

    # Application classification
    is_cosmetic = Column(Boolean, default=False)
    cosmetic_note = Column(String(500))
    is_drug = Column(Boolean, default=False)
    drug_note = Column(String(500))
    is_food = Column(Boolean, default=False)
    food_note = Column(String(500))
    food_category = Column(String(500))
    food_daily_intake = Column(String(500))
    regulations = Column(Text)

    # Assembly process
    component_count = Column(String(100))
    responsiveness = Column(String(200))
    surface_modification = Column(String(200))

    # External links
    url = Column(String(500))

    # View count
    view_count = Column(Integer, default=0)

    building_block_id = Column(Integer, ForeignKey("building_blocks.id"))
    morphology_id = Column(Integer, ForeignKey("morphologies.id"))
    characterization_method_id = Column(Integer, ForeignKey("characterization_methods.id"))
    assembly_drive_method_id = Column(Integer, ForeignKey("assembly_drive_methods.id"))

    building_block = relationship("BuildingBlock", back_populates="assemblies")
    morphology = relationship("Morphology", back_populates="assemblies")
    characterization_method = relationship("CharacterizationMethod", back_populates="assemblies")
    assembly_drive_method = relationship("AssemblyDriveMethod", back_populates="assemblies")
    driving_forces = relationship("DrivingForce", secondary=assembly_driving_forces,
                                   back_populates="assemblies")
    properties = relationship("Property", secondary=assembly_properties,
                               back_populates="assemblies")


class WorkProgress(Base):
    __tablename__ = "work_progress"
    id = Column(Integer, primary_key=True, index=True)
    person_name = Column(String(100), nullable=False)
    file_name = Column(String(300), nullable=False)
    file_path = Column(String(500))
    file_type = Column(String(50))
    description = Column(Text)
    created_at = Column(String(50), default=lambda: datetime.now().strftime("%Y-%m-%d %H:%M"))


class VisitLog(Base):
    __tablename__ = "visit_logs"
    id = Column(Integer, primary_key=True, index=True)
    ip_address = Column(String(50), nullable=False)
    path = Column(String(300), nullable=False)
    user_agent = Column(String(500))
    referer = Column(String(500))
    created_at = Column(DateTime, server_default=func.now())
