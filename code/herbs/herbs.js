/* Herbal-soup mini-game.
   Four herbs float in front of you (head-locked to the camera). Drag each one
   with your finger down into the soup pot pinned at the bottom of the screen.
   When all 4 are in, the soup brews and transitions to the finished reveal.

   Dragging is done in screen space: a herb sits at a fixed depth D in front of
   the camera, and we map the finger's screen position to that depth so the herb
   follows your finger. Drop is detected by whether you release over the pot. */

(function () {
  const THREE = AFRAME.THREE
  const D = 3.0            // herb depth in front of the camera
  const PICK_R = 0.7       // how close (in scene units) a tap must be to grab a herb
  const IDS = ['herb0', 'herb1', 'herb2', 'herb3']

  let dragging = null, collected = 0, placed = false
  let state = 'arrival'   // arrival -> playing -> brewing -> soup -> story -> restart

  window.addEventListener('DOMContentLoaded', () => {
    const scene = document.querySelector('a-scene')
    const surface = document.getElementById('dragsurface')
    const pot = document.getElementById('pot')
    const reveal = document.getElementById('reveal')
    const story = document.getElementById('story')
    const storyPage = document.getElementById('story-page')
    const storyNext = document.getElementById('story-next')
    let pageIndex = 0
    const hint = document.getElementById('hint')
    const countEl = document.getElementById('count')
    const bowl = document.getElementById('bowl')
    const potFront = document.getElementById('pot-front')
    const bowlFront = document.getElementById('bowl-front')
    const ents = IDS.map((id) => document.getElementById(id))
    ents.forEach(e => e.setAttribute('visible', 'false'))
    document.getElementById('arrive').addEventListener('click', () => {
      document.getElementById('arrival').hidden = true
      surface.hidden = false; pot.hidden = false; potFront.hidden = false; hint.hidden = false
      ents.forEach(e => e.setAttribute('visible', 'true'))
      state = 'playing'
      window.herbCamera?.open()   // retries, and shows the camera notice if it is still unavailable
    })

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
      const r = bowl.getBoundingClientRect(), m = 50
      return x > r.left - m && x < r.right + m && y > r.top - m && y < r.bottom + m
    }

    // Bubbles + bowl bounce when an ingredient is added (simmering-soup feel)
    function splash(bounce = true) {
      const r = bowl.getBoundingClientRect()
      const cx = r.left + r.width / 2, top = r.top + r.height * 0.16
      for (let i = 0; i < 9; i++) {
        const b = document.createElement('div')
        b.className = 'bubble'
        const size = 6 + Math.random() * 13
        b.style.width = b.style.height = size + 'px'
        b.style.left = (cx + (Math.random() - 0.5) * r.width * 0.55 - size / 2) + 'px'
        b.style.top = top + 'px'
        b.style.animationDelay = (Math.random() * 0.18) + 's'
        b.style.setProperty('--drift', ((Math.random() - 0.5) * 50) + 'px')
        document.body.appendChild(b)
        setTimeout(() => b.remove(), 1300)
      }
      if (bounce) {
        for (const b of [bowl, bowlFront]) {
          b.classList.remove('plop')
          void b.offsetWidth         // restart the animation
          b.classList.add('plop')
        }
      }
    }

    // Soup reveal -> English -> Chinese -> reflection -> replay.
    function showStory(n) {
      reveal.style.opacity = '0'
      pot.style.display = 'none'; potFront.style.display = 'none'
      ents.forEach((e) => e.setAttribute('visible', 'false'))
      pageIndex = n - 1; state = 'story'
      surface.hidden = true; hint.hidden = true
      storyPage.innerHTML = window.herbalStoryPages[pageIndex]
      storyPage.lang = pageIndex === 1 ? 'zh-Hans' : 'en'
      story.hidden = false; storyPage.scrollTop = 0
      window.herbCamera?.stop()
      storyNext.textContent = pageIndex === 2 ? 'Replay' : 'Next'
      storyPage.focus()
    }
    function restart() {
      reveal.style.opacity = '0'
      story.hidden = true; surface.hidden = false; hint.hidden = false
      window.herbCamera?.open()
      pot.style.display = ''; potFront.style.display = ''
      collected = 0; countEl.textContent = '0/4'
      ents.forEach((e) => {
        delete e.dataset.done
        e.setAttribute('visible', 'true')
        e.setAttribute('scale', '0.25 0.25 0.25')
      })
      layout()
      if (hint) hint.textContent = 'Drag each ingredient into the soup pot'
      state = 'playing'
    }
    function advancePost() {
      if (state === 'soup') showStory(1)
    }
    storyNext.addEventListener('click', () => pageIndex < 2 ? showStory(pageIndex + 2) : restart())
    document.getElementById('story-back').addEventListener('click', () => {
      if (pageIndex > 0) showStory(pageIndex)
      else { story.hidden = true; surface.hidden = false; reveal.style.opacity = '1'; state = 'soup'; window.herbCamera?.open() }
    })

    // Pointer events cover touch and mouse, so the game can be previewed on desktop.
    let pointerId = null
    surface.addEventListener('pointerdown', (e) => {
      if (state !== 'playing' || !placed || pointerId !== null) return
      pointerId = e.pointerId
      surface.setPointerCapture(e.pointerId)
      dragging = pickHerb(e.clientX, e.clientY)
    })

    surface.addEventListener('pointermove', (e) => {
      if (state !== 'playing' || !dragging || e.pointerId !== pointerId) return
      const f = fingerLocal(e.clientX, e.clientY)
      dragging.object3D.position.set(f.x, f.y, -D)
    })

    surface.addEventListener('pointercancel', (e) => {
      if (e.pointerId === pointerId) { pointerId = null; dragging = null }
    })

    surface.addEventListener('pointerup', (e) => {
      if (state !== 'playing') { advancePost(); return }   // soup reveal tap
      if (e.pointerId !== pointerId) return
      pointerId = null
      if (!dragging) return
      const t = e
      if (overPot(t.clientX, t.clientY)) {
        dragging.dataset.done = '1'
        // settle the ingredient into the soup: shrink it and float it at the
        // water surface; #pot-front hides its lower part behind the front lip
        const r = bowl.getBoundingClientRect()
        const ox = [-0.16, 0.16, -0.05, 0.06][collected] * r.width || 0
        const oy = [0.18, 0.18, 0.15, 0.2][collected] * r.width * 802 / 1092 || 0
        const f = fingerLocal(r.left + r.width / 2 + ox, r.top + oy)
        dragging.object3D.position.set(f.x, f.y, -D)
        dragging.setAttribute('scale', '0.11 0.11 0.11')
        splash()                       // bubbles + bowl bounce
        collected++
        countEl.textContent = `${collected}/4`
        if (collected >= 4) {
          // brewing moment: keep bubbling for a couple seconds, then soup is ready
          state = 'brewing'
          if (hint) hint.textContent = 'Brewing…'
          let n = 0
          const brew = setInterval(() => { splash(false); if (++n >= 9) clearInterval(brew) }, 270)
          setTimeout(() => {
            reveal.style.opacity = '1'     // reveal the finished herbal soup
            state = 'soup'                 // now taps advance through the stories
            if (hint) hint.textContent = ''
          }, 2700)
        } else if (hint) {
          hint.textContent = `${4 - collected} more to go…`
        }
      }
      dragging = null
    })
  })
})()
