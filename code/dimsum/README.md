# Dim sum — Share the Table

Live: https://yuzerichardli.github.io/chinatown-ar/code/dimsum/
QR: `../../qr/dimsum.png` (same directory as the other scene QR codes).
This existing QR opens the latest deployed version of the dim sum activity.

Two short interactions, following the herbal-soup game: share dim sum on one
table, then serve tea to three cups. No matching requests, rotation, timer,
or score. A tap-a-dish → tap-the-table alternative also supports keyboard input.
The dish-sharing view has no visible labels, instructions, headings, or counters.
Its Continue button is available immediately: sharing any or all dishes is optional.
Continue places any remaining dishes on the table and adds three matching cups
around its edge, without removing the existing table or placed dishes. One line
says “Drag the teapot to fill each cup.” Drop the pot over each cup opening to
trigger a tilt, tea stream, filling tea surface, and ripple animation. Tap the
teapot → tap an empty cup is also supported. Each cup fills once; pours cannot
overlap. After the third pour finishes, “Enjoy your meal!” and Continue appear.
That Continue opens English, Chinese, and bilingual reflection pages, then Replay.
All game objects and the camera are hidden while reading. Back preserves the
served table and filled cups; Replay clears dishes and tea. Leaving the page,
switching away, or resizing during a pour cancels it safely without counting
that cup. Reduced-motion mode uses a short static pouring pose instead.
The opening shows a drawing of the 180 Café
sign and asks “Are you in front of the 180 cafe?” → Yes, matching the landmark
openings in the other activities.
All button labels are English-only; the Chinese story and bilingual reflection
remain unchanged.

Plain HTML/CSS/JavaScript, no dependencies or build step. Like the lion scene,
this is a camera-relative overlay, not a spatially anchored table. Camera
permission is requested on Yes, and denial never blocks playing. Nothing is
recorded, uploaded, or location-detected.

Run tests: `node --test code/dimsum/dimsum.test.cjs` from the repository root.
Preview: `python3 -m http.server 8765 --bind 127.0.0.1`, then open
`http://127.0.0.1:8765/code/dimsum/`.

## Assets and story

The current scene uses a coordinated set of transparent, softly shaded
3D-style sprites. The existing food and teapot cutouts were restyled with the
built-in image-generation tool, using the herbal-soup pot as a lighting and
material reference. The new wood tabletop and raised glass lazy Susan were
generated separately in the same finish. No restaurant photographs or
third-party food artwork were copied. These are lightweight image sprites,
not new GLB models or spatially anchored objects. The same teapot sprite is
used on the table, while dragging, and for the pouring animation. The lazy
Susan remains visual only; no rotation task has been added.

Current files in `assets/`:

- `har-gow-3d.png`, `siu-mai-3d.png`, `char-siu-bao-3d.png`,
  `egg-tart-3d.png`, `teapot-3d.png`: 640px RGBA PNGs.
- `lazy-susan.png`: 1024 × 683 RGBA PNG, displayed without distorting its
  perspective. Shared dishes use small contact shadows on its surface.
- `tea-cup-3d.png`: 640px RGBA PNG, matching the ivory/cobalt-blue teapot.
  An animated CSS tea surface sits inside the opening, so the cup's shape,
  decoration, and position stay identical while it fills.

The original five PNGs remain in the folder, unused, for rollback. New
filenames and bumped controller/style versions avoid stale cached pictures.
The dark preview background, red buttons, and cream story pages use the
other activities' colours and dimensions.

`assets/180-cafe-sign.svg` is a flat vector landmark drawing based on the
storefront reference supplied by the project owner: a grey signboard, orange
180° Café logo, and 面包工坊 lettering. The reference photograph is not copied
into the public repository.

The English and Chinese story and bilingual reflection question were supplied
by the project owner, including Judy Wang's family-gathering quotation and her
attribution as President of the Women’s Auxiliary at the Wong Family Benevolent
Association. The story preserves that wording, with the quotations displayed
as blockquotes. Pages follow the other scenes: English → Chinese → bilingual
reflection, on the same cream reading background with Back, Next, and Replay.

### Current visual prompt set (built-in tool)

Har gow edit target: the original `har-gow.png`. Supporting style reference:
`../herbs/assets/herbal-pot.png`, not an object to include in the result.
Exact prompt:

> Use case: style-transfer. Asset type: transparent mobile AR game sprite.
> Image 1 is the edit target: three har gow shrimp dumplings in one open
> bamboo steamer. Image 2 is a style reference ONLY: the textured Chinese
> clay pot from the existing herbal-soup AR activity; do not include or copy
> the pot. Restyle Image 1 into a softly shaded, lightly stylized realistic
> 3D game object that belongs with that pot and textured 3D herbs, rather
> than a glossy commercial food photograph. Keep exactly three recognizable
> pleated pale ivory har gow in one warm bamboo steamer with no lid. Smooth
> sculpted volume, restrained natural bamboo texture, soft diffuse upper-left
> lighting, gentle baked-in contact shading; reduce glossy wet highlights
> and micro-detail. Elevated three-quarter view about 40 degrees above
> horizontal, entire steamer centered with a small even transparent margin.
> Retain appealing realistic food colors, not cartoon faces or flat icons.
> Genuine transparent alpha background, no table, floor, environment, ground
> shadow, text, watermark, border, steam, or extra objects. Do not include
> the reference pot.

Each remaining object was edited separately with three references: its
original image, the herbal pot, and the newly generated har gow as the set's
style anchor. Exact common prompt, followed by one subject prompt below:

