/* Films-at-the-Gate movie screen.
   A single flat panel whose texture is the current photo, so screen + image
   move and zoom together and always fit perfectly. Camera-relative (steady):
     drag  -> orbit it around you
     pinch -> zoom
     tap   -> next photo (panel resizes to that photo's aspect ratio)
*/

(function () {
  // ---- Tuning ----
  const COUNT = 10            // number of photos (img0..img9)
  const BASE_H = 1.5          // panel height in metres (width follows photo aspect)
  const ORBIT_SENS = 0.15     // degrees per pixel dragged
  const MIN_SCALE = 0.4, MAX_SCALE = 4.0
  // ----------------

  let idx = 0, theta = 0, scale = 1

  window.addEventListener('DOMContentLoaded', () => {
    const rig = document.getElementById('orbitRig')
    const screen = document.getElementById('screen')
    const hint = document.getElementById('hint')
    const surface = document.getElementById('tapcatcher')

    const applyScale = () => screen.setAttribute('scale', `${scale} ${scale} ${scale}`)
    const applyOrbit = () => rig.setAttribute('rotation', `0 ${theta} 0`)

    // Resize the panel to match a photo's aspect ratio so it fills edge-to-edge.
    function fit(i) {
      const img = document.getElementById('img' + i)
      const ar = (img && img.naturalWidth) ? img.naturalWidth / img.naturalHeight : 1.5
      screen.setAttribute('geometry', `primitive: plane; width: ${(BASE_H * ar).toFixed(3)}; height: ${BASE_H}`)
    }

    function show(i) {
      idx = (i % COUNT + COUNT) % COUNT
      const img = document.getElementById('img' + idx)
      screen.setAttribute('material', 'src', '#img' + idx)
      if (img && img.naturalWidth) fit(idx)
      else if (img) img.addEventListener('load', () => fit(idx), { once: true })
      if (hint) hint.textContent =
        `Photo ${idx + 1}/${COUNT} · drag to move · pinch to zoom · tap for next`
    }

    // ---- gestures (same scheme as the tai-chi scene) ----
    let oneActive = false, startX = 0, startTheta = 0, dragged = false
    let pinchActive = false, startPinch = 0, startScale = 0
    const pinchDist = (t) =>
      Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY)

    surface.addEventListener('touchstart', (e) => {
      if (e.touches.length >= 2) {
        pinchActive = true; oneActive = false
        startPinch = pinchDist(e.touches); startScale = scale
      } else if (e.touches.length === 1) {
        oneActive = true; pinchActive = false
        startX = e.touches[0].clientX; startTheta = theta; dragged = false
      }
    }, { passive: false })

    surface.addEventListener('touchmove', (e) => {
      if (pinchActive && e.touches.length >= 2) {
        scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, startScale * pinchDist(e.touches) / startPinch))
        applyScale(); e.preventDefault()
      } else if (oneActive && e.touches.length === 1) {
        const dx = e.touches[0].clientX - startX
        if (Math.abs(dx) > 8) dragged = true
        theta = startTheta - dx * ORBIT_SENS
        applyOrbit(); e.preventDefault()
      }
    }, { passive: false })

    surface.addEventListener('touchend', (e) => {
      if (oneActive && !dragged) show(idx + 1)        // clean tap -> next photo
      if (e.touches.length === 0) { oneActive = false; pinchActive = false }
    })

    applyScale(); applyOrbit(); show(0)
  })
})()
