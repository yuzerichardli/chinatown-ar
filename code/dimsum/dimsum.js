(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const { dishes, cups, createGame } = window.DimSumGame;
  const game = createGame(), dishNodes = new Map(), cupNodes = new Map();
  const dishAssets = new Map(dishes.map(dish => [dish.id, `assets/${dish.asset}`]));
  let ready = false, drag = null, lastDragAt = -Infinity, pageIndex = 0;
  let pourTimer = null, pourEffect = null;
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
  for (const [index, id] of cups.entries()) {
    const node = document.createElement('button');
    node.className = 'tea-cup'; node.dataset.cup = id; node.id = `cup-${id}`;
    node.setAttribute('aria-label', `Tea cup ${index + 1}: empty`);
    node.innerHTML = '<img src="assets/tea-cup-3d.png" alt="" draggable="false"><span class="tea-surface" aria-hidden="true"></span>';
    $('tea-cups').append(node); cupNodes.set(id, node);
    node.addEventListener('click', () => {
      if (game.state.potSelected) pour(id);
      else status('Select the teapot first, then an empty cup.');
    });
  }
  for (const dish of dishes) {
    const node = document.createElement('button');
    node.className = 'dish'; node.dataset.dish = dish.id; node.disabled = true;
    node.setAttribute('aria-label', `${dish.en}: select to share`);
    node.setAttribute('aria-pressed', 'false');
    node.innerHTML = `<img src="${dishAssets.get(dish.id)}" alt="" draggable="false">`;
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
        drag.ghost.src = dishAssets.get(dish.id); drag.ghost.className = 'drag-ghost';
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
    for (const node of cupNodes.values()) node.classList.remove('drop-target');
  }
  function overCup(x, y) {
    // Forgiving touch targets around the cup opening, but never refill a full cup.
    return cups.find(id => {
      if (game.state.filled.includes(id)) return false;
      const rect = cupNodes.get(id).getBoundingClientRect();
      return x >= rect.left - 6 && x <= rect.right + 6 &&
        y >= rect.top - 8 && y <= rect.top + rect.height * .72;
    });
  }
  const pot = $('teapot-control');
  pot.addEventListener('click', event => {
    if (event.detail !== 0 && performance.now() - lastDragAt < 350) return;
    if (!ready || !game.selectPot()) return;
    render(); status(game.state.potSelected ? 'Now select an empty cup.' : 'Drag the teapot to fill each cup.');
  });
  pot.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0 || !ready || game.state.phase !== 'tea' || drag) return;
    event.preventDefault(); pot.setPointerCapture(event.pointerId);
    drag = { pointer: event.pointerId, x: event.clientX, y: event.clientY, moved: false, ghost: null, node: pot };
  });
  pot.addEventListener('pointermove', event => {
    if (!drag || drag.node !== pot || drag.pointer !== event.pointerId) return;
    if (!drag.moved && Math.hypot(event.clientX - drag.x, event.clientY - drag.y) > 8) {
      drag.moved = true; drag.ghost = document.createElement('img');
      drag.ghost.src = $('teapot').src; drag.ghost.className = 'drag-ghost tea-drag-ghost';
      drag.ghost.alt = ''; drag.ghost.setAttribute('aria-hidden', 'true');
      document.body.append(drag.ghost); pot.classList.add('dragging');
    }
    if (!drag.moved) return;
    drag.ghost.style.left = `${event.clientX}px`; drag.ghost.style.top = `${event.clientY}px`;
    const target = overCup(event.clientX, event.clientY);
    for (const [id, node] of cupNodes) node.classList.toggle('drop-target', id === target);
  });
  pot.addEventListener('pointerup', event => {
    if (!drag || drag.node !== pot || drag.pointer !== event.pointerId) return;
    const moved = drag.moved, target = overCup(event.clientX, event.clientY);
    clearDrag();
    if (moved) {
      lastDragAt = performance.now();
      if (target) pour(target);
      else status('Bring the teapot over an empty cup.');
    }
  });
  for (const name of ['pointercancel', 'lostpointercapture']) pot.addEventListener(name, event => {
    if (drag?.pointer === event.pointerId) clearDrag();
  });
  function clearPour() {
    if (pourTimer !== null) { clearTimeout(pourTimer); pourTimer = null; }
    pourEffect?.remove(); pourEffect = null;
    game.cancelPour(); render();
  }
  function pour(id) {
    if (!ready || !game.beginPour(id)) return;
    clearDrag();
    const rect = cupNodes.get(id).getBoundingClientRect();
    const size = Math.max(92, Math.min(118, rect.width * 1.4));
    // Anchor the original pot's spout directly above the cup's opening.
    const mouthX = rect.left + rect.width * .49, mouthY = rect.top + rect.height * .32;
    pourEffect = document.createElement('div');
    pourEffect.className = 'tea-pour-effect'; pourEffect.setAttribute('aria-hidden', 'true');
    pourEffect.style.width = `${size}px`; pourEffect.style.height = `${size}px`;
    pourEffect.style.left = `${mouthX - size * .055}px`;
    pourEffect.style.top = `${mouthY - 58 - size * .36}px`;
    pourEffect.innerHTML = '<img src="assets/teapot-3d.png" alt=""><span class="tea-stream"></span>';
    document.body.append(pourEffect);
    render(); status(`Pouring tea into cup ${cups.indexOf(id) + 1}.`);
    const duration = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 450 : 1700;
    pourTimer = setTimeout(() => {
      pourTimer = null; pourEffect?.remove(); pourEffect = null;
      if (!game.finishPour()) return;
      render();
      if (game.state.phase === 'served') { status('All three cups are filled. Enjoy your meal!'); $('continue').focus(); }
      else { status('Tea is ready in this cup. Fill the next one.'); pot.focus(); }
    }, duration);
  }
  function addSharedDish(id) {
    const img = document.createElement('img');
    img.src = dishAssets.get(id); img.className = 'shared-dish'; img.alt = '';
    $('shared-dishes').append(img);
  }
  function share(id) {
    if (!ready || !game.share(id)) return;
    addSharedDish(id);
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
    const phase = game.state.phase;
    const tea = ['tea', 'pouring', 'served', 'story'].includes(phase);
    const complete = phase === 'ready' || tea;
    $('board').classList.toggle('complete', complete);
    $('board').classList.toggle('tea-stage', tea);
    $('dishes').hidden = tea;
    $('tea-cups').hidden = !tea;
    $('tea-message').hidden = !tea;
    $('tea-message').textContent = phase === 'served' || phase === 'story' ? 'Enjoy your meal!' : ready ? 'Drag the teapot to fill each cup.' : 'Preparing the tea cups…';
    $('tea-message').classList.toggle('served', phase === 'served' || phase === 'story');
    $('continue').hidden = !['sharing', 'ready', 'served'].includes(phase);
    $('camera-controls').hidden = phase !== 'arrival';
    $('shared-table').disabled = complete;
    pot.disabled = !ready || phase !== 'tea';
    pot.classList.toggle('selected', game.state.potSelected);
    pot.classList.toggle('pouring', phase === 'pouring');
    pot.setAttribute('aria-pressed', String(game.state.potSelected));
    for (const [index, id] of cups.entries()) {
      const node = cupNodes.get(id), filled = game.state.filled.includes(id);
      node.disabled = !ready || phase !== 'tea' || filled;
      node.classList.toggle('filled', filled);
      node.classList.toggle('pouring', game.state.pouring === id);
      node.setAttribute('aria-label', `Tea cup ${index + 1}: ${filled ? 'filled' : 'empty'}`);
    }
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
    $('enable-camera').disabled = false; $('enable-camera').textContent = 'Enable camera';
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
      $('enable-camera').textContent = 'Camera off';
      $('camera-status').textContent = 'Nothing is recorded or uploaded. · 画面不会录制或上传。';
    } catch {
      if (request !== cameraRequest) return;
      stopCamera(); cameraWanted = false;
      $('enable-camera').textContent = 'Try camera again';
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
    if (!game.read()) return;
    clearDrag(); clearPour(); stopCamera(); pageIndex = index;
    $('arrival').hidden = true; $('experience').hidden = true; $('camera-controls').hidden = true; $('camera').hidden = true;
    $('reading').hidden = false;
    const page = pages[index];
    $('page').innerHTML = page.body;
    $('page').lang = page.lang; $('page').scrollTop = 0;
    $('next').textContent = index === pages.length - 1 ? 'Replay' : 'Next';
    $('page').focus();
  }
  function returnToTable(replay) {
    clearDrag(); clearPour();
    if (replay) { game.reset(); game.start(); $('shared-dishes').replaceChildren(); }
    else game.returnToTable();
    $('reading').hidden = true; $('experience').hidden = false; $('camera').hidden = false;
    render(); status(replay ? 'Bring everyone’s favourites together. · 把大家喜欢的点心放在一起。' : 'A little of everything, for everyone. · 各样点心，一起分享。');
    if (replay) dishNodes.get(dishes[0].id).focus(); else $('continue').focus();
    openCamera();
  }
  $('continue').addEventListener('click', () => {
    // Keep all four dishes on the tea table, even when dish-sharing was skipped.
    if (['sharing', 'ready'].includes(game.state.phase)) {
      for (const dish of dishes) if (game.share(dish.id)) addSharedDish(dish.id);
    }
    if (game.beginTea()) {
      clearDrag(); render(); status('Drag the teapot to fill each cup.'); pot.focus();
    } else if (game.state.phase === 'served') showPage(0);
  });
  $('next').addEventListener('click', () => { if (pageIndex < pages.length - 1) showPage(pageIndex + 1); else returnToTable(true); });
  $('back').addEventListener('click', () => { if (pageIndex > 0) showPage(pageIndex - 1); else returnToTable(false); });
  window.addEventListener('blur', () => { clearDrag(); clearPour(); });
  window.addEventListener('resize', () => { clearDrag(); clearPour(); });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { clearDrag(); clearPour(); stopCamera(); } else openCamera();
  });
  window.addEventListener('pagehide', () => { clearDrag(); clearPour(); stopCamera(); });
  window.addEventListener('pageshow', () => { if (cameraWanted) openCamera(); });

  const images = [...dishNodes.values(), ...cupNodes.values()].map(node => node.querySelector('img')).concat($('teapot'), $('table-surface'));
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
