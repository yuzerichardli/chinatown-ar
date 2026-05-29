/* Head-locked tai chi master with tap-to-cycle poses.
   All poses share ONE transform, so every pose appears in the same place and
   size; a tap just toggles which entity is visible (no model reloading, which
   is what made the figure vanish before). */

(function () {
  // ---- Tune the master's framing here (applies to ALL poses) ----
  const POSITION = '0 -0.2 -2'    // x · up/down · distance in front of you
  const ROTATION = '0 0 0'        // set '0 180 0' if his back faces you
  const SCALE    = '1.8 1.8 1.8'  // bigger / smaller
  // ----------------------------------------------------------------

  const IDS = ['poseEntity0', 'poseEntity1', 'poseEntity2']
  let idx = 0

  window.addEventListener('DOMContentLoaded', () => {
    const entities = IDS.map((id) => document.getElementById(id))
    entities.forEach((e) => {
      e.setAttribute('position', POSITION)
      e.setAttribute('rotation', ROTATION)
      e.setAttribute('scale', SCALE)
    })

    const hint = document.getElementById('hint')
    document.getElementById('tapcatcher').addEventListener('click', () => {
      entities[idx].setAttribute('visible', 'false')
      idx = (idx + 1) % entities.length
      entities[idx].setAttribute('visible', 'true')
      if (hint) hint.textContent = `Pose ${idx + 1} / ${entities.length} — tap to change`
    })
  })
})()
