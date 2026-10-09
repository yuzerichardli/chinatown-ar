(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const duration = 8000;
  let elapsed = 0, active = false, auto = false, previous = null, frame = null;
  let pageIndex = 0, stream = null, cameraRequest = 0, ready = false;
  const pages = [
    `
    <p>You just engaged with the lion dance and its movement. Lion and dragon dances are often part of Lunar New Year celebrations in Chinatown, with performances usually starting in Phillips Square. Behind each movement are people learning, practicing, and working together. These teams give young people a way to connect with cultural traditions through movement and celebration. Older adults’ dance groups also bring people together to stay active, perform, and enjoy each other’s company.</p>
    <p>One interview participant reflected:</p><blockquote>“Like you know, some of them are connected to festivals or celebrations like the Lion dancers and the Dragon dances. All those things happened as a way to get the youth engaged and involved, which is pretty interesting in terms of its own history.”</blockquote>
    <p>At Phillips Square, movement and celebration come together. Practicing, performing, and watching give people different ways to take part, connect across generations, and keep traditions alive.</p>`,
    `
    <p>你刚刚参与了舞狮及其动作的互动体验。每逢春节，唐人街常常会有舞狮、舞龙等庆祝活动，表演通常从 Phillips Square 开始。每一个动作背后，都有人一起学习、练习和配合。这些活动让年轻人有机会亲身接触文化传统，参与社区的节日庆祝。长辈们的舞蹈队也让大家有机会聚在一起，活动身体、参加表演，享受彼此陪伴的时光。</p>
    <p>一位受访者谈到：</p><blockquote>“有些活动和节日庆祝有关，比如舞狮、舞龙。这些活动让年轻人有机会参与进来。回头看它们的发展，这一点很有意思。”</blockquote>
    <p>在 Phillips Square，运动也是庆祝的一部分。不论是一起练习、上场表演，还是在一旁观看，大家都能以自己的方式参与其中，让不同年纪的人走到一起，也让传统继续传下去。</p>`,
    `
    <p class="question">Have you ever joined or watched a cultural celebration? What did it feel like to be part of that moment?</p>
    <p class="question" lang="zh-Hans">你有没有参加或观看过文化节庆活动？当时身在其中，你有什么感受？</p>`
  ];
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Authored pose sequence inspired by the reference's low and raised postures.
  // Percent translations keep the steps proportional on different phone sizes.
  // This is a single-image approximation, not reconstructed dancer movement.
  const dancePoses = [
    // seconds, horizontal %, vertical %, tilt degrees, vertical scale
    [0, 0, 0, 0, 1],
    [.5, 0, 2, -3, .96],
    [1, -1, -3, 4, 1.02],
    [1.45, -2, 2, -4, .96],
    [1.9, -3, -2, 3, 1.01],
    [2.35, -4, 0, 0, 1],
    [2.9, -4, 5, -7, .90],
    [3.25, -4, 5, -7, .90],
    [3.8, -2, -5, 5, 1.04],
    [4.15, -2, -4, 2, 1.02],
    [4.55, 0, 1, -2, .97],
    [4.9, 2, -2, 3, 1.01],
    [5.25, 3, 1, -2, .97],
    [5.6, 4, -2, 2, 1.01],
    [6, 4, 0, 0, 1],
    [6.5, 2, 4, -6, .92],
    [6.85, 2, 4, -6, .92],
    [7.5, 0, -2, 2, 1.01],
    [8, 0, 0, 0, 1]
  ];
  const secondDancePoses = [
    // Two greeting nods, approach, crouch/hop/landing, retreat, closing bow.
    [0, 0, 0, 0, 1], [.35, 0, 2, 5, .96],
    [.65, 0, -2, -4, 1.02], [.95, 0, 2, 6, .95],
    [1.25, 0, -3, -5, 1.03],
    [1.6, 2, 0, 1, .98], [1.9, 4, -3, -3, 1.02],
    [2.2, 5, 1, 3, .97], [2.5, 6, -2, -2, 1.01],
    [2.85, 6, 5, 8, .90], [3.15, 6, 5, 8, .90],
    [3.45, 4, -10, -7, 1.06], [3.65, 3, -11, -4, 1.04],
    [3.95, 2, 3, 4, .93], [4.2, 2, 0, 0, 1],
    [4.5, 1, -2, -5, 1.02], [4.75, 0, 0, 4, .98],
    [5, -1, -2, -4, 1.02], [5.25, -2, 0, 3, .98],
    [5.55, -3, 3, 4, .94], [5.85, -4, -6, -4, 1.04],
    [6.15, -3, 2, 2, .96], [6.4, -2, 0, 0, 1],
    [6.85, 0, 5, 9, .90], [7.2, 0, 5, 9, .90],
    [7.65, 0, -2, -2, 1.02], [8, 0, 0, 0, 1]
  ];
  function animateLion(id, poses) {
    const seconds = elapsed / 1000;
    let index = 0;
    while (index < poses.length - 2 && seconds > poses[index + 1][0]) index++;
    const from = poses[index], to = poses[index + 1];
    const fraction = Math.max(0, Math.min(1, (seconds - from[0]) / (to[0] - from[0])));
    const eased = fraction * fraction * (3 - 2 * fraction);
    const strength = reducedMotion ? .15 : 1;
    const value = i => from[i] + (to[i] - from[i]) * eased;
    $(id).style.transform = `translate(${value(1) * strength}%, ${value(2) * strength}%) rotate(${value(3) * strength}deg) scaleY(${1 + (value(4) - 1) * strength})`;
  }
  function pose() {
    animateLion('lion', dancePoses);
    animateLion('lion-two', secondDancePoses);
    drawFireworks();
    $('progress').value = elapsed;
  }
  function drawFireworks() {
    // Small, staggered bursts rather than full-screen flashes; no audio.
    if (elapsed === 0 || reducedMotion) { $('fireworks').innerHTML = ''; return; }
    const bursts = [[20,23,0,'#ffd878'],[78,17,650,'#f49d86'],[51,32,1250,'#ffedb7']];
    const sparks = bursts.map(([x,y,delay,color]) => {
      const age = elapsed - delay;
      if (age < 0) return '';
      const phase = (age % 2300) / 2300;
      if (phase > .8) return '';
      const radius = 2 + phase * 17;
      const opacity = Math.sin(Math.PI * phase / .8) * .85;
      return Array.from({length:14}, (_,i) => {
        const angle = i / 14 * Math.PI * 2;
        const px = x + Math.cos(angle) * radius;
        const py = y + Math.sin(angle) * radius + phase * phase * 5;
        return `<circle cx="${px}" cy="${py}" r="${.38 + (i%3)*.1}" fill="${color}" opacity="${opacity}"/>`;
      }).join('');
    }).join('');
    $('fireworks').innerHTML = `<svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">${sparks}</svg>`;
  }
  function pause() {
    active = false; auto = false; previous = null;
    cancelAnimationFrame(frame); frame = null;
    $('hold').classList.remove('active');
    if (elapsed > 0 && elapsed < duration) $('status').textContent = 'Paused. Hold to continue · 已暂停，按住继续';
  }
  function tick(now) {
    if (!active) return;
    if (previous !== null) elapsed = Math.min(duration, elapsed + Math.min(now - previous, 100));
    previous = now; pose();
    if (elapsed >= duration) {
      showPage(0);
      return;
    }
    frame = requestAnimationFrame(tick);
  }
  function start(automatic = false) {
    if (!ready || $('experience').hidden || elapsed >= duration || !$('reading').hidden || active) return;
    active = true; auto = automatic; previous = null;
    $('hold').classList.add('active');
    $('status').textContent = 'Moving together · 一起动起来';
    frame = requestAnimationFrame(tick);
  }
  $('hold').addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0) return;
    event.preventDefault(); $('hold').setPointerCapture(event.pointerId); start();
  });
  for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    $('hold').addEventListener(name, () => { if (!auto) pause(); });
  }
  $('hold').addEventListener('contextmenu', event => event.preventDefault());
  $('hold').addEventListener('keydown', event => {
    if ([' ', 'Enter'].includes(event.key)) { event.preventDefault(); if (!event.repeat) start(); }
  });
  $('hold').addEventListener('keyup', event => {
    if ([' ', 'Enter'].includes(event.key)) { event.preventDefault(); if (!auto) pause(); }
  });
  $('hold').addEventListener('blur', () => { if (!auto) pause(); });
  function stopCamera() {
    cameraRequest++;
    if (stream) stream.getTracks().forEach(track => track.stop());
    stream = null; $('camera').srcObject = null;
    $('enable-camera').disabled = false;
    $('enable-camera').textContent = 'Enable camera';
    $('camera-status').textContent = 'Preview without camera · 无相机预览';
  }
  async function openCamera() {
    if (stream || (!$('reading').hidden)) return;
    const request = ++cameraRequest;
    $('enable-camera').disabled = true;
    $('camera-fallback').hidden = true;
    $('camera-status').textContent = 'Waiting for camera permission · 等待相机授权';
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('Camera unavailable');
      const incoming = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
      if (request !== cameraRequest || document.hidden) { incoming.getTracks().forEach(track => track.stop()); return; }
      stream = incoming; $('camera').srcObject = stream; await $('camera').play();
      if (request !== cameraRequest) return;
      $('enable-camera').textContent = 'Turn camera off';
      $('camera-status').textContent = 'Camera view · 相机画面';
    } catch {
      if (request !== cameraRequest) return;
      stopCamera();
      $('camera-fallback').hidden = false;
      $('enable-camera').textContent = 'Try camera again';
      $('camera-status').textContent = 'Camera unavailable. You can still play. Use Safari or Chrome with camera permission. / 可继续预览；请在浏览器中允许相机。';
    } finally { if (request === cameraRequest) $('enable-camera').disabled = false; }
  }
  $('enable-camera').addEventListener('click', openCamera);
  $('arrive').addEventListener('click', () => {
    $('arrival').hidden = true;
    $('experience').hidden = false;
    openCamera(); $('hold').focus();
  });
  function showPage(index) {
    pause(); stopCamera(); pageIndex = index;
    $('experience').hidden = true; $('reading').hidden = false;
    $('page').innerHTML = pages[index]; $('page').lang = index === 1 ? 'zh-Hans' : 'en';
    $('page').scrollTop = 0;
    $('next').textContent = index === 2 ? 'Replay' : 'Next';
    $('page').focus();
  }
  function returnToScene(reset) {
    pause(); elapsed = 0;
    $('reading').hidden = true; $('experience').hidden = false;
    $('hold').hidden = false; pose();
    $('status').textContent = reset ? 'Hold to move. Release to pause. · 按住开始，松开暂停' : 'Movement complete · 互动完成';
    $('hold').focus(); openCamera();
  }
  $('next').addEventListener('click', () => pageIndex < 2 ? showPage(pageIndex + 1) : returnToScene(true));
  $('back').addEventListener('click', () => pageIndex > 0 ? showPage(pageIndex - 1) : returnToScene(false));
  window.addEventListener('blur', pause);
  document.addEventListener('visibilitychange', () => { if (document.hidden) { pause(); stopCamera(); } else if ($('reading').hidden) openCamera(); });
  window.addEventListener('pagehide', () => { pause(); stopCamera(); });
  function loaded() {
    if (!$('lion').naturalWidth || !$('lion-two').naturalWidth) return;
    ready = true; $('hold').disabled = false;
    $('status').textContent = 'Hold to move. Release to pause. · 按住开始，松开暂停';
  }
  $('lion').addEventListener('load', loaded);
  $('lion-two').addEventListener('load', loaded);
  $('lion-two').addEventListener('error', () => { $('status').textContent = 'The second lion could not load. Please refresh.'; });
  $('lion').addEventListener('error', () => { $('status').textContent = 'The lion could not load. Please refresh. / 图片加载失败，请刷新。'; });
  if ($('lion').complete && $('lion-two').complete) loaded();
  openCamera();
})();
