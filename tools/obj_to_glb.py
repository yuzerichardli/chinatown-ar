#!/usr/bin/env python3
"""Light Meshy OBJ (+ .mtl + texture.png) -> optimized GLB, via trimesh.

Shrinks the texture to 1024px JPEG, centres the pivot, bakes an optional uniform
scale, and exports a GLB. Use for models up to ~400k faces; for heavier models use
tools/decimate_blender.py instead.

IMPORTANT: trimesh sets metallicFactor=1 -> the model looks like dark bronze.
ALWAYS run tools/fix_material.py on the output afterwards.

Usage:  ./.venv/bin/python tools/obj_to_glb.py  in.obj  out.glb  [scale=0.25]
"""
import sys, trimesh
from PIL import Image
from io import BytesIO

inp, outp = sys.argv[1], sys.argv[2]
scale = float(sys.argv[3]) if len(sys.argv) > 3 else 0.25

m = trimesh.load(inp, process=False)
if isinstance(m, trimesh.Scene):
    m = trimesh.util.concatenate(tuple(m.geometry.values()))

mat = getattr(m.visual, "material", None)
img = (getattr(mat, "baseColorTexture", None) or getattr(mat, "image", None)) if mat else None
if img is not None:
    small = img.convert("RGB"); small.thumbnail((1024, 1024))
    buf = BytesIO(); small.save(buf, "JPEG", quality=85); small = Image.open(buf)
    if hasattr(mat, "baseColorTexture"): mat.baseColorTexture = small
    if hasattr(mat, "image"): mat.image = small

m.apply_translation(-m.bounding_box.centroid)   # centre pivot
m.apply_scale(scale)                             # bake scale
m.export(outp)
print("wrote", outp, "faces=", len(m.faces))
print("NOW RUN: ./.venv/bin/python tools/fix_material.py", outp)
