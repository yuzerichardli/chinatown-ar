# AR Chinatown — Project Guide & Handoff

A **no-install WebAR tour of Chinatown**: a visitor scans a QR code → it opens in
their phone browser → an interactive AR scene runs (no app). There are **5 scenes**,
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
| 🥋 Tai-chi masters | `/code/interactive/` | Standard A-Frame + plain camera video |
| 🎬 Movie screen (Films at the Gate) | `/code/screen/` | Standard A-Frame + plain camera video |
| 🌿 Herbal soup game | `/code/herbs/` | Standard A-Frame + plain camera video |
| 🦁 Lion dance (Phillips Square) | `/code/lion/` | Plain HTML + camera video |
| 🥟 Dim sum (Share the Table) | `/code/dimsum/` | Plain HTML + camera video |
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

## 3. The scenes (files + behavior)

All 8th Wall scenes share the gesture model: **drag = orbit the object around you, pinch = zoom, tap = advance.**

### 🥋 `code/interactive/` — Tai-chi  (`poses.js?v=15`)
- **No 8th Wall** (same setup as herbs: standard A-Frame 1.3.0 + `camera.js`; motion-sensor dialog disabled).
- Opens with a drawing of the red sculpture (`assets/red-sculpture.svg`) and **"Do you see the red sculpture at Rose Kennedy Greenway park?" → Yes**.
- **4 master poses** (visibility-toggled — NOT model-swapped). The models are static scans (no skeleton), so motion is around them: 8 s breathing rise/sink with a "Breathe in / out" prompt, a ring of golden light points at his feet, and a flowing transition on tap (turn + fade into a rising light spiral, next pose turns out of it). After pose 4 → **text story pages** from `story.js` (English → Chinese → bilingual reflection → Replay).
- Models: `model/masters/{tai-chi-pose,tai-chi-stance,blue-clad,prayer}.glb` (`?v=3`). Texture-patched: grey hair on all four, pose 1's white suit recoloured navy to match the others. Faces/proportions still differ (pose 1 is a different, realistic character) — a truly consistent elder master needs new Meshy models.
- `stories/taichi*.jpg` are the old image slides, no longer used.

### 🎬 `code/screen/` — Movie screen  (`screen.js?v=8`)
- **No 8th Wall** (same setup as herbs/tai-chi: standard A-Frame 1.3.0 + `camera.js`).
- Two opening steps: **"Are you at Chinatown Gate park?" → Yes**, then two drawings (`assets/playcubes.svg`, `assets/brick-wall.svg`) captioned "Stand near the PlayCubes" / "Face the red brick wall" → Yes.
- A photo plays **on the screen face of `model/screen.glb`** (cover-cropped to fill, photo overlaid as a plane at `position 0 0.06 0.09`, size `1.49×1.05`). Screen starts at scale 1.25.
- 8 slides (`SLIDES` in `screen.js`): pic01, then the **2007 YouTube clip** in place of the 2007 photo, then pic03–pic08 → **text story pages** from `story.js` (English → Chinese → bilingual reflection → Replay).
- **Video** (`video.js`): YouTube can't be a WebGL texture, so the official youtube-nocookie player is laid over the screen and warped onto its projected corners with a CSS `matrix3d` every frame (follows drag/pinch). Plays muted with a "Sound on" button; loops 0:00–0:35 then 2:29–2:37 (`SEGMENTS`). Needs internet. Video: "Films at the Gate 2007, Boston MA" (davnyc), `9B5ORsQVgp8`.
- Unused now: `pictures/pic02.jpg` (2007 photo), `pic09/pic10` (old story image slides).

