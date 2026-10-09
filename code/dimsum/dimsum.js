(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const { dishes, createGame } = window.DimSumGame;
  const game = createGame(), dishNodes = new Map();
  let ready = false, drag = null, lastDragAt = -Infinity, pageIndex = 0;
  let stream = null, cameraRequest = 0, cameraPending = false, cameraWanted = false;
  const pages = [
    {
      lang: 'en',
      body: `<p>You just placed dim sum dishes on the table to share. Eating together is about more than food. It gives people time to catch up, tell stories, and listen to one another. Around a table, elders can share memories, younger people can talk about their lives, and family traditions can pass from one generation to the next. Here, nourishment means both sharing a meal and feeling cared for through time spent together.</p>
        <p>Reflecting on family gatherings, Judy Wang, President of the Women’s Auxiliary at the Wong Family Benevolent Association, shared:</p>
        <blockquote>“The family will come together, and sometimes we cook, sometimes we order, and we share stories or activities for the elders. It’s not always just food—it’s the time together.”</blockquote>`
    },
    {
      lang: 'zh-Hans',
      body: `<p>你刚刚把点心摆上桌，准备和大家一起分享。一起吃饭，不只是为了填饱肚子，也是坐下来聊聊近况、听听故事的机会。在唐人街，餐桌上的交流让不同年纪的人有机会了解彼此。长辈说起过去的生活，年轻人分享自己的经历，家里的习惯和记忆也就在聊天中慢慢传了下来。这一站想表达的“滋养”，既是食物带来的满足，也是有人陪伴、有人倾听的温暖。</p>
        <p>波士顿黄氏宗亲会妇女会会长 Judy Wang 谈到家人相聚时说：</p>
        <blockquote>“家人会聚在一起，有时自己做饭，有时点餐。我们也会分享故事，或安排一些让长辈参与的活动。大家聚在一起，不只是为了吃饭，更重要的是一起度过的时光。”</blockquote>`
    },
    {
      lang: 'en',
      body: `<p class="question">What stories or memories come up when you share a meal in Chinatown with others?</p>
        <p class="question" lang="zh-Hans">和别人在中国城一起吃饭时，你会聊起哪些故事或回忆？</p>`
    }
  ];

  function status(message) { $('status').textContent = message; }
  for (const dish of dishes) {
    const node = document.createElement('button');
    node.className = 'dish'; node.dataset.dish = dish.id; node.disabled = true;
    node.setAttribute('aria-label', `${dish.en} · ${dish.zh}: select to share`);
    node.setAttribute('aria-pressed', 'false');
    node.innerHTML = `<img src="assets/${dish.id}.png" alt="" draggable="false">`;
    $('dishes').append(node); dishNodes.set(dish.id, node);
    node.addEventListener('click', event => {
      if (event.detail !== 0 && performance.now() - lastDragAt < 350) return;
      if (!ready || !game.select(dish.id)) return;
      render(); status(game.state.selected ? 'Now tap the table. · 现在点餐桌。' : 'Drag the dishes onto the table. · 把点心拖到餐桌上。');
    });
    node.addEventListener('pointerdown', event => {
      if (!event.isPrimary || event.button !== 0 || !ready || game.state.phase !== 'sharing' || drag) return;
      event.preventDefault(); node.setPointerCapture(event.pointerId);
      drag = { id: dish.id, pointer: event.pointerId, x: event.clientX, y: event.clientY, moved: false, ghost: null, node };
    });
    node.addEventListener('pointermove', event => {
      if (!drag || drag.pointer !== event.pointerId) return;
      if (!drag.moved && Math.hypot(event.clientX - drag.x, event.clientY - drag.y) > 8) {
        drag.moved = true; drag.ghost = document.createElement('img');
        drag.ghost.src = `assets/${dish.id}.png`; drag.ghost.className = 'drag-ghost';
        drag.ghost.alt = ''; drag.ghost.setAttribute('aria-hidden', 'true');
        document.body.append(drag.ghost); node.classList.add('dragging');
      }
      if (!drag.moved) return;
      drag.ghost.style.left = `${event.clientX}px`; drag.ghost.style.top = `${event.clientY}px`;
      $('shared-table').classList.toggle('drop-target', overTable(event.clientX, event.clientY));
    });
    node.addEventListener('pointerup', event => {
      if (!drag || drag.pointer !== event.pointerId) return;
      const moved = drag.moved, onTable = overTable(event.clientX, event.clientY);
      clearDrag();
      if (moved) {
        lastDragAt = performance.now();
        if (onTable) share(dish.id);
        else status('Bring the dish onto the table. · 把点心放到餐桌上。');
      }
    });
    for (const name of ['pointercancel', 'lostpointercapture']) node.addEventListener(name, event => {
      if (drag?.pointer === event.pointerId) clearDrag();
    });
  }
  function overTable(x, y) {
    const rect = $('shared-table').getBoundingClientRect();
    return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
  }
  function clearDrag() {
    if (!drag) return;
    const current = drag; drag = null;
    current.ghost?.remove(); current.node.classList.remove('dragging');
    if (current.node.hasPointerCapture(current.pointer)) current.node.releasePointerCapture(current.pointer);
    $('shared-table').classList.remove('drop-target');
  }
  function share(id) {
    if (!ready || !game.share(id)) return;
    const img = document.createElement('img');
    img.src = `assets/${id}.png`; img.className = 'shared-dish'; img.alt = '';
    $('shared-dishes').append(img);
    render();
    if (game.state.phase === 'ready') { status('A little of everything, for everyone. · 各样点心，一起分享。'); $('continue').focus(); }
    else status('One more dish to share. · 又多一份，一起分享。');
  }
  $('shared-table').addEventListener('click', () => {
    if (game.state.phase !== 'sharing') return;
    if (game.state.selected) share(game.state.selected);
    else status('Drag a dish here, or tap a dish first. · 拖一份点心过来，或先点点心。');
  });
  $('board').addEventListener('contextmenu', event => event.preventDefault());
  function render() {
    const complete = ['ready', 'story'].includes(game.state.phase);
    $('board').classList.toggle('complete', complete);
    $('continue').hidden = !['sharing', 'ready'].includes(game.state.phase);
    $('camera-controls').hidden = game.state.phase !== 'arrival';
    $('shared-table').disabled = complete;
    for (const dish of dishes) {
      const node = dishNodes.get(dish.id);
      node.hidden = game.state.shared.includes(dish.id); node.disabled = !ready || game.state.phase !== 'sharing';
      node.classList.toggle('selected', dish.id === game.state.selected);
      node.setAttribute('aria-pressed', String(dish.id === game.state.selected));
    }
  }

  function stopCamera() {
    cameraRequest++; cameraPending = false;
    if (stream) stream.getTracks().forEach(track => track.stop());
    stream = null; $('camera').srcObject = null;
    $('enable-camera').disabled = false; $('enable-camera').textContent = 'Enable camera · 开启相机';
    $('camera-status').textContent = 'Preview without camera · 无相机预览';
  }
  async function openCamera() {
    if (!cameraWanted || stream || cameraPending || document.hidden || game.state.phase === 'story') return;
    const request = ++cameraRequest; cameraPending = true;
    $('enable-camera').disabled = true; $('camera-status').textContent = 'Waiting for camera permission · 等待相机授权';
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('Camera unavailable');
      const incoming = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
      if (request !== cameraRequest || document.hidden || game.state.phase === 'story') { incoming.getTracks().forEach(track => track.stop()); return; }
      stream = incoming; $('camera').srcObject = stream; await $('camera').play();
      if (request !== cameraRequest) return;
      $('enable-camera').textContent = 'Camera off · 关闭相机';
      $('camera-status').textContent = 'Nothing is recorded or uploaded. · 画面不会录制或上传。';
    } catch {
      if (request !== cameraRequest) return;
      stopCamera(); cameraWanted = false;
      $('enable-camera').textContent = 'Try camera again · 重试相机';
      $('camera-status').textContent = 'You can still play. For AR, use Safari or Chrome and allow the camera. · 可继续游戏；AR 请在浏览器中允许相机。';
    } finally {
      if (request === cameraRequest) { cameraPending = false; $('enable-camera').disabled = false; }
    }
  }
  $('enable-camera').addEventListener('click', () => {
    if (stream) { cameraWanted = false; stopCamera(); }
    else { cameraWanted = true; openCamera(); }
  });
  $('arrive').addEventListener('click', () => {
    game.start(); $('arrival').hidden = true; $('experience').hidden = false;
    render(); status(ready ? 'Bring everyone’s favourites together. · 把大家喜欢的点心放在一起。' : 'Loading the table… · 正在准备点心…');
    cameraWanted = true; openCamera();
  });
  function showPage(index) {
    clearDrag(); game.read(); stopCamera(); pageIndex = index;
    $('arrival').hidden = true; $('experience').hidden = true; $('camera-controls').hidden = true; $('camera').hidden = true;
    $('reading').hidden = false;
    const page = pages[index];
    $('page').innerHTML = page.body;
    $('page').lang = page.lang; $('page').scrollTop = 0;
    $('next').textContent = index === pages.length - 1 ? 'Replay · 再玩一次' : 'Next · 下一页';
    $('page').focus();
  }
  function returnToTable(replay) {
    clearDrag();
    if (replay) { game.reset(); game.start(); $('shared-dishes').replaceChildren(); }
    else game.returnToTable();
    $('reading').hidden = true; $('experience').hidden = false; $('camera').hidden = false;
    render(); status(replay ? 'Bring everyone’s favourites together. · 把大家喜欢的点心放在一起。' : 'A little of everything, for everyone. · 各样点心，一起分享。');
    if (replay) dishNodes.get(dishes[0].id).focus(); else $('continue').focus();
    openCamera();
  }
  $('continue').addEventListener('click', () => { if (['sharing', 'ready'].includes(game.state.phase)) showPage(0); });
  $('next').addEventListener('click', () => { if (pageIndex < pages.length - 1) showPage(pageIndex + 1); else returnToTable(true); });
  $('back').addEventListener('click', () => { if (pageIndex > 0) showPage(pageIndex - 1); else returnToTable(false); });
  window.addEventListener('blur', clearDrag);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { clearDrag(); stopCamera(); } else openCamera();
  });
  window.addEventListener('pagehide', () => { clearDrag(); stopCamera(); });
  window.addEventListener('pageshow', () => { if (cameraWanted) openCamera(); });

  const images = [...dishNodes.values()].map(node => node.querySelector('img')).concat($('teapot'));
  function loaded() {
    if (!images.every(img => img.complete && img.naturalWidth)) return;
    ready = true; render();
    if (['arrival', 'sharing'].includes(game.state.phase)) status('Bring everyone’s favourites together. · 把大家喜欢的点心放在一起。');
  }
  for (const img of images) {
    img.addEventListener('load', loaded);
    img.addEventListener('error', () => status('A picture could not load. Please refresh. · 图片加载失败，请刷新。'));
  }
  loaded();
})();
