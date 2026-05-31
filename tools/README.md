# tools/ — asset & deploy helpers

Reusable scripts for the AR Chinatown asset pipeline. See `../CLAUDE.md` for full
project context. Run `setup_env.sh` once on a new machine first.

## Setup (new machine, macOS + Homebrew)
```bash
bash tools/setup_env.sh
```
Creates `./.venv` (Python: trimesh, pygltflib, pillow, numpy, fast-simplification),
installs Blender + gh, and sets the git push buffer.

## Convert a 3D model (Meshy OBJ → optimized GLB)

**Light model (≲400k faces)** — trimesh, then ALWAYS de-bronze:
```bash
./.venv/bin/python tools/obj_to_glb.py  path/to/model.obj  model/out.glb  0.25
./.venv/bin/python tools/fix_material.py  model/out.glb
```
(`0.25` is an optional baked scale. `fix_material.py` is mandatory — trimesh sets
`metallicFactor=1`, which renders as a dark bronze statue.)

**Heavy model (≳500k faces)** — Blender decimation (preserves UVs):
```bash
# 1) shrink the texture the .mtl points to, to ~1024px (PIL or sips), so Blender embeds a small one
# 2) decimate + export:
/Applications/Blender.app/Contents/MacOS/Blender --background \
  --python tools/decimate_blender.py -- path/to/model.obj model/out.glb 100000
```
Blender exports non-metallic with JPEG textures, so no `fix_material` needed.

## Optimize images (photos / story slides)
```bash
./.venv/bin/python tools/optimize_images.py  out_dir/  img1.jpg img2.jpg ...
# -> out_dir/img01.jpg ... (≤1280px, JPEG q85)
```

## De-bronze an existing GLB
```bash
./.venv/bin/python tools/fix_material.py  model/foo.glb [more.glb ...]
```

## Make a QR code for a scene URL
```bash
./.venv/bin/python tools/make_qr.py  "https://yuzerichardli.github.io/chinatown-ar/code/herbs/"  qr/herbs.png
```
