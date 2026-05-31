# AR Chinatown — Project Guide & Handoff

A **no-install WebAR tour of Chinatown**: a visitor scans a QR code → it opens in
their phone browser → an interactive AR scene runs (no app). There are **3 scenes**,
hosted free on **GitHub Pages**. Built for iPhone Safari **and** Android Chrome.

> **New machine / new agent: read this whole file first.** Then run
> `tools/setup_env.sh` to rebuild the local toolchain. Work from the **Dropbox**
> copy of this folder (it has source assets that are not in git — see below).

---

## 1. Live site & repository

- **GitHub repo:** https://github.com/yuzerichardli/chinatown-ar (account `yuzerichardli`)
- **Live base URL:** https://yuzerichardli.github.io/chinatown-ar/
- **Deploy = `git push` to `main`.** GitHub Pages serves `main` at root and rebuilds in ~1 min.
- Project folder (this machine): `/Users/richardli/Dropbox (Personal)/AR Chinatown`

### Scene URLs
| Scene | URL | Engine |
|---|---|---|
| 🥋 Tai-chi masters | `/code/interactive/` | 8th Wall |
| 🎬 Movie screen (Films at the Gate) | `/code/screen/` | 8th Wall |
| 🌿 Herbal soup game | `/code/herbs/` | 8th Wall |
| (original simple tour) | `/code/?spot=taichi` | `<model-viewer>` |

---

## 2. Tech stack

- **Open-source 8th Wall** (went free/open-source Feb 2026 — **no app key needed**). Each 8th Wall scene loads:
  - `vendor/8frame-1.3.0.min.js` — 8th Wall's A-Frame fork, **vendored locally per scene** (it is NOT on npm).
  - `https://cdn.jsdelivr.net/npm/@8thwall/xrextras@1/dist/xrextras.js` — loading screen + gesture helpers.
  - `https://cdn.jsdelivr.net/npm/@8thwall/engine-binary@1/dist/xr.js` with `data-preload-chunks="slam"` — the engine + SLAM. This also registers the `<a-scene xrweb>` component.
  - Scene tag: `xrweb="allowedDevices: any; scale: absolute"` (**`scale: absolute` matters** — the default `responsive` mode rescales the world and makes objects drift/snap).
- **Scenes are CAMERA-RELATIVE (head-locked rigs), not world-anchored.** The open-source SLAM is weak and drifts; anchoring content to a rig on the camera (and moving it via finger gestures) is rock-steady. Do not "fix objects to the room" expecting stability.
- **`<model-viewer>`** (Google CDN) powers only the original simple tour (`code/index.html`).
- No build step, no framework. Plain HTML/JS. Edit → push → done.

---

## 3. The three scenes (files + behavior)

All 8th Wall scenes share the gesture model: **drag = orbit the object around you, pinch = zoom, tap = advance.**

### 🥋 `code/interactive/` — Tai-chi  (`poses.js?v=13`)
- Cycles **4 master poses** (3D, visibility-toggled — NOT model-swapped) → **2 full-screen story slides** → loops.
- Models: `model/masters/{tai-chi-pose,tai-chi-stance,blue-clad,prayer}.glb` (`?v=2`).
- Stories: `code/interactive/stories/taichi1.jpg`, `taichi2.jpg`.

### 🎬 `code/screen/` — Movie screen  (`screen.js?v=4`)
- A photo plays **on the screen face of `model/screen.glb`** (cover-cropped to fill, photo overlaid as a plane at `position 0 0.06 0.09`, size `1.49×1.05`).
- 8 photos on the screen → **2 full-screen story slides** (camera shows behind, transparent) → loops.
- Photos: `code/screen/pictures/pic01.jpg … pic10.jpg` (pic09/pic10 are the story slides).

### 🌿 `code/herbs/` — Herbal soup game  (`herbs.js?v=6`)
- **Most interactive.** 4 herbs float (head-locked); **finger-drag each into the 🥣 pot** at the bottom. Each drop → **bubbles + bowl bounce** (`splash()`); ingredient piles at the rim.
- After the **4th** drop → ~2.5s **brewing** (continuous bubbles) → fades to a **full-soup reveal** (`assets/soup.jpg`, a free Pexels photo) → **tap → 2 story slides** (`stories/story1.jpg`, `story2.jpg`) → **tap → restart** the game.
- State machine in `herbs.js`: `playing → brewing → soup → story1 → story2 → (restart)`.
- Models: `model/herbs/{jujubes,goji,ginseng,breadsticks}.glb` (decimated to ~100k faces each).

---

## 4. Where the assets live  (IMPORTANT for continuity)

**Use the Dropbox copy on the new machine** — it has source material that is **not in git**:

