/* Films-at-the-Gate.
   Two opening questions (at Chinatown Gate park? → stand by the PlayCubes facing
   the red brick wall) → 8 photos play on the screen.glb screen face,
   cover-cropped to fill it edge-to-edge, with the 2007 video clip in place of
   the 2007 photo (video.js) → story pages (English → Chinese →
   bilingual reflection → Replay).
   Gestures (photo scenes): drag = orbit, pinch = zoom, tap = next photo. */

(function () {
  // ---- Tuning ----
  // photo indexes in order; the 2007 video clip takes the 2007 photo's place (pic02 is not used)
  const SLIDES = [0, 'video', 2, 3, 4, 5, 6, 7]
  const COUNT = SLIDES.length
  const PLANE_W = 1.49, PLANE_H = 1.05   // matches picplane geometry in index.html
  const ORBIT_SENS = 0.15
  const MIN_SCALE = 0.25, MAX_SCALE = 3.0
  // ----------------

  let idx = 0, theta = 0, scale = 1.25, pageIndex = 0
  let state = 'arrival'   // arrival -> place -> photos -> story -> (replay) photos

  window.addEventListener('DOMContentLoaded', () => {
    const rig = document.getElementById('orbitRig')
    const group = document.getElementById('screenGroup')
    const pic = document.getElementById('picplane')
    const hint = document.getElementById('hint')
    const surface = document.getElementById('tapcatcher')
    const story = document.getElementById('story')
    const storyPage = document.getElementById('story-page')
    const storyNext = document.getElementById('story-next')

    const applyScale = () => group.setAttribute('scale', `${scale} ${scale} ${scale}`)
    const applyOrbit = () => rig.setAttribute('rotation', `0 ${theta} 0`)

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

    function showPhoto(i) {
      idx = i; state = 'photos'
      story.hidden = true; surface.hidden = false; hint.hidden = false
      group.setAttribute('visible', 'true')
      if (SLIDES[idx] === 'video') {
        window.screenVideo.show(pic)
        hint.textContent = `Scene ${idx + 1}/${COUNT} · Films at the Gate 2007 · tap for next`
        return
      }
      window.screenVideo.hide()
      pic.setAttribute('material', 'src', '#img' + SLIDES[idx])
      applyCover()
      hint.textContent = `Scene ${idx + 1}/${COUNT} · drag · pinch · tap for next`
    }
    function showStory(n) {
      pageIndex = n; state = 'story'
      window.screenVideo.hide()
      group.setAttribute('visible', 'false')
      surface.hidden = true; hint.hidden = true
      storyPage.innerHTML = window.movieStoryPages[n]
      storyPage.lang = n === 1 ? 'zh-Hans' : 'en'
      story.hidden = false; storyPage.scrollTop = 0
      storyNext.textContent = n === 2 ? 'Replay' : 'Next'
      window.arCamera?.stop()
      storyPage.focus()
    }
    const next = () => idx < COUNT - 1 ? showPhoto(idx + 1) : showStory(0)

    group.setAttribute('visible', 'false')
    document.getElementById('arrive').addEventListener('click', () => {
      document.getElementById('arrival').hidden = true
      document.getElementById('place').hidden = false
      state = 'place'
      document.getElementById('place-yes').focus()
    })
    document.getElementById('place-yes').addEventListener('click', () => {
      document.getElementById('place').hidden = true
      showPhoto(0)
      window.arCamera?.open()   // retries, and shows the camera notice if it is still unavailable
    })
    storyNext.addEventListener('click', () => {
      if (pageIndex < 2) return showStory(pageIndex + 1)
      theta = 0; scale = 1.25; applyScale(); applyOrbit()
      showPhoto(0); window.arCamera?.open()
    })
    document.getElementById('story-back').addEventListener('click', () => {
      if (pageIndex > 0) return showStory(pageIndex - 1)
      showPhoto(COUNT - 1); window.arCamera?.open()
    })

    // ---- gestures (pointer events: touch + mouse) ----
    const pointers = new Map()
    let startX = 0, startTheta = 0, dragged = false
    let startPinch = 0, startScale = 0
    const pinchDist = () => {
      const [a, b] = [...pointers.values()]
      return Math.hypot(a.x - b.x, a.y - b.y)
    }

    surface.addEventListener('pointerdown', (e) => {
      if (state !== 'photos') return
      surface.setPointerCapture(e.pointerId)
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
      if (pointers.size === 2) { startPinch = pinchDist(); startScale = scale; dragged = true }
      else if (pointers.size === 1) { startX = e.clientX; startTheta = theta; dragged = false }
    })

    surface.addEventListener('pointermove', (e) => {
      if (!pointers.has(e.pointerId)) return
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
      if (pointers.size >= 2) {
        scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, startScale * pinchDist() / startPinch))
        applyScale()
      } else {
        const dx = e.clientX - startX
        if (Math.abs(dx) > 8) dragged = true
        theta = startTheta - dx * ORBIT_SENS
        applyOrbit()
      }
    })

    function release(e) {
      if (!pointers.delete(e.pointerId)) return
      if (pointers.size === 1) {   // pinch ended: keep orbiting from the remaining finger
        startX = [...pointers.values()][0].x; startTheta = theta
      }
      if (e.type === 'pointerup' && pointers.size === 0 && !dragged && state === 'photos') next()
    }
    surface.addEventListener('pointerup', release)
    surface.addEventListener('pointercancel', release)

    applyScale(); applyOrbit()
  })
})()