### 🌿 `code/herbs/` — Herbal soup game  (`herbs.js?v=15`, `collect.js?v=4`)
- **No 8th Wall.** Standard A-Frame 1.3.0 (jsDelivr) over a `getUserMedia` camera `<video>` (`camera.js`). Do NOT use the vendored `8frame` here: it waits for the 8th Wall engine (`xrloaded`) before rendering, so the herbs never appear without it.
- Opens with a drawing of the yellow sign (`assets/yellow-sign.svg`) and **"Do you see the yellow sign at Zhang Wellness Center?" → Yes** (same pattern as `code/lion/`; no GPS check).
- **Step 1 — herbal-store drawers** (`collect.js`): 6 unlabelled, shuffled drawers (ginseng, goji, red dates, Chinese yam + decoys star anise, chrysanthemum). Tap or drag the right four into the bamboo tray; decoys shake with a message. All four → **Cook the soup**. The four soup ingredients are pictures of the same GLBs as the pot game (`assets/ingredients/*.png`, rendered with the pot game's lights, transparent background); the decoys are drawn SVG.
- **Step 2 — pot:** 4 herbs float (head-locked); **drag each into the clay pot** (pointer events: touch + mouse). Each drop → bubbles + pot bounce; the ingredient floats in the water. The pot is drawn twice — `#pot` behind the 3D canvas and `#pot-front` (masked to the front lip/body) in front — so dropped herbs look inside the pot.
- After the **4th** drop → brewing → **soup reveal** (`assets/soup_transition.jpg`) → tap → **text story pages** from `story.js` (English → Chinese → bilingual reflection → Replay). Camera stops during the story and restarts on replay.
- State machine in `herbs.js`: `arrival → collect → playing → brewing → soup → story → (restart → collect)`.
- Models: `model/herbs/{jujubes,goji,ginseng,breadsticks}.glb` (decimated to ~100k faces each).

---

### 🥟 `code/dimsum/` — Dim sum sharing and tea (`dimsum.js?v=8`, `game.js?v=5`)
- Same simple interaction pattern as herbs: **drag four dishes onto one shared table** (or tap a dish, then the table).
- Then drag the existing teapot to **three tea cups**, one at a time (or tap the pot, then a cup). Each drop animates the pot tilting, a tea stream, and the tea filling the cup. All three must finish before proceeding. No matching requests, required tray rotation, timer, or score; the lazy Susan remains visual only.
- Opens with a flat drawing of the 180 Café sign (`assets/180-cafe-sign.svg`) and **"Are you in front of the 180 cafe?" → Yes**. No location detection.
- Word-free dish-sharing view (food/table plus Next). Sharing dishes is optional; Next works immediately, placing any remaining dishes on the table for tea. The same table and all four dishes stay visible; three matching cups appear with **"Drag the teapot to fill each cup."** Once all cups are filled → **"Enjoy your meal!" + Next** → English, Chinese, bilingual reflection → Replay.
- Button labels are English-only, including camera controls, Back, Next, and Replay; Chinese story/reflection text is unchanged.
- All game elements and the camera are hidden during the story. Back preserves the served table/filled cups; Replay clears dishes and tea. Leaving/resizing during a pour cancels it without filling that cup; reduced-motion mode skips movement.
- Uses the project owner's English/Chinese story and Judy Wang family-gathering quotation, then the bilingual meal-memory reflection. Plain cream story pages match the other scenes.
- Transparent softly shaded 3D-style food/teapot/cup sprites (`*-3d.png`) and a wood/glass lazy Susan (`lazy-susan.png`) match the textured objects in the other activities. The cup matches the original ivory/cobalt-blue teapot and uses an animated tea surface; the same pot image is used during drag and pour. The table image keeps its native perspective; items use small contact shadows. Original sprites remain unused for rollback. Generation/edit prompts and story context are in its `README.md`.
- Table now grows to nearly full phone width and a much larger wide-screen size; cups are 15% of the table image width with at least 44px controls and expanded drag/drop targets.
- QR: `qr/dimsum.png` → `/code/dimsum/`. All other scene QR codes are unchanged. Tests: `node --test code/dimsum/dimsum.test.cjs`.

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

**Done:** the original scenes plus lion dance and the simple dim sum sharing scene. Materials fixed, models optimized. Each scene has a QR in `qr/`.

**Not done / ideas:**
- Add a drop **sound**; per-herb **size tuning**.
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
