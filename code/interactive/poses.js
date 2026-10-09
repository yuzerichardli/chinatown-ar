/* Tai-chi scene.
   Opening question → 4 master poses (3D, on a camera rig) → story pages
   (English → Chinese → bilingual reflection → Replay).
     drag (one finger)  -> orbit the master around you
     pinch (two fingers)-> zoom
     tap (no drag)      -> next pose; after the 4th pose, the story opens

   The pose models are static scans (no skeleton), so the motion lives around
   them: a slow breathing rise/sink with a "Breathe in / out" prompt, a ring of
   light at his feet, and a flowing transition between poses: he turns and
   fades into a rising spiral of light, and the next pose turns out of it. */

(function () {
  // ---- Tuning ----
  const ORBIT_SENS = 0.15
  const MIN_SCALE = 1.0, MAX_SCALE = 6.0
  const BREATH_MS = 8000            // one full breath: 4 s in, 4 s out
  const OUT_MS = 650, IN_MS = 850   // transition halves
  const TURN = Math.PI / 2          // how far he turns while fading out / in
  const MODEL_H = 0.476, FOOT_Y = -0.238   // pose models' native height and foot level
  let scale = 2.5
  // ----------------

  const THREE = AFRAME.THREE
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
  const POSE_IDS = ['poseEntity0', 'poseEntity1', 'poseEntity2', 'poseEntity3']
  const POSE_COUNT = POSE_IDS.length
  let idx = 0, theta = 0, pageIndex = 0
  let state = 'arrival'   // arrival -> poses <-> flowing -> story -> (replay) poses
  // Current transition: { start, from, to, then } (to/then may be null)
  let flow = null

  const ease = (t) => 0.5 - 0.5 * Math.cos(Math.PI * Math.min(1, Math.max(0, t)))

  window.addEventListener('DOMContentLoaded', () => {
    const scene = document.querySelector('a-scene')
    const rig = document.getElementById('orbitRig')
    const entities = POSE_IDS.map((id) => document.getElementById(id))
    const hint = document.getElementById('hint')
    const breath = document.getElementById('breath')
    const surface = document.getElementById('tapcatcher')
    const story = document.getElementById('story')
    const storyPage = document.getElementById('story-page')
    const storyNext = document.getElementById('story-next')

    const applyScale = () =>
      entities.forEach((e) => e.setAttribute('scale', `${scale} ${scale} ${scale}`))
    const applyOrbit = () => rig.setAttribute('rotation', `0 ${theta} 0`)

    // ---- fading: materials become transparent only while fading ----
    function setOpacity(entity, a) {
      const mesh = entity.getObject3D('mesh')
      if (!mesh) return
      mesh.traverse((o) => {
        if (!o.material) return
        for (const m of [].concat(o.material)) {
          m.transparent = a < 1; m.opacity = a; m.depthWrite = true
        }
      })
    }

    // ---- light ring + spiral (one Points cloud, positioned in model units) ----
    const fx = (() => {
      const N = reducedMotion ? 40 : 110
      const seeds = Array.from({ length: N }, (_, i) => ({
        a: (i / N) * Math.PI * 2 + Math.random() * 0.3,
        r: 0.2 + Math.random() * 0.09,
        h: Math.random(),
        speed: 0.25 + Math.random() * 0.35,
      }))
      const pos = new Float32Array(N * 3)
      const geo = new THREE.BufferGeometry()
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
      const c = document.createElement('canvas'); c.width = c.height = 64
      const g = c.getContext('2d'), grad = g.createRadialGradient(32, 32, 0, 32, 32, 32)
      grad.addColorStop(0, 'rgba(255,250,225,1)'); grad.addColorStop(0.35, 'rgba(255,214,120,0.8)')
      grad.addColorStop(1, 'rgba(255,190,80,0)')
      g.fillStyle = grad; g.fillRect(0, 0, 64, 64)
      const mat = new THREE.PointsMaterial({
        map: new THREE.CanvasTexture(c), size: 0.03, transparent: true, opacity: 0.55,
        depthWrite: false, blending: THREE.AdditiveBlending,
      })
      const points = new THREE.Points(geo, mat)
      points.frustumCulled = false
      const group = new THREE.Group()
      group.add(points); group.position.set(0, 0, -2.5); group.visible = false
      let spin = 0
      return {
        group,
        // p: 0 = resting ring at his feet, 1 = full spiral up his body
        update(dt, p) {
          spin += dt * (0.35 + p * 2.2)
          seeds.forEach((s, i) => {
            const a = s.a + spin * s.speed * (reducedMotion ? 0.3 : 1)
            const lift = reducedMotion ? 0 : p * s.h * MODEL_H * 1.05
            const r = s.r * (1 - 0.35 * p * s.h)
            pos[i * 3] = Math.cos(a) * r
            pos[i * 3 + 1] = FOOT_Y + 0.005 + lift + Math.sin(a * 3 + spin) * 0.004
            pos[i * 3 + 2] = Math.sin(a) * r * 0.9
          })
          geo.attributes.position.needsUpdate = true
          mat.opacity = 0.45 + 0.5 * p
          mat.size = (0.022 + 0.014 * p) * scale
          group.scale.setScalar(scale)
        },
      }
    })()
    if (rig.object3D) rig.object3D.add(fx.group)

    // ---- per-frame motion ----
    let last = performance.now()
    function frame(now) {
      const dt = Math.min(0.05, (now - last) / 1000); last = now
      let p = 0                                   // spiral strength
      const b = Math.sin((now % BREATH_MS) / BREATH_MS * Math.PI * 2 - Math.PI / 2) // -1..1
      const breathe = reducedMotion ? 0.3 : 1

      entities.forEach((e, k) => {
        const o = e.object3D
        if (!o.visible) return
        let turn = 0, sink = 0, alpha = 1
        if (flow) {
          const t = now - flow.start
          if (k === flow.from && t < OUT_MS) {
            const u = ease(t / OUT_MS)
            turn = u * TURN; sink = u * 0.04; alpha = 1 - u
          } else if (k === flow.to) {
            const u = ease((t - OUT_MS) / IN_MS)
            turn = (u - 1) * TURN; sink = (1 - u) * 0.04; alpha = u
          }
        }
        if (reducedMotion) turn *= 0.2
        o.rotation.y = turn
        o.position.y = (b * 0.006 * breathe - sink) * scale
        o.scale.set(scale, scale * (1 + b * 0.008 * breathe), scale)
        setOpacity(e, alpha)
      })

      if (flow) {
        const t = now - flow.start
        p = t < OUT_MS ? ease(t / OUT_MS) : 1 - ease((t - OUT_MS) / IN_MS)
        if (t >= OUT_MS && !flow.swapped) {        // halfway: swap the visible pose
          flow.swapped = true
          entities[flow.from].setAttribute('visible', 'false')
          setOpacity(entities[flow.from], 1)
          if (flow.to !== null) { setOpacity(entities[flow.to], 0); entities[flow.to].setAttribute('visible', 'true') }
          if (flow.then) { const then = flow.then; flow = null; then(); requestAnimationFrame(frame); return }
        }
        if (t >= OUT_MS + IN_MS) { flow = null; state = 'poses' }
      }
      fx.update(dt, p)

      if (state === 'poses' || state === 'flowing') {
        breath.textContent = b < 0 ? 'Breathe in…' : 'Breathe out…'
        breath.style.opacity = String(0.35 + 0.65 * Math.abs(Math.sin((now % (BREATH_MS / 2)) / (BREATH_MS / 2) * Math.PI)))
      }
      requestAnimationFrame(frame)
    }

    function setHint() {
      hint.textContent = `Pose ${idx + 1}/${POSE_COUNT} · drag to move · pinch to zoom · tap for next`
    }
    function showPose(i) {
      idx = i; state = 'poses'; flow = null
      story.hidden = true; surface.hidden = false; hint.hidden = false; breath.hidden = false
      entities.forEach((e, k) => { e.setAttribute('visible', String(k === idx)); setOpacity(e, 1) })
      fx.group.visible = true
      setHint()
    }
    function showStory(n) {
      pageIndex = n; state = 'story'; flow = null
      entities.forEach((e) => e.setAttribute('visible', 'false'))
      fx.group.visible = false
      surface.hidden = true; hint.hidden = true; breath.hidden = true
      storyPage.innerHTML = window.taichiStoryPages[n]
      storyPage.lang = n === 1 ? 'zh-Hans' : 'en'
      story.hidden = false; storyPage.scrollTop = 0
      storyNext.textContent = n === 2 ? 'Replay' : 'Next'
      window.arCamera?.stop()
      storyPage.focus()
    }
    function next() {
      if (state !== 'poses') return
      state = 'flowing'
      if (idx < POSE_COUNT - 1) {
        flow = { start: performance.now(), from: idx, to: idx + 1, then: null }
        idx++; setHint()
      } else {
        // last pose dissolves into the light, then the story opens
        flow = { start: performance.now(), from: idx, to: null, then: () => setTimeout(() => showStory(0), 250) }
      }
    }

    entities.forEach((e) => e.setAttribute('visible', 'false'))
    document.getElementById('arrive').addEventListener('click', () => {
      document.getElementById('arrival').hidden = true
      showPose(0)
      window.arCamera?.open()   // retries, and shows the camera notice if it is still unavailable
    })
    storyNext.addEventListener('click', () => {
      if (pageIndex < 2) return showStory(pageIndex + 1)
      theta = 0; scale = 2.5; applyScale(); applyOrbit()
      showPose(0); window.arCamera?.open()
    })
    document.getElementById('story-back').addEventListener('click', () => {
      if (pageIndex > 0) return showStory(pageIndex - 1)
      showPose(POSE_COUNT - 1); window.arCamera?.open()
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
      if (state !== 'poses' && state !== 'flowing') return
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
      if (e.type === 'pointerup' && pointers.size === 0 && !dragged) next()   // taps mid-transition are ignored
    }
    surface.addEventListener('pointerup', release)
    surface.addEventListener('pointercancel', release)

    applyScale(); applyOrbit()
    const begin = () => { if (!fx.group.parent) rig.object3D.add(fx.group); requestAnimationFrame(frame) }
    scene.hasLoaded ? begin() : scene.addEventListener('loaded', begin)
  })
})()
