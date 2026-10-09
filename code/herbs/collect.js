/* Step before the soup: collect the right ingredients from herbal-store drawers.
   Six open, unlabelled drawers (shuffled each time) hold ginseng, goji berries,
   red dates, Chinese yam, and two decoys (star anise, chrysanthemum). The four
   soup ingredients are pictures of the same 3D models used in the pot game
   (assets/ingredients/*.png); the decoys have no models, so they are drawn. Tap a drawer, or
   drag its pile up, to gather it into the bamboo tray at the top. Decoys shake
   and explain they are not in this soup. When all four are in the tray, the
   "Cook the soup" button hands over to the pot game in herbs.js. */

(function () {
  const ITEMS = [
    { id: 'ginseng', en: 'Ginseng', zh: '人参', ok: true },
    { id: 'goji', en: 'Goji berries', zh: '枸杞', ok: true },
    { id: 'dates', en: 'Red dates', zh: '红枣', ok: true },
    { id: 'yam', en: 'Chinese yam', zh: '山药', ok: true },
    { id: 'anise', en: 'Star anise', zh: '八角', ok: false },
    { id: 'mum', en: 'Chrysanthemum', zh: '菊花', ok: false },
  ]
  const NEEDED = ITEMS.filter((i) => i.ok).length

  // ---- drawn decoy piles (viewBox 0 0 120 80), seeded so piles look the same each time ----
  function rng(seed) { return () => (seed = (seed * 16807) % 2147483647) / 2147483647 }
  function scatter(n, seed, draw) {
    const r = rng(seed); let out = ''
    for (let i = 0; i < n; i++) {
      // denser towards the middle and bottom of the pile
      const a = r() * Math.PI * 2, d = Math.sqrt(r())
      const x = 60 + Math.cos(a) * d * 46, y = 50 + Math.sin(a) * d * 22 - (1 - d) * 8
      out += draw(x, y, r)
    }
    return out
  }
  const ART = {
    ginseng: () => [[0, 0, 0], [10, 22, 12]].map(([dx, dy, rot]) => `
      <g transform="translate(${dx} ${dy}) rotate(${rot} 60 36)" stroke-linecap="round">
        <path d="M14 30 C28 18 52 22 66 30 C74 35 72 44 64 45 C50 46 30 42 16 40 Z" fill="#d6a45f" stroke="#8a5e2c" stroke-width="2"/>
        <path d="M30 27 q2 8 0 14 M42 26 q2 9 0 17 M54 28 q2 8 0 15" stroke="#9c6d36" stroke-width="1.6" fill="none"/>
        <path d="M66 34 C80 30 92 24 106 20 M64 42 C78 46 90 52 104 58 M58 44 C64 54 70 60 76 70" stroke="#c48f4c" stroke-width="5" fill="none"/>
        <path d="M106 20 l8 -4 M104 58 l9 5 M76 70 l2 8 M90 26 l4 -9 M88 50 l6 10 M14 30 l-8 -8 M20 24 l-4 -10" stroke="#8a5e2c" stroke-width="1.6" fill="none"/>
      </g>`).join(''),
    goji: () => scatter(70, 7, (x, y, r) =>
      `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="5.5" ry="3" transform="rotate(${(r() * 180).toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})" fill="${r() < .5 ? '#e0452c' : '#c9321f'}"/>`),
    dates: () => scatter(22, 11, (x, y, r) => {
      const rot = (r() * 180).toFixed(0)
      return `<g transform="rotate(${rot} ${x.toFixed(1)} ${y.toFixed(1)})"><ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="11" ry="7.5" fill="${r() < .5 ? '#8e1d1d' : '#a3262a'}"/><path d="M${(x - 7).toFixed(1)} ${(y - 2).toFixed(1)} q7 3 14 0 M${(x - 6).toFixed(1)} ${(y + 2.5).toFixed(1)} q6 2 12 0" stroke="#5f1212" stroke-width="1.3" fill="none"/></g>`
    }),
    yam: () => scatter(11, 23, (x, y, r) =>
      `<g transform="rotate(${(r() * 50 - 25).toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})"><rect x="${(x - 22).toFixed(1)}" y="${(y - 5).toFixed(1)}" width="44" height="10" rx="5" fill="#f5efe0" stroke="#d3c7ad" stroke-width="1.5"/><path d="M${(x - 14).toFixed(1)} ${(y - 1).toFixed(1)} h12 M${(x + 2).toFixed(1)} ${(y + 2).toFixed(1)} h10" stroke="#e0d5bd" stroke-width="1.5"/></g>`),
    anise: () => scatter(16, 31, (x, y, r) => {
      let pts = ''
      for (let k = 0; k < 16; k++) {
        const a = k / 16 * Math.PI * 2 + r() * 0.05, rad = k % 2 ? 4 : 11
        pts += `${(x + Math.cos(a) * rad).toFixed(1)},${(y + Math.sin(a) * rad * .7).toFixed(1)} `
      }
      return `<polygon points="${pts}" fill="#7a4a24" stroke="#5a3418" stroke-width="1"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2" fill="#4a2a12"/>`
    }),
    mum: () => scatter(24, 43, (x, y, r) => {
      let petals = ''
      for (let k = 0; k < 10; k++) {
        const a = k / 10 * Math.PI * 2
        petals += `<ellipse cx="${(x + Math.cos(a) * 5).toFixed(1)}" cy="${(y + Math.sin(a) * 3.5).toFixed(1)}" rx="4" ry="2" transform="rotate(${(a * 180 / Math.PI).toFixed(0)} ${(x + Math.cos(a) * 5).toFixed(1)} ${(y + Math.sin(a) * 3.5).toFixed(1)})" fill="#f0d36a"/>`
      }
      return `${petals}<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.5" fill="#d9a72c"/>`
    }),
  }
  const MODEL_PICS = { ginseng: 1, goji: 1, dates: 1, yam: 1 }
  // Drawn piles are trimmed to their own outline (see fitDrawn) so every
  // ingredient, picture or drawing, is centred and scaled the same way.
  const FIT = {}
  const pileSvg = (id) => MODEL_PICS[id]
    ? `<img src="assets/ingredients/${id}.png?v=2" alt="" draggable="false">`
    : `<svg viewBox="${FIT[id] || '0 0 120 80'}" aria-hidden="true"><g>${ART[id]()}</g></svg>`
  function fitDrawn() {
    cabinet.querySelectorAll('.drawer').forEach((d) => {
      const svg = d.querySelector('svg')
      if (!svg) return
      const b = svg.firstElementChild.getBBox(), m = 3
      FIT[d.dataset.id] = `${(b.x - m).toFixed(1)} ${(b.y - m).toFixed(1)} ${(b.width + 2 * m).toFixed(1)} ${(b.height + 2 * m).toFixed(1)}`
      svg.setAttribute('viewBox', FIT[d.dataset.id])
    })
  }

  let root, tray, cabinet, msg, done, count, gathered = 0, onDone = null

  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] }
    return a
  }

  function build() {
    gathered = 0
    tray.querySelectorAll('.gathered').forEach((g) => g.remove())
    count.textContent = `0/${NEEDED}`
    done.hidden = true
    msg.textContent = 'Find the four soup ingredients: ginseng, goji berries, red dates and Chinese yam.'
    cabinet.innerHTML = ''
    shuffle(ITEMS.slice()).forEach((item) => {
      const b = document.createElement('button')
      b.className = 'drawer'; b.dataset.id = item.id
      b.setAttribute('aria-label', `${item.en} ${item.zh}`)
      b.innerHTML = `<span class="box"><span class="pile">${pileSvg(item.id)}</span></span>
        <span class="front"><span class="handle"></span></span>`
      cabinet.appendChild(b)
    })
  }

  function overTray(x, y) {
    const r = tray.getBoundingClientRect(), m = 30
    return x > r.left - m && x < r.right + m && y > r.top - m && y < r.bottom + m
  }

  function reject(drawer, item) {
    drawer.classList.remove('shake'); void drawer.offsetWidth; drawer.classList.add('shake')
    msg.textContent = `${item.en} (${item.zh}) isn’t in this soup. Try another drawer.`
  }

  // Fly a copy of the pile from where it is now into the tray, where it stays gathered.
  function gather(drawer, item, from) {
    drawer.disabled = true; drawer.classList.add('taken')
    const pile = drawer.querySelector('.pile')
    const src = from || pile.getBoundingClientRect()
    const slot = tray.querySelector('.bowl').getBoundingClientRect()
    const k = gathered++
    // four piles meet in the middle of the tray, slightly overlapping
    const spots = [[-0.2, -0.12], [0.2, -0.1], [-0.16, 0.16], [0.18, 0.17]]
    const w = slot.width * 0.5, h = w * 80 / 120
    const tx = slot.left + slot.width / 2 + spots[k][0] * slot.width - w / 2
    const ty = slot.top + slot.height / 2 + spots[k][1] * slot.height - h / 2
    const fly = document.createElement('div')
    fly.className = 'flying'; fly.innerHTML = pileSvg(item.id)
    Object.assign(fly.style, { left: src.left + 'px', top: src.top + 'px', width: src.width + 'px', height: src.height + 'px' })
    document.body.appendChild(fly)
    requestAnimationFrame(() => {
      Object.assign(fly.style, { left: tx + 'px', top: ty + 'px', width: w + 'px', height: h + 'px' })
    })
    pile.style.visibility = 'hidden'
    msg.textContent = `${item.en} (${item.zh}) — in the tray!`
    setTimeout(() => {
      fly.remove()
      const g = document.createElement('div')
      g.className = 'gathered'; g.innerHTML = pileSvg(item.id)
      const tr = tray.getBoundingClientRect()
      Object.assign(g.style, { left: (tx - tr.left) + 'px', top: (ty - tr.top) + 'px', width: w + 'px', height: h + 'px' })
      tray.appendChild(g)
      count.textContent = `${gathered}/${NEEDED}`
      tray.classList.remove('pop'); void tray.offsetWidth; tray.classList.add('pop')
      if (gathered >= NEEDED) {
        msg.textContent = 'You found all four! Time to cook the soup.'
        done.hidden = false; done.focus()
      }
    }, 650)
  }

  window.addEventListener('DOMContentLoaded', () => {
    root = document.getElementById('collect')
    tray = document.getElementById('tray')
    cabinet = document.getElementById('cabinet')
    msg = document.getElementById('collect-msg')
    done = document.getElementById('collect-done')
    count = document.getElementById('tray-count')

    // tap, or drag a pile up to the tray
    let drag = null
    cabinet.addEventListener('pointerdown', (e) => {
      const drawer = e.target.closest('.drawer')
      if (!drawer || drawer.disabled) return
      const pile = drawer.querySelector('.pile'), r = pile.getBoundingClientRect()
      drag = { drawer, pile, id: e.pointerId, x0: e.clientX, y0: e.clientY, r, moved: false }
      cabinet.setPointerCapture(e.pointerId)
    })
    cabinet.addEventListener('pointermove', (e) => {
      if (!drag || e.pointerId !== drag.id) return
      const dx = e.clientX - drag.x0, dy = e.clientY - drag.y0
      if (!drag.moved && Math.hypot(dx, dy) > 8) { drag.moved = true; drag.pile.classList.add('lifted') }
      if (drag.moved) drag.pile.style.transform = `translate(${dx}px, ${dy}px) scale(1.1)`
    })
    const end = (e) => {
      if (!drag || e.pointerId !== drag.id) return
      const { drawer, pile, moved } = drag
      const item = ITEMS.find((i) => i.id === drawer.dataset.id)
      const from = pile.getBoundingClientRect()
      pile.classList.remove('lifted'); pile.style.transform = ''
      drag = null
      if (e.type === 'pointercancel') return
      if (moved && !overTray(e.clientX, e.clientY)) return   // dropped elsewhere: back in the drawer
      item.ok ? gather(drawer, item, moved ? from : null) : reject(drawer, item)
    }
    cabinet.addEventListener('pointerup', end)
    cabinet.addEventListener('pointercancel', end)
    // keyboard: Enter/Space on a drawer button
    cabinet.addEventListener('click', (e) => {
      if (e.detail !== 0) return            // pointer clicks are handled above
      const drawer = e.target.closest('.drawer')
      if (!drawer || drawer.disabled) return
      const item = ITEMS.find((i) => i.id === drawer.dataset.id)
      item.ok ? gather(drawer, item) : reject(drawer, item)
    })
    done.addEventListener('click', () => { root.hidden = true; onDone && onDone() })
  })

  window.herbCollect = {
    start(next) { onDone = next; build(); root.hidden = false; fitDrawn() },
  }
})()
