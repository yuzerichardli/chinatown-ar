const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const vm = require('node:vm');
const { createGame, dishes, cups } = require('./game.js');

function serveTea(game) {
  game.beginTea();
  cups.forEach(id => { assert.equal(game.beginPour(id), true); assert.equal(game.finishPour(), true); });
}

test('four optional dishes, one table; no duplicate shares', () => {
  const game = createGame(); game.read(); assert.equal(game.state.phase, 'arrival');
  assert.equal(game.share('har-gow'), false); game.start();
  assert.equal(game.share('missing'), false);
  dishes.forEach(d => {assert.equal(game.share(d.id), true); assert.equal(game.share(d.id), false);});
  assert.equal(game.state.phase, 'ready'); assert.equal(game.state.shared.length, 4);
  serveTea(game); game.read(); assert.equal(game.state.phase, 'story'); game.returnToTable(); assert.equal(game.state.phase, 'served');
  game.reset(); game.start(); assert.deepEqual(game.state, {phase:'sharing', selected:null, shared:[], filled:[], pouring:null, potSelected:false});
});
test('Continue opens tea after zero, one, two, or three dishes; Back preserves the partial table and tea', () => {
  for (const count of [0, 1, 2, 3]) {
    const game = createGame(); game.start();
    dishes.slice(0, count).forEach(d => game.share(d.id));
    game.select(dishes[count].id); serveTea(game); game.read();
    assert.equal(game.state.phase, 'story'); assert.equal(game.state.selected, null);
    game.returnToTable(); assert.equal(game.state.phase, 'served');
    assert.equal(game.state.shared.length, count);
    assert.deepEqual(game.state.filled, cups);
    assert.equal(game.share(dishes[count].id), false);
  }
});
test('selection toggles and clears when a dish is shared', () => {
  const game = createGame(); game.start(); game.select('har-gow'); assert.equal(game.state.selected, 'har-gow');
  game.select('har-gow'); assert.equal(game.state.selected, null);
  game.select('har-gow'); game.share('har-gow'); assert.equal(game.state.selected, null);
  assert.equal(game.select('har-gow'), false); assert.equal(game.select('missing'), false);
});
test('tea requires exactly three different cups, one pour at a time, before reading',()=>{
  const game=createGame();
  assert.equal(game.beginTea(),false);assert.equal(game.beginPour('left'),false);
  assert.equal(game.selectPot(),false);assert.equal(game.finishPour(),false);
  game.start();game.share('har-gow');game.select('siu-mai');game.beginTea();
  assert.equal(game.state.selected,null);assert.equal(game.read(),false);
  assert.equal(game.share('siu-mai'),false);assert.equal(game.beginTea(),false);
  assert.equal(game.beginPour('missing'),false);
  for(const id of ['front','left','right']) {
    game.selectPot();assert.equal(game.state.potSelected,true);
    assert.equal(game.beginPour(id),true);assert.equal(game.state.potSelected,false);
    assert.equal(game.state.filled.includes(id),false);assert.equal(game.read(),false);
    assert.equal(game.beginPour(id),false);assert.equal(game.beginPour('right'),false);
    assert.equal(game.selectPot(),false);assert.equal(game.finishPour(),true);
    assert.equal(game.finishPour(),false);assert.equal(game.beginPour(id),false);
  }
  assert.equal(game.state.phase,'served');assert.deepEqual(game.state.filled,['front','left','right']);
  assert.deepEqual(game.state.shared,['har-gow']);assert.equal(game.read(),true);
  game.returnToTable();assert.equal(game.state.phase,'served');assert.equal(game.beginPour('left'),false);
  game.reset();assert.deepEqual(game.state.filled,[]);assert.equal(game.state.pouring,null);
});
test('an interrupted pour leaves the cup empty and can be retried',()=>{
  const game=createGame();game.start();game.beginTea();game.beginPour('right');
  assert.equal(game.cancelPour(),true);assert.equal(game.state.phase,'tea');
  assert.equal(game.state.pouring,null);assert.deepEqual(game.state.filled,[]);
  assert.equal(game.finishPour(),false);assert.equal(game.cancelPour(),false);
  assert.equal(game.beginPour('right'),true);game.finishPour();assert.deepEqual(game.state.filled,['right']);
});
function element() {
  const events = {}, selectors = new Map(), classes = new Set(), captured = new Set();
  return {
    hidden:false, disabled:false, complete:true, naturalWidth:640, dataset:{}, style:{}, children:[],
    rect:{left:0,top:0,right:100,bottom:100,width:100,height:100}, textContent:'', innerHTML:'',
    classList:{add(...names){names.forEach(n=>classes.add(n));},remove(...names){names.forEach(n=>classes.delete(n));},
      toggle(name,force){if(force ?? !classes.has(name)) classes.add(name); else classes.delete(name);},contains(n){return classes.has(n);}},
    attributes:{},setAttribute(name,value){this.attributes[name]=value;}, querySelector(s){if(!selectors.has(s)) selectors.set(s,element());return selectors.get(s);},
    append(child){this.children.push(child);},replaceChildren(){this.children=[];},remove(){this.removed=true;},focus(){this.focused=true;},
    getBoundingClientRect(){return this.rect;},setPointerCapture(id){captured.add(id);},hasPointerCapture(id){return captured.has(id);},releasePointerCapture(id){captured.delete(id);},
    play:async()=>{},addEventListener(n,f){(events[n] ||= []).push(f);},
    fire(n,e={}){if(n==='click'&&this.disabled)return;for(const f of events[n]||[])f({preventDefault(){},detail:0,...e});}
  };
}
function harness(mediaDevices, tableReady=true, cupsReady=true) {
  const ids=['arrival','arrive','camera','experience','board','dishes','shared-table','table-surface','teapot','teapot-control','tea-cups','tea-message','shared-dishes','status','continue','camera-controls','enable-camera','camera-status','reading','page','back','next'];
  const el=Object.fromEntries(ids.map(id=>[id,element()]));el.experience.hidden=true;el.reading.hidden=true;
  el['table-surface'].complete=tableReady;
  el.teapot.src='assets/teapot-3d.png';
  const timers=new Map();let timerId=0;
  const document=element(),window=element();document.hidden=false;document.body=element();
  let created=0;
  document.getElementById=id=>el[id];document.createElement=()=>{
    const node=element();if(created++<cups.length) node.querySelector('img').complete=cupsReady;return node;
  };let game;
  window.DimSumGame={...require('./game.js'),createGame(){game=createGame();return game;}};
  vm.runInNewContext(fs.readFileSync(__dirname+'/dimsum.js','utf8'),{document,window,navigator:{mediaDevices},performance:{now:()=>0},
    setTimeout(fn){timers.set(++timerId,fn);return timerId;},clearTimeout(id){timers.delete(id);}});
  const dish=id=>el.dishes.children.find(n=>n.dataset.dish===id);
  const shareAll=()=>dishes.forEach(d=>{dish(d.id).fire('click');el['shared-table'].fire('click');});
  const cup=id=>el['tea-cups'].children.find(n=>n.dataset.cup===id);
  cups.forEach((id,index)=>{const x=index*110;cup(id).rect={left:x,top:10,right:x+90,bottom:100,width:90,height:90};});
  const finishPour=()=>{for(const [id,fn] of [...timers]){timers.delete(id);fn();}};
  const fillAll=()=>cups.forEach(id=>{el['teapot-control'].fire('click');cup(id).fire('click');finishPour();});
  const readStory=()=>{el.continue.fire('click');fillAll();el.continue.fire('click');};
  return {el,document,window,game,dish,cup,shareAll,finishPour,fillAll,readStory,timers};
}
const down={isPrimary:true,button:0,pointerId:1,clientX:200,clientY:200};
const flush=()=>new Promise(resolve=>setImmediate(resolve));
test('matching transparent 3D-style assets are used before, during, and after sharing',()=>{
  const html=fs.readFileSync(__dirname+'/index.html','utf8');
  assert.match(html,/id="table-surface" src="assets\/lazy-susan\.png"/);
  assert.match(html,/id="teapot" src="assets\/teapot-3d\.png"/);
  assert.match(html,/dimsum\.css\?v=8/);assert.match(html,/game\.js\?v=5/);assert.match(html,/dimsum\.js\?v=8/);
  for (const asset of [...dishes.map(d=>d.asset),'teapot-3d.png','tea-cup-3d.png','lazy-susan.png']) {
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
test('buttons and their accessible names are English-only; Chinese story text remains',async()=>{
  const html=fs.readFileSync(__dirname+'/index.html','utf8');
  for (const button of html.matchAll(/<button\b[^>]*>[\s\S]*?<\/button>/g)) assert.doesNotMatch(button[0],/[\u3400-\u9fff]/);
  assert.match(html,/<button id="continue">Next<\/button>/);
  assert.match(html,/<button id="back" class="secondary">Back<\/button>/);
  const h=harness();h.el.arrive.fire('click');
  for (const d of dishes) assert.equal(h.dish(d.id).attributes['aria-label'],d.en+': select to share');
  await flush();assert.equal(h.el['enable-camera'].textContent,'Try camera again');
  h.readStory();assert.equal(h.el['enable-camera'].textContent,'Enable camera');
  assert.equal(h.el.next.textContent,'Next');
  h.el.next.fire('click');assert.equal(h.el.next.textContent,'Next');assert.match(h.el.page.innerHTML,/你刚刚把点心摆上桌/);
  h.el.next.fire('click');assert.equal(h.el.next.textContent,'Replay');assert.match(h.el.page.innerHTML,/和别人在中国城一起吃饭时/);
  const k=harness({getUserMedia:async()=>({getTracks:()=>[{stop(){}}]})});
  k.el.arrive.fire('click');await flush();assert.equal(k.el['enable-camera'].textContent,'Camera off');
  k.el['enable-camera'].fire('click');assert.equal(k.el['enable-camera'].textContent,'Enable camera');
});
test('larger responsive table and smaller cups retain the table perspective and touch controls',()=>{
  const css=fs.readFileSync(__dirname+'/dimsum.css','utf8');
  assert.match(css,/#board\.tea-stage\{[^}]*width:min\(100vw,100svh,840px\)/);
  assert.match(css,/#board\.tea-stage #table-setting\{[^}]*width:108%/);
  assert.match(css,/\.tea-cup\{[^}]*width:15%;min-height:44px/);
  assert.match(css,/#table-setting\{[^}]*aspect-ratio:3\/2/);
  assert.match(css,/#experience\{[^}]*overflow-x:clip/);
  assert.doesNotMatch(fs.readFileSync(__dirname+'/index.html','utf8'),/Tap to continue/);
});
test('table image is included in loading readiness, but Continue remains optional',()=>{
  const h=harness(undefined,false);h.el.arrive.fire('click');
  assert.equal(h.dish('har-gow').disabled,true);assert.equal(h.el.continue.hidden,false);
  h.el['table-surface'].complete=true;h.el['table-surface'].fire('load');
  assert.equal(h.dish('har-gow').disabled,false);
  h.el.continue.fire('click');assert.equal(h.game.state.phase,'tea');
});
test('early Continue retains all dishes and waits safely for cup images before enabling tea',()=>{
  const h=harness(undefined,true,false);h.el.arrive.fire('click');h.el.continue.fire('click');
  assert.equal(h.game.state.phase,'tea');assert.equal(h.el['shared-dishes'].children.length,4);
  assert.equal(h.el['teapot-control'].disabled,true);assert.equal(h.el.continue.hidden,true);
  assert.equal(h.el['tea-message'].textContent,'Preparing the tea cups…');
  cups.forEach(id=>{const img=h.cup(id).querySelector('img');img.complete=true;img.fire('load');});
  assert.equal(h.el['teapot-control'].disabled,false);
  assert.equal(h.el['tea-message'].textContent,'Drag the teapot to fill each cup.');
  h.fillAll();assert.equal(h.el['tea-message'].textContent,'Enjoy your meal!');
});
test('controller: tap to share, completion, clean story screens, EN/ZH/reflection, Back, Replay',()=>{
  const h=harness();h.el.arrive.fire('click');h.shareAll();
  assert.equal(h.game.state.phase,'ready');assert.equal(h.el.continue.hidden,false);
  assert.equal(h.el['shared-dishes'].children.length,4);
  h.readStory();assert.equal(h.el.experience.hidden,true);assert.equal(h.el['camera-controls'].hidden,true);assert.equal(h.el.camera.hidden,true);
  assert.equal(h.el.reading.hidden,false);assert.match(h.el.page.innerHTML,/You just placed dim sum dishes on the table to share\./);
  h.el.back.fire('click');assert.equal(h.game.state.phase,'served');assert.equal(h.el['shared-dishes'].children.length,4);
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
  const h=harness();h.el.arrive.fire('click');h.readStory();
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
    h.el.continue.fire('click');assert.equal(h.game.state.phase,'tea');assert.equal(h.el.experience.hidden,false);
    assert.equal(h.el.continue.hidden,true);h.fillAll();h.el.continue.fire('click');
    h.el.back.fire('click');assert.equal(h.game.state.phase,'served');assert.equal(h.el.continue.hidden,false);
    assert.equal(h.el['shared-dishes'].children.length,4);
    assert.equal(new Set(h.el['shared-dishes'].children.map(img=>img.src)).size,4);
    assert.equal(h.dish(dishes[count].id).disabled,true);
  }
});
test('controller: table/dishes stay, three cups appear, Continue waits for all pours to finish',()=>{
  const h=harness();h.el.arrive.fire('click');h.shareAll();
  const table=h.el['table-surface'], placed=[...h.el['shared-dishes'].children];
  h.el.continue.fire('click');
  assert.equal(h.el.experience.hidden,false);assert.equal(h.el.reading.hidden,true);
  assert.equal(h.el['table-surface'],table);assert.deepEqual(h.el['shared-dishes'].children,placed);
  assert.equal(h.el['tea-cups'].children.length,3);assert.equal(h.el['tea-cups'].hidden,false);
  assert.equal(h.el.continue.hidden,true);assert.equal(h.el.dishes.hidden,true);
  h.cup('left').fire('click');assert.equal(h.game.state.phase,'tea'); // no teapot selected
  h.el['teapot-control'].fire('click');h.cup('left').fire('click');
  assert.equal(h.game.state.phase,'pouring');assert.equal(h.el['teapot-control'].disabled,true);
  assert.equal(h.cup('left').classList.contains('pouring'),true);
  assert.equal(h.cup('left').classList.contains('filled'),false);
  assert.equal(h.el['teapot-control'].classList.contains('pouring'),true);
  assert.equal(h.document.body.children.at(-1).className,'tea-pour-effect');
  h.el.continue.fire('click');assert.equal(h.game.state.phase,'pouring'); // double Continue cannot skip tea
  h.cup('right').fire('click');assert.equal(h.timers.size,1);
  h.finishPour();assert.equal(h.game.state.phase,'tea');assert.equal(h.cup('left').disabled,true);
  assert.equal(h.cup('left').classList.contains('filled'),true);assert.equal(h.el.continue.hidden,true);
  h.el['teapot-control'].fire('click');h.cup('right').fire('click');h.finishPour();
  assert.equal(h.el.continue.hidden,true);
  h.el['teapot-control'].fire('click');h.cup('front').fire('click');
  assert.equal(h.el.continue.hidden,true);h.finishPour();
  assert.equal(h.game.state.phase,'served');assert.equal(h.el['tea-message'].textContent,'Enjoy your meal!');
  assert.equal(h.el.continue.hidden,false);assert.equal(h.el.continue.focused,true);
  assert.deepEqual(h.el['shared-dishes'].children,placed);
  cups.forEach((id,index)=>assert.equal(h.cup(id).attributes['aria-label'],`Tea cup ${index+1}: filled`));
  h.el.continue.fire('click');assert.equal(h.game.state.phase,'story');
  assert.equal(h.el.experience.hidden,true);assert.equal(h.el.camera.hidden,true);
  assert.equal(h.document.body.children.at(-1).removed,true);
});
test('controller: teapot drag/drop, outside/full-cup drops, cancellation and lost capture',()=>{
  const h=harness();h.el.arrive.fire('click');h.el.continue.fire('click');
  const pot=h.el['teapot-control'], onCup={...down,clientX:45,clientY:38};
  pot.fire('pointerdown',down);pot.fire('pointermove',onCup);
  assert.equal(pot.classList.contains('dragging'),true);
  assert.equal(h.cup('left').classList.contains('drop-target'),true);
  assert.equal(h.document.body.children.at(-1).src,'assets/teapot-3d.png');
  pot.fire('pointercancel',down);assert.equal(pot.classList.contains('dragging'),false);
  assert.equal(h.cup('left').classList.contains('drop-target'),false);
  pot.fire('pointerdown',down);pot.fire('pointermove',onCup);pot.fire('lostpointercapture',down);
  assert.equal(pot.classList.contains('dragging'),false);
  pot.fire('pointerdown',down);pot.fire('pointermove',{...down,clientX:400,clientY:400});pot.fire('pointerup',{...down,clientX:400,clientY:400});
  assert.equal(h.game.state.phase,'tea');assert.equal(h.timers.size,0);
  pot.fire('pointerdown',down);pot.fire('pointermove',onCup);pot.fire('pointerup',onCup);
  assert.equal(h.game.state.phase,'pouring');assert.equal(pot.classList.contains('dragging'),false);
  h.finishPour();assert.deepEqual(h.game.state.filled,['left']);
  pot.fire('pointerdown',down);pot.fire('pointermove',onCup);pot.fire('pointerup',onCup);
  assert.equal(h.game.state.phase,'tea');assert.equal(h.timers.size,0);assert.deepEqual(h.game.state.filled,['left']);
});
test('controller: smaller cup keeps a forgiving drop area around its opening',()=>{
  const h=harness();h.el.arrive.fire('click');h.el.continue.fire('click');
  h.cup('left').rect={left:20,top:20,right:72,bottom:72,width:52,height:52};
  const pot=h.el['teapot-control'], nearRim={...down,clientX:16,clientY:17};
  pot.fire('pointerdown',down);pot.fire('pointermove',nearRim);pot.fire('pointerup',nearRim);
  assert.equal(h.game.state.phase,'pouring');assert.equal(h.game.state.pouring,'left');
  h.finishPour();assert.deepEqual(h.game.state.filled,['left']);
});
test('controller: leaving or resizing during a pour clears animation/timer without filling a cup',()=>{
  for(const action of ['blur','resize','pagehide','visibilitychange']) {
    const h=harness();h.el.arrive.fire('click');h.el.continue.fire('click');
    h.el['teapot-control'].fire('click');h.cup('right').fire('click');
    if(action==='visibilitychange'){h.document.hidden=true;h.document.fire(action);}else h.window.fire(action);
    assert.equal(h.game.state.phase,'tea');assert.equal(h.timers.size,0);assert.deepEqual(h.game.state.filled,[]);
    assert.equal(h.cup('right').classList.contains('pouring'),false);
    assert.equal(h.el['teapot-control'].classList.contains('pouring'),false);
    assert.equal(h.document.body.children.at(-1).removed,true);
    h.finishPour();assert.equal(h.game.state.phase,'tea');
    h.document.hidden=false;h.el['teapot-control'].fire('click');h.cup('right').fire('click');h.finishPour();
    assert.deepEqual(h.game.state.filled,['right']);
  }
});
test('controller: reduced-motion pour completes and Replay clears the cups as well as dishes',()=>{
  const h=harness();h.window.matchMedia=()=>({matches:true});
  h.el.arrive.fire('click');h.shareAll();h.readStory();
  h.el.next.fire('click');h.el.next.fire('click');h.el.next.fire('click');
  assert.equal(h.game.state.phase,'sharing');assert.deepEqual(h.game.state.filled,[]);
  assert.equal(h.el['tea-cups'].hidden,true);assert.equal(h.el['tea-message'].hidden,true);
  assert.equal(h.el.dishes.hidden,false);assert.equal(h.el['shared-dishes'].children.length,0);
  cups.forEach(id=>assert.equal(h.cup(id).classList.contains('filled'),false));
});
test('dish-sharing view remains word-free; tea instruction only appears after Continue',()=>{
  const html=fs.readFileSync(__dirname+'/index.html','utf8');
  const scene=html.slice(html.indexOf('<section id="experience"'),html.indexOf('<aside id="camera-controls"'));
  assert.doesNotMatch(scene,/<header|<h1|id="(?:counter|instruction|instruction-zh|tap-hint|table-hint)"/);
  assert.match(scene,/id="continue"/);assert.match(scene,/class="sr-only" role="status"/);
  const h=harness();dishes.forEach(d=>assert.doesNotMatch(h.dish(d.id).innerHTML,/dish-label|<span/));
  h.el.arrive.fire('click');assert.equal(h.el['tea-message'].hidden,true);
  assert.equal(h.el['tea-cups'].hidden,true);
  h.el.continue.fire('click');assert.equal(h.el['tea-message'].hidden,false);
  assert.equal(h.el['tea-message'].textContent,'Drag the teapot to fill each cup.');
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
  h.el.arrive.fire('click');h.shareAll();h.readStory();
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
