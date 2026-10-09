const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const vm = require('node:vm');
const { createGame, dishes } = require('./game.js');

test('four optional dishes, one table; no duplicate shares', () => {
  const game = createGame(); game.read(); assert.equal(game.state.phase, 'arrival');
  assert.equal(game.share('har-gow'), false); game.start();
  assert.equal(game.share('missing'), false);
  dishes.forEach(d => {assert.equal(game.share(d.id), true); assert.equal(game.share(d.id), false);});
  assert.equal(game.state.phase, 'ready'); assert.equal(game.state.shared.length, 4);
  game.read(); assert.equal(game.state.phase, 'story'); game.returnToTable(); assert.equal(game.state.phase, 'ready');
  game.reset(); game.start(); assert.deepEqual(game.state, {phase:'sharing', selected:null, shared:[]});
});
test('Continue works after zero, one, two, or three dishes; Back preserves the partial table', () => {
  for (const count of [0, 1, 2, 3]) {
    const game = createGame(); game.start();
    dishes.slice(0, count).forEach(d => game.share(d.id));
    game.select(dishes[count].id); game.read();
    assert.equal(game.state.phase, 'story'); assert.equal(game.state.selected, null);
    game.returnToTable(); assert.equal(game.state.phase, 'sharing');
    assert.equal(game.state.shared.length, count);
    assert.equal(game.share(dishes[count].id), true);
  }
});
test('selection toggles and clears when a dish is shared', () => {
  const game = createGame(); game.start(); game.select('har-gow'); assert.equal(game.state.selected, 'har-gow');
  game.select('har-gow'); assert.equal(game.state.selected, null);
  game.select('har-gow'); game.share('har-gow'); assert.equal(game.state.selected, null);
  assert.equal(game.select('har-gow'), false); assert.equal(game.select('missing'), false);
});
function element() {
  const events = {}, selectors = new Map(), classes = new Set(), captured = new Set();
  return {
    hidden:false, disabled:false, complete:true, naturalWidth:640, dataset:{}, style:{}, children:[],
    rect:{left:0,top:0,right:100,bottom:100,width:100,height:100}, textContent:'', innerHTML:'',
    classList:{add(...names){names.forEach(n=>classes.add(n));},remove(...names){names.forEach(n=>classes.delete(n));},
      toggle(name,force){if(force ?? !classes.has(name)) classes.add(name); else classes.delete(name);},contains(n){return classes.has(n);}},
    setAttribute(){}, querySelector(s){if(!selectors.has(s)) selectors.set(s,element());return selectors.get(s);},
    append(child){this.children.push(child);},replaceChildren(){this.children=[];},remove(){this.removed=true;},focus(){this.focused=true;},
    getBoundingClientRect(){return this.rect;},setPointerCapture(id){captured.add(id);},hasPointerCapture(id){return captured.has(id);},releasePointerCapture(id){captured.delete(id);},
    play:async()=>{},addEventListener(n,f){(events[n] ||= []).push(f);},
    fire(n,e={}){if(n==='click'&&this.disabled)return;for(const f of events[n]||[])f({preventDefault(){},detail:0,...e});}
  };
}
function harness(mediaDevices, tableReady=true) {
  const ids=['arrival','arrive','camera','experience','board','dishes','shared-table','table-surface','teapot','shared-dishes','status','continue','camera-controls','enable-camera','camera-status','reading','page','back','next'];
  const el=Object.fromEntries(ids.map(id=>[id,element()]));el.experience.hidden=true;el.reading.hidden=true;
  el['table-surface'].complete=tableReady;
  const document=element(),window=element();document.hidden=false;document.body=element();
  document.getElementById=id=>el[id];document.createElement=()=>element();let game;
  window.DimSumGame={...require('./game.js'),createGame(){game=createGame();return game;}};
  vm.runInNewContext(fs.readFileSync(__dirname+'/dimsum.js','utf8'),{document,window,navigator:{mediaDevices},performance:{now:()=>0}});
  const dish=id=>el.dishes.children.find(n=>n.dataset.dish===id);
  const shareAll=()=>dishes.forEach(d=>{dish(d.id).fire('click');el['shared-table'].fire('click');});
  return {el,document,window,game,dish,shareAll};
}
const down={isPrimary:true,button:0,pointerId:1,clientX:200,clientY:200};
const flush=()=>new Promise(resolve=>setImmediate(resolve));
test('matching transparent 3D-style assets are used before, during, and after sharing',()=>{
  const html=fs.readFileSync(__dirname+'/index.html','utf8');
  assert.match(html,/id="table-surface" src="assets\/lazy-susan\.png"/);
  assert.match(html,/id="teapot" src="assets\/teapot-3d\.png"/);
  assert.match(html,/dimsum\.css\?v=5/);assert.match(html,/game\.js\?v=4/);assert.match(html,/dimsum\.js\?v=5/);
  for (const asset of [...dishes.map(d=>d.asset),'teapot-3d.png','lazy-susan.png']) {
    const png=fs.readFileSync(__dirname+'/assets/'+asset);
    assert.equal(png.readUInt8(25),6,asset+' must retain RGBA transparency');
    assert.ok(png.readUInt32BE(16)<=1024,asset+' must be mobile-sized');
  }
  const h=harness();h.el.arrive.fire('click');
  for (const d of dishes) assert.ok(h.dish(d.id).innerHTML.includes('assets/'+d.asset));
  h.dish('har-gow').fire('pointerdown',down);h.dish('har-gow').fire('pointermove',{...down,clientX:50,clientY:50});
  assert.equal(h.document.body.children[0].src,'assets/har-gow-3d.png');
  h.dish('har-gow').fire('pointerup',{...down,clientX:50,clientY:50});
  assert.equal(h.el['shared-dishes'].children[0].src,'assets/har-gow-3d.png');
});
test('table image is included in loading readiness, but Continue remains optional',()=>{
  const h=harness(undefined,false);h.el.arrive.fire('click');
  assert.equal(h.dish('har-gow').disabled,true);assert.equal(h.el.continue.hidden,false);
  h.el['table-surface'].complete=true;h.el['table-surface'].fire('load');
  assert.equal(h.dish('har-gow').disabled,false);
  h.el.continue.fire('click');assert.equal(h.game.state.phase,'story');
});
test('controller: tap to share, completion, clean story screens, EN/ZH/reflection, Back, Replay',()=>{
  const h=harness();h.el.arrive.fire('click');h.shareAll();
  assert.equal(h.game.state.phase,'ready');assert.equal(h.el.continue.hidden,false);
  assert.equal(h.el['shared-dishes'].children.length,4);
  h.el.continue.fire('click');assert.equal(h.el.experience.hidden,true);assert.equal(h.el['camera-controls'].hidden,true);assert.equal(h.el.camera.hidden,true);
  assert.equal(h.el.reading.hidden,false);assert.match(h.el.page.innerHTML,/You just placed dim sum dishes on the table to share\./);
  h.el.back.fire('click');assert.equal(h.game.state.phase,'ready');assert.equal(h.el['shared-dishes'].children.length,4);
  h.el.continue.fire('click');h.el.next.fire('click');assert.equal(h.el.page.lang,'zh-Hans');assert.match(h.el.page.innerHTML,/你刚刚把点心摆上桌，准备和大家一起分享。/);
  h.el.next.fire('click');assert.match(h.el.page.innerHTML,/What stories or memories come up when you share a meal in Chinatown with others\?/);h.el.next.fire('click');
  assert.equal(h.game.state.phase,'sharing');assert.equal(h.el.reading.hidden,true);assert.equal(h.el.experience.hidden,false);
  assert.equal(h.el['shared-dishes'].children.length,0);assert.equal(h.el.continue.hidden,false);assert.equal(h.el['camera-controls'].hidden,true);
  dishes.forEach(d=>assert.equal(h.dish(d.id).hidden,false));
});
test('arrival uses the 180 Café landmark and the requested question',()=>{
  const html=fs.readFileSync(__dirname+'/index.html','utf8');
  const arrival=html.slice(html.indexOf('<section id="arrival"'),html.indexOf('<section id="experience"'));
  assert.match(arrival,/src="assets\/180-cafe-sign\.svg\?v=1"/);
  assert.match(arrival,/>Are you in front of the 180 cafe\?<\/h1>/);
  assert.match(arrival,/<button id="arrive">Yes<\/button>/);
  assert.doesNotMatch(arrival,/arrival-food|arrival-note|eyebrow/);
  const sign=fs.readFileSync(__dirname+'/assets/180-cafe-sign.svg','utf8');
  for (const character of ['面','包','工','坊']) assert.ok(sign.includes(character));
});
test('story preserves the supplied attribution, quotations, and bilingual reflection without added headings',()=>{
  const h=harness();h.el.arrive.fire('click');h.el.continue.fire('click');
  assert.match(h.el.page.innerHTML,/Judy Wang, President of the Women’s Auxiliary at the Wong Family Benevolent Association, shared:/);
  assert.ok(h.el.page.innerHTML.includes('<blockquote>“The family will come together, and sometimes we cook, sometimes we order, and we share stories or activities for the elders. It’s not always just food—it’s the time together.”</blockquote>'));
  assert.doesNotMatch(h.el.page.innerHTML,/<h2|eyebrow|MICHELIN/);
  h.el.next.fire('click');
  assert.match(h.el.page.innerHTML,/波士顿黄氏宗亲会妇女会会长 Judy Wang 谈到家人相聚时说：/);
  assert.ok(h.el.page.innerHTML.includes('<blockquote>“家人会聚在一起，有时自己做饭，有时点餐。我们也会分享故事，或安排一些让长辈参与的活动。大家聚在一起，不只是为了吃饭，更重要的是一起度过的时光。”</blockquote>'));
  assert.doesNotMatch(h.el.page.innerHTML,/<h2|eyebrow/);
  h.el.next.fire('click');
  assert.ok(h.el.page.innerHTML.includes('What stories or memories come up when you share a meal in Chinatown with others?'));
  assert.ok(h.el.page.innerHTML.includes('<p class="question" lang="zh-Hans">和别人在中国城一起吃饭时，你会聊起哪些故事或回忆？</p>'));
});
test('controller: Continue is available immediately and after any partial interaction',()=>{
  for (const count of [0, 1, 2, 3]) {
    const h=harness();h.el.arrive.fire('click');assert.equal(h.el.continue.hidden,false);
    dishes.slice(0,count).forEach(d=>{h.dish(d.id).fire('click');h.el['shared-table'].fire('click');});
    h.el.continue.fire('click');assert.equal(h.game.state.phase,'story');assert.equal(h.el.experience.hidden,true);
    h.el.back.fire('click');assert.equal(h.game.state.phase,'sharing');assert.equal(h.el.continue.hidden,false);
    assert.equal(h.el['shared-dishes'].children.length,count);
    assert.equal(h.dish(dishes[count].id).disabled,false);
  }
});
test('gameplay has no visible headings, instructions, counters, or dish labels',()=>{
  const html=fs.readFileSync(__dirname+'/index.html','utf8');
  const scene=html.slice(html.indexOf('<section id="experience"'),html.indexOf('<aside id="camera-controls"'));
  assert.doesNotMatch(scene,/<header|<h1|id="(?:counter|instruction|instruction-zh|tap-hint|table-hint)"/);
  assert.match(scene,/id="continue"/);assert.match(scene,/class="sr-only" role="status"/);
  const h=harness();dishes.forEach(d=>assert.doesNotMatch(h.dish(d.id).innerHTML,/dish-label|<span/));
});
test('controller: drag/drop, outside drop, cancellation and blur restore dishes',()=>{
  const h=harness();h.el.arrive.fire('click');const dish=h.dish('har-gow');
  dish.fire('pointerdown',down);dish.fire('pointermove',{...down,clientX:50,clientY:50});
  assert.equal(dish.classList.contains('dragging'),true);dish.fire('pointercancel',down);
  assert.equal(dish.classList.contains('dragging'),false);assert.equal(h.document.body.children[0].removed,true);
  dish.fire('pointerdown',down);dish.fire('pointermove',{...down,clientX:250,clientY:250});dish.fire('pointerup',{...down,clientX:250,clientY:250});
  assert.equal(h.game.state.shared.length,0);
  dish.fire('pointerdown',down);dish.fire('pointermove',{...down,clientX:50,clientY:50});h.window.fire('blur');
  assert.equal(dish.classList.contains('dragging'),false);
  dish.fire('pointerdown',down);dish.fire('pointermove',{...down,clientX:50,clientY:50});dish.fire('pointerup',{...down,clientX:50,clientY:50});
  assert.equal(h.game.state.shared.length,1);assert.equal(dish.hidden,true);
});
test('controller: late camera permission cannot put the scene over the story',async()=>{
  let resolve,stopped=0;const h=harness({getUserMedia:()=>new Promise(r=>{resolve=r;})});
  h.el.arrive.fire('click');h.shareAll();h.el.continue.fire('click');
  resolve({getTracks:()=>[{stop(){stopped++;}}]});await flush();
  assert.equal(stopped,1);assert.equal(h.el.camera.srcObject,null);assert.equal(h.el.experience.hidden,true);assert.equal(h.el['enable-camera'].disabled,false);
});
test('controller: camera denial still permits playing; camera off stays off on resume',async()=>{
  const h=harness({getUserMedia:async()=>{throw Error('Denied');}});h.el.arrive.fire('click');await flush();
  assert.equal(h.el['enable-camera'].disabled,false);assert.match(h.el['camera-status'].textContent,/still play/);assert.equal(h.dish('har-gow').disabled,false);
  let opened=0,stopped=0;const k=harness({getUserMedia:async()=>{opened++;return {getTracks:()=>[{stop(){stopped++;}}]};}});
  k.el.arrive.fire('click');await flush();k.el['enable-camera'].fire('click');assert.equal(stopped,1);
  k.document.hidden=true;k.document.fire('visibilitychange');k.document.hidden=false;k.document.fire('visibilitychange');await flush();assert.equal(opened,1);
});
