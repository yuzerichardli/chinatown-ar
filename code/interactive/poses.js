/* World-anchored tai chi master with tap-to-cycle poses.
   On AR start he is spawned ONCE directly in front of the camera (so he's
   centered + facing you), then left in world space so he stays put as you
   walk around. A tap toggles which preloaded pose is visible (no reloading),
   so each pose appears in the same spot and size.

   There is also a temporary on-screen camera-position readout (#dbg) so we can
   verify whether 6DoF positional tracking is actually running. */

(function () {
  const THREE = AFRAME.THREE

  // ---- Tuning ----
  const DIST = 2       // how far in front of you he spawns
  const Y_OFFSET = 0     // 0 = his center sits at camera/eye level, directly in front
  const SCALE = '2.5 2.5 2.5'  // a bit larger
  // ----------------

  const IDS = ['poseEntity0', 'poseEntity1', 'poseEntity2']
  let idx = 0
  let placed = false

  window.addEventListener('DOMContentLoaded', () => {
    const scene = document.querySelector('a-scene')
    const entities = IDS.map((id) => document.getElementById(id))
    const hint = document.getElementById('hint')
    const dbg = document.getElementById('dbg')

    // Tap to cycle pose (in place)
    document.getElementById('tapcatcher').addEventListener('click', () => {
      entities[idx].setAttribute('visible', 'false')
      idx = (idx + 1) % entities.length
      entities[idx].setAttribute('visible', 'true')
      if (hint) hint.textContent = `Pose ${idx + 1} / ${entities.length} — tap to change`
    })

    // Place him once, directly ahead of where the camera is looking.
    function placeInFront() {
      const cam = scene.camera
      if (!cam) return false
      const P = new THREE.Vector3(); cam.getWorldPosition(P)
      const F = new THREE.Vector3(); cam.getWorldDirection(F)  // camera forward (-Z)
      F.y = 0
      if (F.lengthSq() < 1e-6) return false
      F.normalize()
      const T = P.clone().add(F.multiplyScalar(DIST))
      T.y = P.y + Y_OFFSET
      const dir = P.clone().sub(T)                              // from him toward camera
      const yaw = THREE.MathUtils.radToDeg(Math.atan2(dir.x, dir.z))
      entities.forEach((e) => {
        e.setAttribute('position', `${T.x.toFixed(3)} ${T.y.toFixed(3)} ${T.z.toFixed(3)}`)
        e.setAttribute('rotation', `0 ${yaw.toFixed(1)} 0`)
        e.setAttribute('scale', SCALE)
      })
      return true
    }

    scene.addEventListener('realityready', () => { placed = placeInFront() })

    // Debug + safety placement loop
    function tick() {
      const cam = scene.camera
      if (cam) {
        if (!placed) placed = placeInFront()
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
