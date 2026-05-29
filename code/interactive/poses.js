/* Camera-relative tai chi master with Lens-style gestures:
     • drag (one finger)  -> orbit him around YOU on a circle (you're the center,
                             he keeps facing you) — not spinning on the spot
     • pinch (two fingers) -> zoom him bigger / smaller
     • tap (no drag)       -> change to the next pose, in the same spot/size

   He's attached to a rig on the camera, so he's rock-steady (no world-tracking
   drift). Dragging rotates the rig; pinch scales the model. */

(function () {
  // ---- Tuning ----
  const ORBIT_SENS = 0.3   // degrees he travels around you per pixel dragged
  const MIN_SCALE = 1.0
  const MAX_SCALE = 6.0
  let scale = 2.5          // starting size
  // ----------------

  const IDS = ['poseEntity0', 'poseEntity1', 'poseEntity2']
  let idx = 0
  let theta = 0            // orbit angle (degrees)

  window.addEventListener('DOMContentLoaded', () => {
    const rig = document.getElementById('orbitRig')
    const entities = IDS.map((id) => document.getElementById(id))
    const hint = document.getElementById('hint')
    const surface = document.getElementById('tapcatcher')

    const applyScale = () =>
      entities.forEach((e) => e.setAttribute('scale', `${scale} ${scale} ${scale}`))
    const applyOrbit = () => rig.setAttribute('rotation', `0 ${theta} 0`)

    // gesture state
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
        const ratio = pinchDist(e.touches) / startPinch
        scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, startScale * ratio))
        applyScale()
        e.preventDefault()
      } else if (oneActive && e.touches.length === 1) {
        const dx = e.touches[0].clientX - startX
        if (Math.abs(dx) > 8) dragged = true
        theta = startTheta + dx * ORBIT_SENS
        applyOrbit()
        e.preventDefault()
      }
    }, { passive: false })

    surface.addEventListener('touchend', (e) => {
      // A clean tap (single finger, no drag) cycles the pose.
      if (oneActive && !dragged) {
        entities[idx].setAttribute('visible', 'false')
        idx = (idx + 1) % entities.length
        entities[idx].setAttribute('visible', 'true')
        if (hint) hint.textContent =
          `Pose ${idx + 1}/${entities.length} · drag to move · pinch to zoom`
      }
      if (e.touches.length === 0) { oneActive = false; pinchActive = false }
    })

    applyScale()
    applyOrbit()
  })
})()
