# BodyParts3D Dataset Notes

## Source
- Official download page: https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html
- License page: https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html
- Original project site: http://lifesciencedbc.jp/bp3d/
- DOI: 10.18908/lsdba.nbdc00837-000
- Foundational paper: Mitsuhashi et al. (2009), "BodyParts3D: 3D structure database for anatomical concepts," Nucleic Acids Res 37(Database issue):D782-D785. https://doi.org/10.1093/nar/gkn613

## What It Is
A dictionary-type anatomy database where anatomical concepts (organs, structures) are represented as 3D polygon meshes mapped onto segments of a single adult male whole-body reference model. The underlying MRI dataset is called TARO — a 2mm voxel full-body male MRI created by Japan's National Institute of Information and Communications Technology, published freely in November 2004. BodyParts3D was launched in 2009 by Kousaku Okubo at the DNA Data Bank of Japan / Database Center for Life Science (DBCLS).

## Current Version: 4.0 (released 2013-06-14, license updated 2025-02-27)
- 2,234 individual OBJ meshes (Wavefront format), each tied to an ELEMENT file ID
- Combined hierarchy covers 3,432 named FMA (Foundational Model of Anatomy) concepts; some concepts reference multiple meshes
- Two hierarchy trees provided:
  - IS-A tree: concept inheritance (e.g., "heart is a organ")
  - PART-OF tree: compositional relationships (e.g., "mitral valve is part of heart")
- Polygon reduction rate 99% for web-friendly meshes
- Adult male reference anatomy only — no female, pediatric, or variant models
- Coordinate system: millimeters, Z-up (needs conversion to meters/Y-up for Three.js)

## Download Files (Release 4.0)
| File | Size | Contents |
| --- | --- | --- |
| isa_BP3D_4.0_obj_99.zip | 136 MB | Polygon meshes, IS-A tree, 99% reduction |
| partof_BP3D_4.0_obj_99.zip | 62 MB | Polygon meshes, PART-OF tree, 99% reduction |
| isa_parts_list_e.txt | 126 KB | ID-to-name table, IS-A, English |
| partof_parts_list_e.txt | 58 KB | ID-to-name table, PART-OF, English |
| isa_inclusion_relation_list.txt | 203 KB | Inclusion relations, IS-A |
| partof_inclusion_relation_list.txt | 90 KB | Inclusion relations, PART-OF |
| isa_element_parts.txt | 1.1 MB | Compound organ definitions, IS-A |
| partof_element_parts.txt | 654 KB | Compound organ definitions, PART-OF |
| README_e.html | 19 KB | Full documentation |
| release_4.0_e.html | 6.2 KB | Release notes |

Direct file URLs live under https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/

Example: https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/isa_BP3D_4.0_obj_99.zip

## License
Creative Commons Attribution 4.0 International (CC BY 4.0), updated 2025-02-27. This supersedes the older CC BY-SA 2.1 Japan text embedded in OBJ file comments.
- Free to access, acquire, redistribute, and create derivative works
- Required attribution: "BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International"
- Non-licensed uses require contacting DBCLS directly

## Relevance to This Project
1. **Overlay pass compatibility**: Each structure is a separate OBJ mesh with a stable ID, so you can load individual parts into the Three.js overlay layer without re-merging geometry. Selection highlighting via data-texture indexing (part ID) avoids GPU re-meshing — same pattern LearnAnatomy3D uses.
2. **Exploded views**: With 2,234 discrete meshes you can tween each part's position independently, or pre-compute exploded poses as morph targets per structure.
3. **Callout anchors**: Every mesh has a known centroid/bounds from the OBJ data, giving you natural 3D anchor points for HTML label projection.
4. **Quiz integration**: The IS-A and PART-OF tables let you build hierarchical question sets ("which structure is part of X?") directly from the dataset metadata.
5. **Igloo deployment**: 99%-reduced meshes are light enough for the 4K equirect + overlay composite at 30-60 fps on a 5090-class GPU.

## Adaptation Steps for Three.js
1. Download isa_BP3D_4.0_obj_99.zip
2. Convert units: mm → m (divide by 1000), Z-up → Y-up (swap and negate axes)
3. Center the model on the origin
4. Load via THREE.OBJLoader or convert to GLB with a tool like obj2glTF for better streaming
5. Build a manifest mapping ELEMENT file IDs to English names using isa_parts_list_e.txt
6. Assign each mesh a userData.partId for selection/highlight logic
7. Optional: run meshoptimizer simplification (0.2% error) and pack into binary chunks for concurrent streaming, as AnatomyVista did (~31 MB gzipped total)

## Related Open Projects Using This Data
- LearnAnatomy3D (leananatomy3d.com) — 2,900 clickable structures, 11 systems, 14 languages
- Human Atlas (github.com/wiiiimm/human-atlas) — 2,234 meshes + exploded-view mode
- OMFAtlas — dental fork, 643 head/neck meshes + tooth development stages
- AnatomyVista (anatomyvista.com) — adapted + optimized binary chunks for web streaming
- Z-Anatomy (github.com/Z-Anatomy) — CC BY-SA 4.0 fork with community refinements

## Caveats
- Single adult male model; no variation by sex, age, or pathology
- 99% polygon reduction loses fine surface detail — fine for overview teaching, not surgical precision
- Some skin/muscle meshes reportedly intersect in v4.0 (one fork switched to v3.0 for this reason)
- FTP mirror sometimes jammed; use the HTTPS direct links instead
