#!/usr/bin/env python3
"""Generate a printable QR code PNG for a URL (uses the free api.qrserver.com).

Usage:  ./.venv/bin/python tools/make_qr.py  "<url>"  out.png
Example: ... "https://yuzerichardli.github.io/chinatown-ar/code/herbs/" qr/herbs.png
"""
import sys, ssl, urllib.request as u, urllib.parse, os

url, out = sys.argv[1], sys.argv[2]
api = "https://api.qrserver.com/v1/create-qr-code/?size=800x800&margin=20&data=" + urllib.parse.quote(url, safe="")
ctx = ssl.create_default_context(); ctx.check_hostname = False; ctx.verify_mode = ssl.CERT_NONE
data = u.urlopen(u.Request(api, headers={"User-Agent": "Mozilla/5.0"}), timeout=40, context=ctx).read()
os.makedirs(os.path.dirname(out) or ".", exist_ok=True)
open(out, "wb").write(data)
print("wrote", out, "->", url)
