/* Herbal-soup mini-game.
   Four herbs float in front of you (head-locked to the camera). Drag each one
   with your finger down into the soup pot pinned at the bottom of the screen.
   When all 4 are in, the screen flashes white (placeholder for the real reveal).

   Dragging is done in screen space: a herb sits at a fixed depth D in front of
   the camera, and we map the finger's screen position to that depth so the herb
   follows your finger. Drop is detected by whether you release over the pot. */

(function () {
  const THREE = AFRAME.THREE
  const D = 3.0            // herb depth in front of the camera
  const PICK_R = 0.7       // how close (in scene units) a tap must be to grab a herb
  const IDS = ['herb0', 'herb1', 'herb2', 'herb3']

  let dragging = null, collected = 0, placed = false

  window.addEventListener('DOMContentLoaded', () => {
    const scene = document.querySelector('a-scene')
    const surface = document.getElementById('dragsurface')
    const pot = document.getElementById('pot')
    const flash = document.getElementById('flash')
    const hint = document.getElementById('hint')
    const countEl = document.getElementById('count')
    const ents = IDS.map((id) => document.getElementById(id))

    // Half-extents of the view at depth D (depends on the live camera fov/aspect)
    function view() {
      const cam = scene.camera
      const halfH = Math.tan(THREE.MathUtils.degToRad(cam.fov) / 2) * D
      return { halfW: halfH * cam.aspect, halfH }
    }
    // Map a finger screen point to a camera-local position at depth D
    function fingerLocal(x, y) {
      const { halfW, halfH } = view()
      return {
        x: ((x / window.innerWidth) * 2 - 1) * halfW,
        y: (-((y / window.innerHeight) * 2 - 1)) * halfH,
      }
    }
    // Initial spread (upper area, above the pot)
    function layout() {
      const { halfW, halfH } = view()
      const spots = [
        [-0.42 * halfW,  0.55 * halfH],
        [ 0.42 * halfW,  0.55 * halfH],
        [-0.42 * halfW,  0.12 * halfH],
        [ 0.42 * halfW,  0.12 * halfH],
      ]
      ents.forEach((e, i) => e.object3D.position.set(spots[i][0], spots[i][1], -D))
    }

    // Place herbs once the camera (fov) is ready
    ;(function waitCam() {
      if (scene.camera) { layout(); placed = true }
      else requestAnimationFrame(waitCam)
    })()

    function pickHerb(x, y) {
      const f = fingerLocal(x, y)
      let best = null, bestD = PICK_R
      ents.forEach((e) => {
        if (e.dataset.done) return
        const p = e.object3D.position
        const d = Math.hypot(p.x - f.x, p.y - f.y)
        if (d < bestD) { bestD = d; best = e }
      })
      return best
    }

    function overPot(x, y) {
      const r = pot.getBoundingClientRect(), m = 50
      return x > r.left - m && x < r.right + m && y > r.top - m && y < r.bottom + m
    }

    surface.addEventListener('touchstart', (e) => {
      if (e.touches.length !== 1) return
      dragging = pickHerb(e.touches[0].clientX, e.touches[0].clientY)
    }, { passive: false })

    surface.addEventListener('touchmove', (e) => {
      if (!dragging) return
      const f = fingerLocal(e.touches[0].clientX, e.touches[0].clientY)
      dragging.object3D.position.set(f.x, f.y, -D)
      e.preventDefault()
    }, { passive: false })

    surface.addEventListener('touchend', (e) => {
      if (!dragging) return
      const t = e.changedTouches[0]
      if (overPot(t.clientX, t.clientY)) {
        dragging.dataset.done = '1'
        dragging.setAttribute('visible', 'false')
        collected++
        countEl.textContent = `${collected}/4`
        if (collected >= 4) {
          flash.style.opacity = '1'
          if (hint) hint.textContent = ''
        } else if (hint) {
          hint.textContent = `${4 - collected} more to go…`
        }
      }
      dragging = null
    })
  })
})()
