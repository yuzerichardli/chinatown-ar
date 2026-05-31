#!/usr/bin/env python3
"""De-bronze a GLB.

trimesh's OBJ->GLB conversion writes metallicFactor=1 (and a dark baseColorFactor),
so the model renders like a black/bronze metal statue. This forces a matte,
full-colour PBR material so the texture shows true colours.

Usage:  ./.venv/bin/python tools/fix_material.py  a.glb [b.glb ...]
"""
import sys
from pygltflib import GLTF2

for path in sys.argv[1:]:
    g = GLTF2().load(path)
    for m in g.materials:
        pbr = m.pbrMetallicRoughness
        pbr.metallicFactor = 0.0
        pbr.roughnessFactor = 1.0
        pbr.baseColorFactor = [1.0, 1.0, 1.0, 1.0]
    g.save(path)
    print("de-bronzed:", path)
