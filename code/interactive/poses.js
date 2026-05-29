/* Tap anywhere to cycle the tai chi master through the poses, in place.
   Swapping only the gltf-model keeps the same position, size and rotation —
   so each pose appears at the exact same spot and scale. */

(function () {
  const POSES = ['#pose0', '#pose1', '#pose2']   // matches the <a-asset-item> ids
  let idx = 0

  window.addEventListener('DOMContentLoaded', () => {
    const master = document.getElementById('master')
    const tap = document.getElementById('tapcatcher')
    const hint = document.getElementById('hint')

    tap.addEventListener('click', () => {
      idx = (idx + 1) % POSES.length
      master.setAttribute('gltf-model', POSES[idx])   // same entity → same place & size
      if (hint) hint.textContent = `Pose ${idx + 1} / ${POSES.length} — tap to change`
    })
  })
})()
