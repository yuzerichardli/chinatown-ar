/* Films at the Gate 2007 clip on the 3D movie screen.
   YouTube video cannot be used as a WebGL texture, so the official embedded
   player (youtube-nocookie) is laid over the screen in the page instead: every
   frame the picplane's four corners are projected to the screen and the player
   is warped onto them with a CSS matrix3d, so it follows drag and pinch.
   Plays muted (phones block sound until a tap); "Sound on" unmutes it. */

(function () {
  const VIDEO_ID = '9B5ORsQVgp8'          // "Films at the Gate 2007, Boston MA" (davnyc)
  // parts of the video to play, in seconds, looping: 0:00–0:35 then 2:29–2:37
  const SEGMENTS = [[0, 35], [149, 157]]
  const PLANE_W = 1.49, PLANE_H = 1.05    // matches picplane geometry in index.html
  const BASE_W = 640, BASE_H = Math.round(BASE_W * PLANE_H / PLANE_W)

  let player = null, ready = false, active = false, frame = null, plane = null, muted = true, seg = 0
  let wrap, sound

  // ---- 2D homography: maps the player's rectangle onto the projected screen quad ----
  const adj = (m) => [m[4] * m[8] - m[5] * m[7], m[2] * m[7] - m[1] * m[8], m[1] * m[5] - m[2] * m[4],
    m[5] * m[6] - m[3] * m[8], m[0] * m[8] - m[2] * m[6], m[2] * m[3] - m[0] * m[5],
    m[3] * m[7] - m[4] * m[6], m[1] * m[6] - m[0] * m[7], m[0] * m[4] - m[1] * m[3]]
  const mul = (a, b) => {
    const c = []
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
      c[3 * i + j] = a[3 * i] * b[j] + a[3 * i + 1] * b[3 + j] + a[3 * i + 2] * b[6 + j]
    }
    return c
  }
  const mulv = (m, v) => [m[0] * v[0] + m[1] * v[1] + m[2] * v[2], m[3] * v[0] + m[4] * v[1] + m[5] * v[2], m[6] * v[0] + m[7] * v[1] + m[8] * v[2]]
  function basis(p) {   // p: 4 points [tl, tr, bl, br]
    const m = [p[0][0], p[1][0], p[2][0], p[0][1], p[1][1], p[2][1], 1, 1, 1]
    const v = mulv(adj(m), [p[3][0], p[3][1], 1])
    return mul(m, [v[0], 0, 0, 0, v[1], 0, 0, 0, v[2]])
  }
  function warp(dst) {
    const src = [[0, 0], [BASE_W, 0], [0, BASE_H], [BASE_W, BASE_H]]
    const t = mul(basis(dst), adj(basis(src))).map((x, _, a) => x / a[8])
    return `matrix3d(${t[0]},${t[3]},0,${t[6]},${t[1]},${t[4]},0,${t[7]},0,0,1,0,${t[2]},${t[5]},0,${t[8]})`
  }

  function place() {
    frame = null
    if (!active) return
    const cam = document.querySelector('a-scene').camera
    const THREE = AFRAME.THREE, o = plane.object3D
    o.updateMatrixWorld(true)
    const pts = [[-1, 1], [1, 1], [-1, -1], [1, -1]].map(([sx, sy]) => {
      const v = o.localToWorld(new THREE.Vector3(sx * PLANE_W / 2, sy * PLANE_H / 2, 0.002))
      if (v.clone().applyMatrix4(cam.matrixWorldInverse).z > -0.05) return null   // behind you
      v.project(cam)
      return [(v.x + 1) / 2 * innerWidth, (1 - v.y) / 2 * innerHeight]
    })
    const [tl, tr, bl] = pts
    const facing = pts.every(Boolean) &&
      (tr[0] - tl[0]) * (bl[1] - tl[1]) - (tr[1] - tl[1]) * (bl[0] - tl[0]) > 0
    wrap.style.visibility = facing ? 'visible' : 'hidden'
    if (facing) wrap.style.transform = warp(pts)
    // jump to the next part once the current one is over
    if (ready && player.getCurrentTime() >= SEGMENTS[seg][1]) playSegment((seg + 1) % SEGMENTS.length)
    frame = requestAnimationFrame(place)
  }

  function playSegment(n) {
    seg = n
    player.seekTo(SEGMENTS[n][0], true); player.playVideo()
  }

  function loadPlayer() {
    if (window.YT || document.getElementById('yt-api')) return
    window.onYouTubeIframeAPIReady = () => {
      player = new YT.Player('yt-player', {
        host: 'https://www.youtube-nocookie.com',
        videoId: VIDEO_ID, width: BASE_W, height: BASE_H,
        playerVars: { autoplay: 1, mute: 1, playsinline: 1, controls: 0, disablekb: 1, fs: 0,
          rel: 0, iv_load_policy: 3, modestbranding: 1, start: SEGMENTS[0][0] },
        events: {
          onReady: (e) => { ready = true; e.target.mute(); active ? playSegment(0) : e.target.pauseVideo() },
          onStateChange: (e) => {   // the video ran out: start over
            if (e.data === YT.PlayerState.ENDED && active) playSegment(0)
          },
        },
      })
    }
    const s = document.createElement('script')
    s.id = 'yt-api'; s.src = 'https://www.youtube.com/iframe_api'
    document.head.appendChild(s)
  }

  window.addEventListener('DOMContentLoaded', () => {
    wrap = document.getElementById('yt-wrap')
    sound = document.getElementById('yt-sound')
    wrap.style.width = BASE_W + 'px'; wrap.style.height = BASE_H + 'px'
    sound.addEventListener('click', () => {
      if (!ready) return
      muted = !muted
      if (muted) player.mute(); else { player.unMute(); player.setVolume(100); player.playVideo() }
      sound.textContent = muted ? 'Sound on' : 'Sound off'
    })
  })

  window.screenVideo = {
    show(planeEl) {
      plane = planeEl; active = true
      wrap.hidden = false; sound.hidden = false
      loadPlayer()
      if (ready) playSegment(0)
      if (!frame) frame = requestAnimationFrame(place)
    },
    hide() {
      active = false
      if (wrap) { wrap.hidden = true; sound.hidden = true }
      if (ready) player.pauseVideo()
    },
  }
})()
