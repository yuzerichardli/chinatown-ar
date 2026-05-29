/* Tai-chi scene.
   Slides: 4 master poses (3D, on a camera rig) → 2 full-screen story slides.
     drag (one finger)  -> orbit the master around you
     pinch (two fingers)-> zoom
     tap (no drag)      -> next slide (pose → pose → … → story → story → loop)
   Story slides hide the 3D master and show a full-screen image with the live
   camera still behind it (transparent background). */

(function () {
  // ---- Tuning ----
  const ORBIT_SENS = 0.15
  const MIN_SCALE = 1.0, MAX_SCALE = 6.0
  let scale = 2.5
  // ----------------

  const POSE_IDS = ['poseEntity0', 'poseEntity1', 'poseEntity2', 'poseEntity3']
  const STORY_COUNT = 2
  const POSE_COUNT = POSE_IDS.length
  const TOTAL = POSE_COUNT + STORY_COUNT
  let idx = 0, theta = 0

  window.addEventListener('DOMContentLoaded', () => {
    const rig = document.getElementById('orbitRig')
    const entities = POSE_IDS.map((id) => document.getElementById(id))
    const hint = document.getElementById('hint')
    const surface = document.getElementById('tapcatcher')
    const story = document.getElementById('story')
    const storyImg = document.getElementById('storyimg')

    const applyScale = () =>
      entities.forEach((e) => e.setAttribute('scale', `${scale} ${scale} ${scale}`))
    const applyOrbit = () => rig.setAttribute('rotation', `0 ${theta} 0`)

    function show(i) {
      idx = (i % TOTAL + TOTAL) % TOTAL
      entities.forEach((e) => e.setAttribute('visible', 'false'))
      if (idx < POSE_COUNT) {
        story.style.display = 'none'
        entities[idx].setAttribute('visible', 'true')
        if (hint) hint.textContent =
          `Pose ${idx + 1}/${POSE_COUNT} · drag to move · pinch to zoom · tap for next`
      } else {
        const s = idx - POSE_COUNT + 1
        storyImg.src = `stories/taichi${s}.jpg`
        story.style.display = 'block'
        if (hint) hint.textContent = `Story ${s}/${STORY_COUNT} · tap for next`
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
