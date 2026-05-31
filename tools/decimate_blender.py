"""Decimate + convert a heavy Meshy OBJ -> GLB using Blender (headless).

Preserves UVs (unlike fast_simplification), exports JPEG textures, and Blender's
OBJ import is non-metallic so there's no bronze bug. Pre-shrink the texture the
.mtl references (to ~1024px) first so Blender embeds a small image.

Run:
  /Applications/Blender.app/Contents/MacOS/Blender --background \
    --python tools/decimate_blender.py -- in.obj out.glb [target_faces=100000]
"""
import bpy, sys

argv = sys.argv[sys.argv.index("--") + 1:]
inp, outp = argv[0], argv[1]
target = int(argv[2]) if len(argv) > 2 else 100000

# fresh scene
bpy.ops.object.select_all(action="SELECT"); bpy.ops.object.delete()

bpy.ops.wm.obj_import(filepath=inp)
meshes = [o for o in bpy.context.selected_objects if o.type == "MESH"]
ob = meshes[0]
if len(meshes) > 1:
    bpy.context.view_layer.objects.active = ob
    bpy.ops.object.join()

polys = len(ob.data.polygons)
ratio = min(1.0, target / max(1, polys))
md = ob.modifiers.new("dec", "DECIMATE"); md.decimate_type = "COLLAPSE"; md.ratio = ratio

bpy.context.view_layer.objects.active = ob
bpy.ops.object.origin_set(type="ORIGIN_GEOMETRY", center="BOUNDS")  # centre pivot
ob.location = (0, 0, 0)

bpy.ops.object.select_all(action="DESELECT"); ob.select_set(True)
bpy.context.view_layer.objects.active = ob
bpy.ops.export_scene.gltf(filepath=outp, export_format="GLB", use_selection=True,
                          export_apply=True, export_image_format="JPEG")
print(f"wrote {outp}  polys_in={polys} ratio={ratio:.3f} faces_out~{int(polys*ratio)}")
