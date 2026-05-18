from database import SessionLocal, engine, Base
from models import BuildingBlock, Assembly, DrivingForce, Morphology, CharacterizationMethod, Property


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    if db.query(BuildingBlock).count() > 0:
        db.close()
        return

    # Building Blocks (compounds)
    bb = [
        BuildingBlock(name="Gallic Acid", molecular_formula="C7H6O5",
                       smiles="O=C(O)c1cc(O)c(O)c(O)c1", category="Polyphenol"),
        BuildingBlock(name="Quercetin", molecular_formula="C15H10O7",
                       smiles="O=C1C(=C(Oc2cc(O)cc(O)c12)c1ccc(O)c(O)c1)O", category="Flavonoid"),
        BuildingBlock(name="Fmoc-FF", molecular_formula="C30H24N2O5",
                       smiles="O=C(O)[C@H](Cc1ccccc1)NC(=O)[C@@H](Cc1ccccc1)NC(=O)OCC1c2ccccc2-c3ccccc13",
                       category="Peptide"),
        BuildingBlock(name="Curcumin", molecular_formula="C21H20O6",
                       smiles="COc1cc(C=CC(=O)CC(=O)C=Cc2ccc(O)c(OC)c2)ccc1O", category="Polyphenol"),
        BuildingBlock(name="Resveratrol", molecular_formula="C14H12O3",
                       smiles="Oc1ccc(C=Cc2cc(O)cc(O)c2)cc1", category="Stilbenoid"),
        BuildingBlock(name="β-Cyclodextrin", molecular_formula="C42H70O35",
                       smiles="", category="Macrocycle"),
        BuildingBlock(name="Melamine", molecular_formula="C3H6N6",
                       smiles="Nc1nc(N)nc(N)n1", category="Small molecule"),
        BuildingBlock(name="Cholic Acid", molecular_formula="C24H40O5",
                       smiles="C[C@@H](CCC(=O)O)[C@H]1CC[C@@H]2[C@@]1([C@H](C[C@H]3[C@H]2CC[C@H]4[C@@]3(CC[C@H](C4)O)C)O)C",
                       category="Steroid"),
        BuildingBlock(name="Perylene Bisimide (PBI)", molecular_formula="",
                       smiles="", category="Small molecule"),
        BuildingBlock(name="PNIPAM", molecular_formula="(C6H11NO)n", smiles="", category="Polymer"),
    ]
    db.add_all(bb); db.flush()

    # Driving Forces
    dfs = [
        DrivingForce(name="Hydrogen bonding", category="Non-covalent"),
        DrivingForce(name="π-π stacking", category="Non-covalent"),
        DrivingForce(name="Hydrophobic interaction", category="Non-covalent"),
        DrivingForce(name="Electrostatic interaction", category="Non-covalent"),
        DrivingForce(name="Host-guest interaction", category="Non-covalent"),
        DrivingForce(name="Metal-ligand coordination", category="Dynamic covalent"),
        DrivingForce(name="Van der Waals force", category="Non-covalent"),
        DrivingForce(name="Cation-π interaction", category="Non-covalent"),
        DrivingForce(name="Dynamic covalent bond", category="Dynamic covalent"),
        DrivingForce(name="Charge-transfer interaction", category="Non-covalent"),
    ]
    db.add_all(dfs); db.flush()

    # Morphologies
    mos = [
        Morphology(name="Rod-like nanofiber", description="High-aspect-ratio 1D rigid fiber"),
        Morphology(name="Spherical nanoparticle", description="Uniform spherical particles 20-500 nm"),
        Morphology(name="Hydrogel (porous)", description="3D crosslinked network with micron-scale pores"),
        Morphology(name="Vesicle", description="Hollow bilayer spherical structure"),
        Morphology(name="Nanotube", description="Cylindrical hollow nanostructure"),
        Morphology(name="Nanosheet / 2D film", description="Molecularly thin planar structure"),
        Morphology(name="Micelle", description="Core-shell amphiphilic aggregate"),
        Morphology(name="Nanobelt", description="Flat ribbon-like 1D nanostructure"),
    ]
    db.add_all(mos); db.flush()

    # Characterization Methods
    cms = [
        CharacterizationMethod(name="TEM", category="Microscopy"),
        CharacterizationMethod(name="SEM", category="Microscopy"),
        CharacterizationMethod(name="AFM", category="Microscopy"),
        CharacterizationMethod(name="DLS", category="Scattering"),
        CharacterizationMethod(name="XRD", category="Scattering"),
        CharacterizationMethod(name="NMR", category="Spectroscopy"),
        CharacterizationMethod(name="CD", category="Spectroscopy"),
        CharacterizationMethod(name="SAXS", category="Scattering"),
        CharacterizationMethod(name="FTIR", category="Spectroscopy"),
        CharacterizationMethod(name="UV-Vis", category="Spectroscopy"),
    ]
    db.add_all(cms); db.flush()

    # Properties (biological activities)
    props = [
        Property(name="Antibacterial (E. coli, S. aureus)", category="Antimicrobial"),
        Property(name="Anti-inflammatory (NF-κB, STAT3)", category="Anti-inflammatory"),
        Property(name="Wound healing acceleration", category="Tissue repair"),
        Property(name="Antioxidant / ROS scavenging", category="Antioxidant"),
        Property(name="Promotes M2 macrophage polarization", category="Immunomodulation"),
        Property(name="Pro-angiogenic", category="Tissue repair"),
        Property(name="Anti-apoptotic", category="Cytoprotection"),
        Property(name="Drug delivery (>95% EE)", category="Drug delivery"),
        Property(name="Stimuli-responsive release", category="Smart materials"),
        Property(name="Photothermal therapy", category="Biomedical"),
    ]
    db.add_all(props); db.flush()

    # Assemblies (fictional data inspired by Excel structure)
    a1 = Assembly(
        name="Gallic Acid",
        compound_image="https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/Gallic%20Acid/PNG",
        cas_number="149-91-7", assembly_type="Self-assembly; Supramolecular hydrogel",
        particle_size="~1 μm (fiber diameter)",
        solvent="Ultrapure water", concentration="40 mg/mL (minimum)",
        preparation_method="1. GA powder dissolved in ultrapure water. 2. Heated to 70°C until transparent. 3. Cooled to RT with gentle shaking → rapid self-assembly into hydrogel.",
        size_nm_min=800, size_nm_max=1200, doi="10.1002/adhm.202102476",
        description="Gallic acid self-assembles into rod-like nanofibers via π-π stacking and hydrogen bonding, forming a supramolecular hydrogel at 40 mg/mL in water.",
        building_block_id=bb[0].id, morphology_id=mos[0].id, characterization_method_id=cms[1].id,
    )
    a2 = Assembly(
        name="Quercetin-loaded Chitosan NPs (QNPs@GelMA)",
        compound_image="https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/Quercetin/PNG",
        cas_number="117-39-5", assembly_type="Self-assembly; Composite hydrogel",
        particle_size="NP: 222.0±7.57 nm; Pore: 57.36±13.89 μm",
        solvent="Chitosan (2 mg/mL in 2% AcOH) / Quercetin-EtOH (3 mg/mL) / GelMA (10% w/v)",
        concentration="QNPs: ionotropic gelation; GelMA: photo-crosslinked",
        preparation_method="1. Ionotropic gelation → QNPs. 2. Mix QNPs with GelMA, ultrasonicate 10 min. 3. UV crosslink 30 s → QNPs@GelMA hydrogel.",
        size_nm_min=215, size_nm_max=230, doi="10.1016/j.phymed.2026.158137",
        description="Quercetin-loaded chitosan nanoparticles embedded in GelMA hydrogel. Encapsulation efficiency: 98.55±0.56%, drug loading: 19.54±0.05%. Targets RAGE/NF-κB pathway for diabetic wound healing.",
        building_block_id=bb[1].id, morphology_id=mos[2].id, characterization_method_id=cms[1].id,
    )
    a3 = Assembly(
        name="Fmoc-FF Hydrogel",
        compound_image="",
        cas_number="161079-20-7", assembly_type="Self-assembly; Peptide hydrogel",
        particle_size="10–30 nm (fiber diameter)",
        solvent="Water/DMSO (9:1 v/v)", concentration="5 mg/mL",
        preparation_method="Dissolve Fmoc-FF in DMSO, dilute with water to trigger self-assembly. Gelation within minutes at pH 7.",
        size_nm_min=10, size_nm_max=30, doi="10.1002/adma.200901234",
        description="Fmoc-diphenylalanine self-assembles into nanofibers via π-π stacking and hydrogen bonding, forming an injectable, thixotropic hydrogel for drug delivery.",
        building_block_id=bb[2].id, morphology_id=mos[0].id, characterization_method_id=cms[2].id,
    )
    a4 = Assembly(
        name="Curcumin Nanoparticles",
        compound_image="https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/Curcumin/PNG",
        cas_number="458-37-7", assembly_type="Self-assembly; Nanoprecipitation",
        particle_size="80–150 nm",
        solvent="Ethanol/Water (1:4 v/v)", concentration="2 mg/mL",
        preparation_method="1. Curcumin dissolved in ethanol. 2. Dropwise addition into water under stirring. 3. Solvent evaporation yields uniform nanoparticles.",
        size_nm_min=80, size_nm_max=150, doi="10.1016/j.biomaterials.2021.120834",
        description="Curcumin self-assembles into spherical nanoparticles via hydrophobic effect and π-π stacking. Exhibits potent antioxidant, anti-inflammatory, and antibacterial activities.",
        building_block_id=bb[3].id, morphology_id=mos[1].id, characterization_method_id=cms[3].id,
    )
    a5 = Assembly(
        name="Resveratrol Nanofiber",
        compound_image="https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/Resveratrol/PNG",
        cas_number="501-36-0", assembly_type="Self-assembly; Nanofiber",
        particle_size="50–100 nm (diameter)",
        solvent="Ethanol/Water (3:7 v/v)", concentration="5 mg/mL",
        preparation_method="1. Resveratrol dissolved in ethanol. 2. Water added dropwise under sonication. 3. Aging at 4°C for 12h yields nanofibers.",
        size_nm_min=50, size_nm_max=100, doi="10.1021/acsami.0c12345",
        description="Resveratrol self-assembles into nanofibers via π-π stacking and H-bonding. Shows prolonged antioxidant activity and promotes M2 macrophage polarization.",
        building_block_id=bb[4].id, morphology_id=mos[0].id, characterization_method_id=cms[1].id,
    )
    a6 = Assembly(
        name="β-CD-Adamantane Host-Guest NPs",
        compound_image="",
        cas_number="7585-39-9", assembly_type="Host-guest self-assembly",
        particle_size="50–120 nm",
        solvent="Water", concentration="1 mM each",
        preparation_method="Mix β-CD with adamantane-functionalized guest in water. Sonication 10 min → uniform nanoparticles.",
        size_nm_min=50, size_nm_max=120, doi="10.1021/jacs.5b01234",
        description="β-Cyclodextrin encapsulates adamantane guests with ultra-high affinity (Ka ~ 10^14 M⁻¹) via hydrophobic effect, forming stable nanoparticles for targeted drug release.",
        building_block_id=bb[5].id, morphology_id=mos[1].id, characterization_method_id=cms[3].id,
    )
    a7 = Assembly(
        name="Melamine-Cyanurate Nanotubes",
        compound_image="",
        cas_number="108-78-1", assembly_type="Co-assembly; Nanotube",
        particle_size="3–5 nm (diameter), 200–500 nm (length)",
        solvent="Water", concentration="10 mM",
        preparation_method="Co-assemble melamine with cyanuric acid in water at 80°C, slow cool to RT.",
        size_nm_min=3, size_nm_max=5, doi="10.1038/nmat1234",
        description="Hydrogen-bonded rosette motif self-assembles into hollow nanotubes via triple H-bonding between melamine and cyanurate. Directional 1D growth yields high-aspect-ratio structures.",
        building_block_id=bb[6].id, morphology_id=mos[4].id, characterization_method_id=cms[0].id,
    )
    a8 = Assembly(
        name="Cholic Acid Nanobelt",
        compound_image="",
        cas_number="81-25-4", assembly_type="Self-assembly; Nanobelt",
        particle_size="20–50 nm (width), 200–800 nm (length)",
        solvent="Ethanol/Water (7:3 v/v)", concentration="3 mg/mL",
        preparation_method="Dissolve cholic acid derivative in ethanol, add water dropwise. Age at 4°C for 24h.",
        size_nm_min=20, size_nm_max=50, doi="10.1039/d0nr12345",
        description="Cholic acid self-assembles into flat nanobelts via hydrophobic stacking of steroid backbone and hydrogen bonding. Amphiphilic facial structure directs anisotropic growth.",
        building_block_id=bb[7].id, morphology_id=mos[7].id, characterization_method_id=cms[1].id,
    )
    a9 = Assembly(
        name="PBI Photocatalytic Nanofiber",
        compound_image="",
        cas_number="", assembly_type="Self-assembly; Nanofiber",
        particle_size="8–20 nm (diameter)",
        solvent="Water/DMF (8:2 v/v)", concentration="1 mg/mL",
        preparation_method="Dissolve PBI in DMF, inject into rapidly stirred water. Dialyze to remove DMF.",
        size_nm_min=8, size_nm_max=20, doi="10.1021/jacs.8b01234",
        description="Perylene bisimide self-assembles into 1D nanofibers via π-π stacking. J-type aggregation enables efficient charge separation for visible-light photocatalytic H₂ evolution.",
        building_block_id=bb[8].id, morphology_id=mos[0].id, characterization_method_id=cms[9].id,
    )
    a10 = Assembly(
        name="PNIPAM Thermo-responsive Micelles",
        compound_image="",
        cas_number="", assembly_type="Self-assembly; Micelle",
        particle_size="30–80 nm",
        solvent="Water", concentration="10 mg/mL",
        preparation_method="Dissolve PNIPAM-b-PS in water at 4°C. Heating to 37°C triggers micellization.",
        size_nm_min=30, size_nm_max=80, doi="10.1021/ma1012345",
        description="PNIPAM block copolymer exhibits LCST ~32°C. Below LCST, PNIPAM water-soluble; above LCST, collapses driving micelle formation. Used for temperature-triggered drug release.",
        building_block_id=bb[9].id, morphology_id=mos[6].id, characterization_method_id=cms[3].id,
    )
    db.add_all([a1, a2, a3, a4, a5, a6, a7, a8, a9, a10]); db.flush()

    # Driving force associations
    a1.driving_forces.extend([dfs[1], dfs[0]])       # Gallic acid: π-π + H-bond
    a2.driving_forces.extend([dfs[3], dfs[0], dfs[2]]) # QNPs: electrostatic + H-bond + hydrophobic
    a3.driving_forces.extend([dfs[1], dfs[0], dfs[2]]) # Fmoc-FF: π-π + H-bond + hydrophobic
    a4.driving_forces.extend([dfs[2], dfs[1]])         # Curcumin: hydrophobic + π-π
    a5.driving_forces.extend([dfs[1], dfs[0]])         # Resveratrol: π-π + H-bond
    a6.driving_forces.extend([dfs[4], dfs[2]])         # β-CD: host-guest + hydrophobic
    a7.driving_forces.extend([dfs[0], dfs[1]])         # Melamine: H-bond + π-π
    a8.driving_forces.extend([dfs[0], dfs[2], dfs[1]]) # Cholic acid: H-bond + hydrophobic + π-π
    a9.driving_forces.extend([dfs[1], dfs[2]])         # PBI: π-π + hydrophobic
    a10.driving_forces.extend([dfs[2], dfs[6]])        # PNIPAM: hydrophobic + van der Waals

    # Property associations
    a1.properties.extend([props[0], props[1], props[2]])       # Antibacterial + Anti-inflammatory + Wound healing
    a2.properties.extend([props[3], props[1], props[4], props[5], props[6]]) # Antioxidant + Anti-inflammatory + M2 + Angiogenic + Anti-apoptotic
    a3.properties.extend([props[7], props[8]])                  # Drug delivery + Stimuli-responsive
    a4.properties.extend([props[3], props[1], props[0]])        # Antioxidant + Anti-inflammatory + Antibacterial
    a5.properties.extend([props[3], props[4]])                  # Antioxidant + M2 polarization
    a6.properties.extend([props[7], props[8]])                  # Drug delivery + Stimuli-responsive
    a7.properties.extend([props[9]])                            # (no strong bio activity, placeholder)
    a8.properties.extend([props[0], props[1]])                  # Antibacterial + Anti-inflammatory
    a9.properties.extend([])                                    # Photocatalytic, not biological
    a10.properties.extend([props[7], props[8]])                 # Drug delivery + Stimuli-responsive

    db.commit()
    db.close()
    print("Database seeded: 10 compounds, 10 driving forces, 8 morphologies, 10 methods, 10 properties, 10 assemblies.")


if __name__ == "__main__":
    seed()
