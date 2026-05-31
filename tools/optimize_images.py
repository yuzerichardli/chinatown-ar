#!/usr/bin/env python3
"""Resize images for web: <=1280px, JPEG quality 85, sequential names.

Usage:  ./.venv/bin/python tools/optimize_images.py  out_dir/  in1.jpg in2.png ...
        -> out_dir/img01.jpg, img02.jpg, ...   (in the given order)
"""
import sys, os
from PIL import Image, ImageOps

out = sys.argv[1]
os.makedirs(out, exist_ok=True)
for i, p in enumerate(sys.argv[2:], 1):
    im = ImageOps.exif_transpose(Image.open(p)).convert("RGB")
    im.thumbnail((1280, 1280))
    o = os.path.join(out, f"img{i:02d}.jpg")
    im.save(o, "JPEG", quality=85)
    print(o, im.size, os.path.getsize(o) // 1024, "KB")
