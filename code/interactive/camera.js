(() => {
  const video = document.getElementById('live-camera')
  const help = document.getElementById('camera-help')
  const retry = document.getElementById('camera-retry')
  let stream = null, pending = false, request = 0
  function stop() {
    request++; pending = false
    if (stream) stream.getTracks().forEach(track => track.stop())
    stream = null; video.srcObject = null
  }
  async function open() {
    if (stream || pending || document.hidden || !document.getElementById('story').hidden) return
    const current = ++request
    pending = true; retry.disabled = true; help.hidden = true
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('Unavailable')
      const incoming = await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}},audio:false})
      if (current !== request || document.hidden) { incoming.getTracks().forEach(track => track.stop()); return }
      stream = incoming; video.srcObject = stream
      await video.play()
    } catch {
      if (current !== request) return
      stop(); help.hidden = !document.getElementById('arrival').hidden  // like lion: no camera notice over the opening question
      document.getElementById('camera-message').textContent = 'Camera unavailable. You can still play. Use Safari or Chrome with camera permission. / 可继续预览；请在浏览器中允许相机。'
    } finally {
      if (current === request) pending = false
      retry.disabled = false
    }
  }
  retry.addEventListener('click', open)
  document.addEventListener('visibilitychange', () => document.hidden ? stop() : open())
  window.addEventListener('pagehide', stop)
  window.addEventListener('pageshow', open)
  // poses.js stops the camera during the story pages and reopens it on replay.
  window.arCamera = { open, stop }
  // No camera frames are recorded or uploaded.
  open()
})()
