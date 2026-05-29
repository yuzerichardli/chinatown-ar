/* Films-at-the-Gate.
   Scenes 1–8: photos play on the screen.glb screen face, cover-cropped to fill
               it edge-to-edge (no white border, no stretching).
   Scenes 9–10: story/description slides — the 3D screen is hidden and the image
               is shown FULL-SCREEN on the phone, large and readable.
   Gestures (photo scenes): drag = orbit, pinch = zoom, tap = next.
   Tap also advances through the story slides and loops back to scene 1. */

(function () {
  // ---- Tuning ----
  const COUNT = 10            // total slides (img0..img9)
  const STORY_FROM = 8        // idx >= 8 (pics 9 & 10) are full-screen stories
  const PLANE_W = 1.49, PLANE_H = 1.05   // matches picplane geometry in index.html
  const ORBIT_SENS = 0.15
  const MIN_SCALE = 0.25, MAX_SCALE = 3.0
  // ----------------

  let idx = 0, theta = 0, scale = 0.75

  window.addEventListener('DOMContentLoaded', () => {
    const rig = document.getElementById('orbitRig')
    const group = document.getElementById('screenGroup')
    const pic = document.getElementById('picplane')
    const hint = document.getElementById('hint')
    const surface = document.getElementById('tapcatcher')
    const story = document.getElementById('story')
    const storyImg = document.getElementById('storyimg')

    const applyScale = () => group.setAttribute('scale', `${scale} ${scale} ${scale}`)
    const applyOrbit = () => rig.setAttribute('rotation', `0 ${theta} 0`)
    const fname = (i) => `pictures/pic${String(i + 1).padStart(2, '0')}.jpg`

    // Cover-crop: scale the texture so the photo fills the whole plane with no
    // white bars and no distortion (centre-crop the overflow).
    function applyCover() {
      const mesh = pic.getObject3D('mesh')
      const map = mesh && mesh.material && mesh.material.map
      if (!map || !map.image) return
      const iar = map.image.width / map.image.height
      const par = PLANE_W / PLANE_H
      let rx = 1, ry = 1
      if (iar > par) { rx = par / iar } else { ry = iar / par }
      map.repeat.set(rx, ry)
      map.offset.set((1 - rx) / 2, (1 - ry) / 2)
      map.needsUpdate = true
    }
    pic.addEventListener('materialtextureloaded', applyCover)

    function show(i) {
      idx = (i % COUNT + COUNT) % COUNT
      if (idx >= STORY_FROM) {
        // full-screen story slide
        group.setAttribute('visible', 'false')
        storyImg.src = fname(idx)
        story.style.display = 'block'
        if (hint) hint.textContent = `Story ${idx - STORY_FROM + 1}/${COUNT - STORY_FROM} · tap for next`
      } else {
        // photo on the 3D screen
        story.style.display = 'none'
        group.setAttribute('visible', 'true')
        pic.setAttribute('material', 'src', '#img' + idx)
        applyCover()
        if (hint) hint.textContent = `Scene ${idx + 1}/${STORY_FROM} · drag · pinch · tap for next`
      }
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
