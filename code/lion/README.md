# Phillips Square: Bring the Lion Dance into Motion

New independent static page: `code/lion/`. Existing activities are unchanged.

## Flow

The opening screen shows a drawing of the green tables and seats
(`assets/green-tables.svg`) and asks “Do you see the green tables and seats at
Phillips Square?” with a Yes button.
The question has a transparent background over the camera, requested on opening.
Yes opens the lion scene; it does not check GPS. The hold button is English only.
Small gold and coral fireworks animate with the held interaction, freeze when
released, and reset on replay. They have no sound or full-screen flashes and
are omitted for reduced-motion preferences.

Hold the button (or Space/Enter) for eight cumulative seconds. Release to pause.
Completion opens the English story automatically → Chinese → bilingual reflection → Replay.
Returning to the interaction resets progress. The scene contains only the lion,
hold button, and thin progress indicator, with camera recovery controls only on error.

The transparent photographic cutout follows an eight-second authored sequence:
short steps, a low dip, a held crouch, a rise, side steps, and a closing dip.
Reference: https://www.facebook.com/roadtripnewengland/videos/819381374509675/
Raised and lower postures in that clip informed this stylized approximation;
the video itself is not copied or embedded. The cutout still moves as one image. It is not
an articulated or motion-captured lion dance. Rear-camera video is requested on opening and provides
a screen-relative overlay, not a world-anchored object or location detector.
Camera access requires HTTPS (or localhost) and explicit permission. No camera
images or answers are recorded or uploaded. Camera stops on backgrounding and
when opening the story. Camera restarts when returning to the scene.
Desktop/no-camera preview remains available if access fails or is denied.

## Asset provenance

Second lion: `assets/lion-white-pink.png`, generated with the built-in image tool,
not extracted from Facebook. Its independent slower bow/rise sequence shares
the hold progress and pause state with the first lion. Both remain single-image
animations. The white lion is on the left and the red lion on the right so their
heads face inward, including on phones. The white lion now performs greeting
nods, approaching steps, a crouch and hop with a soft landing, retreating steps,
a smaller hop, and a closing bow within the same eight-second interaction.

Generation prompt: Use case: photorealistic-natural. Asset type: transparent PNG
sprite for a mobile Boston Chinatown lion-dance prototype. Create one complete
traditional Southern Chinese lion dance costume with two performers underneath,
in a low crouched bow pose, head facing right in three-quarter side view. White
fluffy fur with pink and gold decorative details, expressive traditional large
eyes, curved horn, sequined cloth body, four visible performer shoes naturally
grounded. Realistic photographic texture and natural soft daylight, matching a
photographic cutout rather than cartoon or 3D render. Inspired generally by a
Chinatown street lion performance, not an exact reproduction of a specific video
frame. Entire lion and all shoes inside frame with small even margins. Genuine
transparent background. No street, people outside costume, buildings, floor,
shadow backdrop, text, border, flags, props or watermark. One lion only.

`assets/lion.png` was created with the built-in image generator from the user's
provided lion-dance photo. Prompt: isolate only the main red/gold lion costume
and its performers; remove buildings, flags, banners, spectators, street, stage
and railing; preserve photographic textures; use genuine transparency and no
added text or background. AI extraction can change details. Confirm photograph
rights and cultural suitability before public study deployment.

English and Chinese body copy and the reflection question follow the supplied
script images and the user's requested question. Story text is selectable and
scrollable rather than embedded in a raster image.

## Preview / publish

Serve the repository and open `/code/lion/`.
`qr/lion.png` encodes https://yuzerichardli.github.io/chinatown-ar/code/lion/
This is a prepared production QR, not proof of deployment. Publish the new
`code/lion/` directory through the existing GitHub Pages workflow before use.

## Checks

Run `node code/lion/lion.test.cjs` for deterministic interaction tests.
Also test camera permission and touch input on an actual iPhone/Android device
over HTTPS before the field study.