> Use case: style-transfer. Asset type: transparent mobile AR game sprite.
> Image 1 is the edit target; Image 2 is a lighting/material style reference
> ONLY, the Chinese herbal-soup pot from an existing activity; Image 3 is
> the matching har gow sprite to match bamboo color, soft shading, and
> viewing angle. Do not include any reference objects. Change only the
> visual finish and viewpoint, keeping the food or teapot identity.
> Cohesive lightly stylized realistic 3D game-object rendering, rounded
> clean modeled geometry, restrained baked-in textures, warm diffuse
> upper-left light, gentle contact shading, matte/soft-satin materials,
> NOT a sharply lit commercial food photograph. Same elevated three-quarter
> view about 40 degrees above horizontal. Complete object centered with a
> small even transparent margin; genuinely transparent alpha background.
> No table, floor, ground shadow, people, text, watermarks, border, steam,
> flat vector outline, or extra props.

- Siu mai: “Subject: exactly three yellow open-top siu mai dumplings, with
  pale pork-and-shrimp fillings and small orange roe garnishes, in one open
  warm honey-brown bamboo steamer with no lid. Match the har gow steamer's
  materials, proportions, and soft 3D shading.”
- Char siu bao: “Subject: exactly two ivory steamed char siu bao with gently
  split fluffy tops and small visible brown filling, in one open warm
  honey-brown bamboo steamer without a lid. Smooth soft bun forms with
  understated dough texture. Match the har gow steamer's materials,
  proportions, and soft 3D shading.”
- Egg tart: “Subject: exactly two golden Cantonese egg tarts on one small
  warm ivory porcelain plate. Simplified modeled flaky edges and softly
  satin yellow custard, no wet glossy glare. Match the other dishes' warm
  natural colors and soft 3D shading.”
- Teapot: “Subject: one small traditional round Chinese teapot, lid on,
  curved spout on the left and handle on the right. Warm ivory ceramic
  with restrained cobalt-blue floral decoration, simplified readable
  brushwork, soft satin glaze and smooth rounded form. Keep the teapot
  physically plausible and complete, with no cups.”

Lazy Susan: new generation, no image input. Exact prompt:

> Use case: stylized-concept. Asset type: transparent mobile Chinatown AR
> game sprite. Primary request: an empty round Chinese restaurant tabletop
> with a clearly visible separate raised circular lazy Susan serving
> turntable, to hold draggable dim sum dishes. Cohesive softly shaded
> lightly stylized realistic 3D model render, matching natural textured
> Chinese clay pots and warm bamboo food containers: smooth modeled volume,
> restrained fine texture, warm diffuse upper-left lighting, matte/soft-satin
> materials, not a flat icon or a product photograph. Round warm medium
> honey-brown wood tabletop, with a slightly smaller pale warm frosted-glass
> circular lazy Susan on top, about 78% of the table diameter; readable
> gently raised glass rim and subtle central support/shading so the turntable
> is distinct from the main table. Elevated three-quarter camera view about
> 40 degrees above horizontal, circle naturally seen as an ellipse. Entire
> tabletop and turntable visible centered, mostly empty serving area, thin
> wood front edge only, NO legs, pedestal, chairs, floor, environment, food,
> dishes, teapot, cups, cutlery, people, text, logo, border, or watermark.
> Genuinely transparent alpha around the object. Natural transparent margin,
> no opaque background and no giant external shadow.

One background-cleanup edit used that table as its only input. Exact prompt:

> Use case: background-extraction. Edit target: the wooden circular tabletop
> and raised frosted-glass lazy Susan in this image. Keep the tabletop and
> glass turntable exactly unchanged in design, materials, colors, camera
> angle, perspective, dimensions, and position. Remove ALL surrounding
> amber glow, brown haze, ground/floor shadow, vignette, and background
> behind and below the tabletop. The output must contain only the complete
> tabletop plus the glass turntable, with clean smooth anti-aliased silhouette
> edges and genuinely clear transparent alpha everywhere outside the
> physical objects. No external shadow. Preserve the softly shaded warm
> wood, glass rim, and central turntable support. Do not add legs, pedestal,
> food, people, text, frames, or other objects.

These seven restyling calls used `transparent_background: true`. Final assets were
resized with their alpha preserved; transparent padding is not an opaque
background. Browser checks cover the normal game, drag/tap placement,
full table, optional dish-sharing Continue, sequential tea serving, Back/Replay,
and clean story screens.

### Tea cup prompt (built-in tool)

New generation with `teapot-3d.png` as a style/material reference only, using
`transparent_background: true`. The generated alpha was preserved when resizing
to the project asset `assets/tea-cup-3d.png`. Exact prompt:

> Use case: stylized-concept. Asset type: transparent mobile Chinatown AR game sprite. Primary request: one empty handleless Chinese restaurant tea cup to match the teapot in Image 1. Image 1 is a style/material reference ONLY; do not include the teapot. Subject: one small round warm ivory porcelain tea cup, with restrained cobalt-blue floral brushwork matching the reference, thin blue rim, short circular foot, smooth softly rounded sides. The cup is EMPTY: clearly visible clean ivory interior, no liquid. Cohesive lightly stylized realistic 3D rendering, softly satin glaze, warm diffuse upper-left lighting, gentle baked-in shading, same elevated three-quarter view about 40 degrees above horizontal as the reference. Straight-on symmetric cup; opening is a broad readable horizontal ellipse, not a steep top-down view. Complete cup centered with small even transparent margin; isolated on genuinely transparent alpha. No saucer, handle, lid, teapot, table, floor, environment, external ground shadow, steam, people, text, logos, watermark, border, or extra objects. Keep silhouette edges smooth and clean.

### Original generation prompt set (retained assets)

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
