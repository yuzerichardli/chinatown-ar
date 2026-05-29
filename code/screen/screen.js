/* Films-at-the-Gate: photos play on the screen face of the screen.glb model.
   The model + photo plane live in one group, so they move/zoom together:
     drag  -> orbit the screen around you
     pinch -> zoom
     tap   -> next photo
   Each photo is fitted INSIDE the screen opening (preserving aspect, so no
   stretching — like a film with letterboxing on a cinema screen). */

(function () {
  // ---- Tuning ----
  const COUNT = 10
  const SCREEN_W = 1.40       // usable screen opening (model units)
  const SCREEN_H = 1.05
  const ORBIT_SENS = 0.15
  const MIN_SCALE = 0.25, MAX_SCALE = 3.0
  // ----------------

  let idx = 0, theta = 0, scale = 0.75   // start scale matches index.html

  window.addEventListener('DOMContentLoaded', () => {
    const rig = document.getElementById('orbitRig')
    const group = document.getElementById('screenGroup')
    const pic = document.getElementById('picplane')
    const hint = document.getElementById('hint')
    const surface = document.getElementById('tapcatcher')

    const applyScale = () => group.setAttribute('scale', `${scale} ${scale} ${scale}`)
    const applyOrbit = () => rig.setAttribute('rotation', `0 ${theta} 0`)

    // Fit the photo inside the screen opening, preserving its aspect ratio.
    function fit(i) {
      const img = document.getElementById('img' + i)
      const ar = (img && img.naturalWidth) ? img.naturalWidth / img.naturalHeight : 1.5
      let w = SCREEN_W, h = SCREEN_W / ar
      if (h > SCREEN_H) { h = SCREEN_H; w = SCREEN_H * ar }
      pic.setAttribute('geometry', `primitive: plane; width: ${w.toFixed(3)}; height: ${h.toFixed(3)}`)
    }

    function show(i) {
      idx = (i % COUNT + COUNT) % COUNT
      const img = document.getElementById('img' + idx)
      pic.setAttribute('material', 'src', '#img' + idx)
      if (img && img.naturalWidth) fit(idx)
      else if (img) img.addEventListener('load', () => fit(idx), { once: true })
      if (hint) hint.textContent =
        `Scene ${idx + 1}/${COUNT} · drag to move · pinch to zoom · tap for next`
    }

    // ---- gestures ----
    let oneActive = false, startX = 0, startTheta = 0, dragged = false
    let pinchActive = false, startPinch = 0, startScale = 0
    const pinchDist = (t) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY)

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
      if (oneActive && !dragged) show(idx + 1)
      if (e.touches.length === 0) { oneActive = false; pinchActive = false }
    })

    applyScale(); applyOrbit(); show(0)
  })
})()
