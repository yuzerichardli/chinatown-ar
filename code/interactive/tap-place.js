/* globals AFRAME */

// tap-place: when the user taps the detected ground, drop the tai chi master
// there, then make it fully interactive:
//   • one-finger drag to move        (xrextras-hold-drag)
//   • pinch to resize                (xrextras-pinch-scale)
//   • two-finger twist to rotate     (xrextras-two-finger-rotate)
// These gesture components live in xrextras and need the scene-level
// `xrextras-gesture-detector` (set in index.html) to feed them touch events.
AFRAME.registerComponent('tap-place', {
  init() {
    const ground = document.getElementById('ground')
    const hint = document.getElementById('hint')

    ground.addEventListener('click', (event) => {
      if (!event.detail.intersection) return
      const point = event.detail.intersection.point   // where on the ground they tapped

      const master = document.createElement('a-entity')
      master.setAttribute('gltf-model', '#taichiModel')
      master.setAttribute('class', 'cantap')          // lets gestures grab it later
      master.setAttribute('position', point)
      master.setAttribute('rotation', '0 0 0')        // tune facing, or just twist it
      master.setAttribute('shadow', 'receive: false')

      // Start tiny and pop in once the model has loaded.
      master.setAttribute('visible', 'false')
      master.setAttribute('scale', '0.001 0.001 0.001')

      // Interaction:
      master.setAttribute('xrextras-hold-drag', '')
      master.setAttribute('xrextras-pinch-scale', '')
      master.setAttribute('xrextras-two-finger-rotate', '')

      this.el.sceneEl.appendChild(master)

      master.addEventListener('model-loaded', () => {
        master.setAttribute('visible', 'true')
        // Final size — tune this number, or just pinch-to-resize in AR.
        master.setAttribute('animation', {
          property: 'scale',
          to: '4 4 4',
          easing: 'easeOutElastic',
          dur: 800,
        })
      })

      if (hint) {
        hint.textContent =
          'Drag to move · pinch to resize · twist to rotate · tap ground to add another'
      }
    })
  },
})