| Asset | In git? | Notes |
|---|---|---|
| Deployed app (`code/`) | ✅ | the scenes |
| Optimized GLBs (`model/masters/`, `model/herbs/`, `model/screen.glb`, `model/taichi*.glb`) | ✅ | what the scenes load |
| Scene photos (`code/*/pictures`, `code/*/stories`, `code/herbs/assets`) | ✅ | optimized |
| `snap/` snapcodes | ✅ | co-author's Lens Studio lens — just the scan codes, **no source code** |
| **`model/3D/`** raw Meshy OBJ exports | ❌ gitignored | **~1.4 GB, Dropbox-only.** Source for the masters + herbs. |
| **`Movie Photos + Script/`** raw photos & story scripts | ✅ (committed in handoff) | originals for the movie + tai-chi + herb stories |

> If you ever `git clone` fresh (instead of using Dropbox), you will **not** get `model/3D/`. Re-download those from Meshy or copy from Dropbox.

---

## 5. Rebuild the toolchain on the new machine

Run **`bash tools/setup_env.sh`** (macOS + Homebrew). It will:
1. Install + log in `gh` (GitHub CLI).
2. Set `git config http.postBuffer 524288000` (large model pushes 408 without this).
3. Create a Python venv `./.venv` with `trimesh pygltflib pillow numpy fast-simplification`.
4. Install **Blender** (`brew install --cask blender`) — needed to decimate heavy models.

Also available out of the box on macOS: **`sips`** (image resizing).

---

## 6. Asset pipeline (how to add / convert 3D models) — scripts in `tools/`

Meshy exports are **OBJ + .mtl + texture.png**, often huge. To use one in a scene:

- **Light model (≲400k faces)** → `tools/obj_to_glb.py` (trimesh: shrink texture→1024 JPEG, center, bake scale, export GLB). **THEN ALWAYS run `tools/fix_material.py`** on the output.
- **Heavy model (≳500k faces)** → `tools/decimate_blender.py` (Blender Decimate→~100k faces, **preserves UVs**, JPEG textures, non-metallic). `fast_simplification` alone destroys UVs — use Blender.
- **Images** → `tools/optimize_images.py` (≤1280px, JPEG q85).

See `tools/README.md` for exact commands.

---

## 7. Gotchas / hard-won lessons (read before debugging!)

1. **🟫 The "bronze statue" bug.** trimesh OBJ→GLB writes `metallicFactor=1` + dark `baseColorFactor` → models render as black/bronze metal. **Fix:** `tools/fix_material.py` (sets metallic=0, roughness=1, baseColorFactor=[1,1,1,1]). `screen.glb` had the same; Blender exports are fine (metallic 0).
2. **UV-preserving decimation needs Blender.** `fast_simplification` reduces faces but loses the texture mapping.
3. **iOS camera:** must open in **Safari/Chrome directly**. In-app browsers (Instagram, Messages, etc.) block `getUserMedia` → AR fails. Tell users "Open in Safari."
4. **Big pushes (model files ~40 MB)** fail with `HTTP 408` unless `git config http.postBuffer 524288000`.
5. **Caching:** GitHub Pages + browsers cache. When you change a file but keep its name, **bump `?v=N`** on its `<script>`/asset URL (that's why you see `poses.js?v=13`, `taichi.glb?v=2`, etc.). Tell the user to fully close/reopen the tab.
6. **8frame is vendored per scene** (`code/<scene>/vendor/`). Not on npm. Copy it when creating a new scene.
7. **Model swapping vs visibility:** swapping `gltf-model` at runtime can make models vanish. The scenes **preload all variants and toggle `visible`** instead.
8. **Decimation/material scripts run in `./.venv`** (trimesh/pygltflib/PIL) or Blender headless — not the system Python (Homebrew Python is PEP-668 "externally managed").

---

## 8. Status & possible next steps

**Done:** all 3 scenes work end-to-end (interactions + story slides + loops + the herb-soup animations/brewing/reveal). Materials fixed, models optimized, everything deployed & live.

**Not done / ideas:**
- **QR codes:** only `qr/taichi.png` exists, and it points at the *old* simple tour (`/code/?spot=taichi`). The 3 main scenes have **no QR codes yet** — generate them (see how `qr/taichi.png` was made: an `api.qrserver.com` PNG of the scene URL).
- Replace the herb 🥣/🍲 **emoji with real pot art**; add a drop **sound**; per-herb **size tuning**.
- Optional: revisit world-anchored AR (image-target markers) if rock-solid spatial anchoring is ever needed — current scenes are deliberately camera-relative.

---

## 9. Deploy a change (quick reference)

```bash
# from the project root
git add code/ model/ ...           # stage what changed
git commit -m "..."
git config http.postBuffer 524288000   # only needed for large model pushes
git push origin main
# wait ~1 min for Pages, then reopen the URL (bump ?v= if it looks cached)
```
