# Dim sum — Share the Table

Live: https://yuzerichardli.github.io/chinatown-ar/code/dimsum/
QR: `../../qr/dimsum.png` (same directory as the other scene QR codes).

One simple interaction, following the herbal-soup game: drag four dishes onto
one shared table. No matching requests, rotation, timer, score, or tea-pouring
stage. A tap-a-dish → tap-the-table alternative also supports keyboard input.
After all four dishes, tap Continue for English, Chinese, and bilingual
reflection pages, then Replay. All game objects and the camera are hidden
while reading. Back returns to the completed table; Replay clears it.

Plain HTML/CSS/JavaScript, no dependencies or build step. Like the lion scene,
this is a camera-relative overlay, not a spatially anchored table. Camera
permission is requested on Yes, and denial never blocks playing. Nothing is
recorded, uploaded, or location-detected. A restaurant name can be added when
the location is chosen; none has been invented.

Run tests: `node --test code/dimsum/dimsum.test.cjs` from the repository root.
Preview: `python3 -m http.server 8765 --bind 127.0.0.1`, then open
`http://127.0.0.1:8765/code/dimsum/`.

## Assets and story

Five original photographic cutouts were generated with the built-in image
generation tool, with actual transparent backgrounds, then resized to 640px
PNG assets. No restaurant photos or third-party food artwork were copied.
The teapot is decorative only. Table geometry is CSS.

The story's general yum cha context is based on the
[MICHELIN Guide](https://guide.michelin.com/hk/en/best-of/best-dim-sum-yun-cha-hong-kong).
The remaining text is an original reflection on sharing. It is not a local
interview or evidence about a specific Chinatown restaurant.

### Generation prompt set

Shared prompt: “Use case: product-mockup. Asset type: transparent food sprite
for a mobile Chinatown AR dim sum sharing game. Style: photorealistic food
photography, warm soft daylight, natural appetizing textures, soft shadows
within the object only. Camera: elevated three-quarter view from about 55
degrees above the table, showing the food tops and the front edge of its
container. Entire object centered, comfortably filling a square composition
with transparent margin all around. Background: genuinely transparent alpha,
not a checkerboard or white surface. No table, hands, people, utensils, text,
logos, watermarks, or floating decorative ingredients. Clean smooth cutout
edges.” Each was generated separately with transparency enabled.

- `assets/har-gow.png`: One small light honey-colored bamboo steamer without
  a lid, holding three pleated translucent-white har gow shrimp dumplings.
- `assets/siu-mai.png`: One matching steamer without a lid, holding three
  yellow open-top pork-and-shrimp siu mai, with tiny orange roe garnishes.
- `assets/char-siu-bao.png`: One matching steamer without a lid, holding two
  fluffy white steamed char siu bao with split, softly wrinkled tops.
- `assets/egg-tart.png`: One small white porcelain plate with two golden,
  flaky Cantonese egg tarts with glossy yellow custard; no garnish.
- `assets/teapot.png`: One small white Chinese porcelain restaurant teapot,
  lid on, spout left, handle right, with thin cobalt-blue floral accents.
