/* World-anchored tai chi master with tap-to-place + tap-to-cycle.

   FIRST tap  -> places him directly in front of you, at the camera's CURRENT
                 eye level (reliable, because you tap when holding the phone
                 where you want him). He then stays anchored in world space.
   LATER taps -> cycle the pose (same spot, same size).

   #dbg shows the live camera position and, after placing, the distance from you
   to him (temporary — used to verify tracking and tune the world scale). */

(function () {
  const THREE = AFRAME.THREE

  // ---- Tuning ----
  const DIST = 2.2             // how far in front he is placed (further away)
  const Y_OFFSET = 0           // 0 = his center at your eye level
  const SCALE = '2.5 2.5 2.5'  // smaller
  // ----------------

  const IDS = ['poseEntity0', 'poseEntity1', 'poseEntity2']
  let idx = 0
  let locked = false

  window.addEventListener('DOMContentLoaded', () => {
    const scene = document.querySelector('a-scene')
    const entities = IDS.map((id) => document.getElementById(id))
    const hint = document.getElementById('hint')
    const dbg = document.getElementById('dbg')

    entities.forEach((e) => e.setAttribute('visible', 'false'))
    if (hint) hint.textContent = 'Point where you want him, then tap to place'

    function placeInFront() {
      const cam = scene.camera
      if (!cam) return false
      const P = new THREE.Vector3(); cam.getWorldPosition(P)
      const F = new THREE.Vector3(); cam.getWorldDirection(F)  // forward (-Z)
      F.y = 0
      if (F.lengthSq() < 1e-6) return false
      F.normalize()
      const T = P.clone().add(F.multiplyScalar(DIST))
      T.y = P.y + Y_OFFSET                                      // his center at your eye height
      const dir = P.clone().sub(T)
      const yaw = THREE.MathUtils.radToDeg(Math.atan2(dir.x, dir.z))
      entities.forEach((e) => {
        e.setAttribute('position', `${T.x.toFixed(3)} ${T.y.toFixed(3)} ${T.z.toFixed(3)}`)
        e.setAttribute('rotation', `0 ${yaw.toFixed(1)} 0`)
        e.setAttribute('scale', SCALE)
      })
      entities[0].setAttribute('visible', 'true')
      return true
    }

    document.getElementById('tapcatcher').addEventListener('click', () => {
      if (!locked) {                                  // first tap = place him
        if (placeInFront()) {
          locked = true
          if (hint) hint.textContent = 'Walk around him · tap to change pose'
        }
        return
      }
      entities[idx].setAttribute('visible', 'false')  // later taps = cycle pose
      idx = (idx + 1) % entities.length
      entities[idx].setAttribute('visible', 'true')
      if (hint) hint.textContent = `Pose ${idx + 1} / ${entities.length} — tap to change`
    })

    function tick() {
      const cam = scene.camera
      if (cam && dbg) {
        const P = new THREE.Vector3(); cam.getWorldPosition(P)
        let s = `cam x:${P.x.toFixed(2)} y:${P.y.toFixed(2)} z:${P.z.toFixed(2)}`
        if (locked) {
          const fp = entities[idx].object3D.position
          s += `  dist:${P.distanceTo(fp).toFixed(2)}`
        }
        dbg.textContent = s
      }
      requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  })
})()
