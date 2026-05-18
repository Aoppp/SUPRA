from sqlalchemy import Column, Integer, String, Float, ForeignKey, Table, Text
from sqlalchemy.orm import relationship
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
    category = Column(String(100))  # small molecule, peptide, polymer, metal complex, etc.

    assemblies = relationship("Assembly", back_populates="building_block")


class DrivingForce(Base):
    __tablename__ = "driving_forces"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), unique=True, nullable=False)
    category = Column(String(100))  # non-covalent, dynamic covalent, etc.

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
    category = Column(String(100))  # microscopy, spectroscopy, scattering, etc.

    assemblies = relationship("Assembly", back_populates="characterization_method")


class Property(Base):
    __tablename__ = "properties"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), unique=True, nullable=False)
    category = Column(String(100))  # mechanical, optical, biological, catalytic, etc.

    assemblies = relationship("Assembly", secondary=assembly_properties,
                              back_populates="properties")


class Assembly(Base):
    __tablename__ = "assemblies"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(300), nullable=False)
    compound_image = Column(String(500))
    cas_number = Column(String(50))
    assembly_type = Column(String(200))
    particle_size = Column(String(200))
    solvent = Column(String(100))
    concentration = Column(String(100))
    preparation_method = Column(Text)
    size_nm_min = Column(Float)
    size_nm_max = Column(Float)
    doi = Column(String(100))
    description = Column(Text)
    assembly_temperature = Column(String(100))
    ph_value = Column(String(100))
    stirring_condition = Column(String(200))
    assembly_time = Column(String(200))
    molecular_characteristics = Column(Text)
    notes = Column(Text)
    building_block_id = Column(Integer, ForeignKey("building_blocks.id"))
    morphology_id = Column(Integer, ForeignKey("morphologies.id"))
    characterization_method_id = Column(Integer, ForeignKey("characterization_methods.id"))

    building_block = relationship("BuildingBlock", back_populates="assemblies")
    morphology = relationship("Morphology", back_populates="assemblies")
    characterization_method = relationship("CharacterizationMethod", back_populates="assemblies")
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
