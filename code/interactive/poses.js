/* World-anchored tai chi master with tap-to-cycle poses.

   Placement: we wait ~1.5s after the camera/tracking comes up (so it knows your
   real eye height), THEN spawn him ONCE directly in front of you at eye level,
   and leave him there in world space — so he stays put and you can walk around
   to his back. A tap toggles which preloaded pose is visible (same spot/size).

   #dbg shows the live camera position (temporary, for verifying tracking). */

(function () {
  const THREE = AFRAME.THREE

  // ---- Tuning ----
  const DIST = 1.3              // how far in front he spawns (smaller = closer + easier to circle)
  const Y_OFFSET = 0           // 0 = his center at camera/eye level
  const SCALE = '3.6 3.6 3.6'  // bigger / smaller
  const SETTLE_MS = 1500       // wait for tracking to settle before placing
  // ----------------

  const IDS = ['poseEntity0', 'poseEntity1', 'poseEntity2']
  let idx = 0
  let placed = false
  let camFirstSeen = 0

  window.addEventListener('DOMContentLoaded', () => {
    const scene = document.querySelector('a-scene')
    const entities = IDS.map((id) => document.getElementById(id))
    const hint = document.getElementById('hint')
    const dbg = document.getElementById('dbg')

    entities.forEach((e) => e.setAttribute('visible', 'false'))  // hidden until placed
    if (hint) hint.textContent = 'Look ahead and hold steady…'

    // Tap to cycle pose (only after he's placed)
    document.getElementById('tapcatcher').addEventListener('click', () => {
      if (!placed) return
      entities[idx].setAttribute('visible', 'false')
      idx = (idx + 1) % entities.length
      entities[idx].setAttribute('visible', 'true')
      if (hint) hint.textContent = `Pose ${idx + 1} / ${entities.length} — tap to change`
    })

    // Spawn him once, directly ahead at the camera's current eye level.
    function placeInFront() {
      const cam = scene.camera
      if (!cam) return false
      const P = new THREE.Vector3(); cam.getWorldPosition(P)
      const F = new THREE.Vector3(); cam.getWorldDirection(F)  // forward (-Z)
      F.y = 0
      if (F.lengthSq() < 1e-6) return false
      F.normalize()
      const T = P.clone().add(F.multiplyScalar(DIST))
      T.y = P.y + Y_OFFSET
      const dir = P.clone().sub(T)                              // from him toward you
      const yaw = THREE.MathUtils.radToDeg(Math.atan2(dir.x, dir.z))
      entities.forEach((e) => {
        e.setAttribute('position', `${T.x.toFixed(3)} ${T.y.toFixed(3)} ${T.z.toFixed(3)}`)
        e.setAttribute('rotation', `0 ${yaw.toFixed(1)} 0`)
        e.setAttribute('scale', SCALE)
      })
      entities[0].setAttribute('visible', 'true')               // reveal first pose
      if (hint) hint.textContent = 'Tap anywhere to change pose · walk around him'
      return true
    }

    function tick() {
      const cam = scene.camera
      if (cam) {
        if (!camFirstSeen) camFirstSeen = performance.now()
        if (!placed && performance.now() - camFirstSeen > SETTLE_MS) placed = placeInFront()
        if (dbg) {
          const P = new THREE.Vector3(); cam.getWorldPosition(P)
          dbg.textContent =
            `cam x:${P.x.toFixed(2)} y:${P.y.toFixed(2)} z:${P.z.toFixed(2)}  placed:${placed}`
        }
      }
      requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  })
})()
