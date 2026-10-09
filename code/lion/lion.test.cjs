const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
function target() {
  const events = {};
  return {hidden:false,disabled:false,style:{},value:0,complete:true,naturalWidth:1440,
    classList:{add(){},remove(){}},focus(){},setPointerCapture(){},
    addEventListener(n,f){(events[n] ||= []).push(f)},
    fire(n,e={}){for(const f of events[n]||[]) f({preventDefault(){},...e})}};
}
const ids=['arrival','arrive','fireworks','camera','experience','stage','lion','lion-two','status','progress','hold','camera-fallback','enable-camera','camera-status','reading','page','back','next'];
const el=Object.fromEntries(ids.map(id=>[id,target()]));
el.reading.hidden=true;
el.experience.hidden=true;
const doc=target(),win=target();doc.getElementById=id=>el[id];doc.hidden=false;
let clock=0,serial=0; const queue=new Map();
vm.runInNewContext(fs.readFileSync(__dirname+'/lion.js','utf8'),{
  document:doc,window:win,navigator:{},matchMedia:()=>({matches:false}),
  requestAnimationFrame:f=>{queue.set(++serial,f);return serial},cancelAnimationFrame:id=>queue.delete(id)
});
function advance(ms){for(let i=0;i<ms;i+=20){clock+=20;const batch=[...queue.values()];queue.clear();batch.forEach(f=>f(clock));}}
const down={isPrimary:true,button:0,pointerId:1};
assert.equal(el.hold.disabled,false);
el.hold.fire('pointerdown',down);advance(1000);assert.equal(el.progress.value,0);
assert.equal(el.camera.srcObject,null);
el.arrive.fire('click');assert.equal(el.arrival.hidden,true);assert.equal(el.experience.hidden,false);
el.hold.fire('pointerdown',down);advance(1020);
assert.equal(el.progress.value,1000);
assert.match(el.lion.style.transform,/translate\(-1%, -3%\) rotate\(4deg\)/);
const heldPose = el.lion.style.transform;
assert.match(el.fireworks.innerHTML,/<circle/);
const heldFireworks = el.fireworks.innerHTML;
const secondHeldPose = el['lion-two'].style.transform;
assert.notEqual(heldPose,secondHeldPose);
el.hold.fire('pointerup');advance(1000);assert.equal(el.progress.value,1000);
assert.equal(el.lion.style.transform,heldPose);
assert.equal(el.fireworks.innerHTML,heldFireworks);
assert.equal(el['lion-two'].style.transform,secondHeldPose);
el.hold.fire('pointerdown',down);advance(520);el.hold.fire('pointercancel');
assert.equal(el.progress.value,1500);
el.hold.fire('pointerdown',down);advance(520);win.fire('blur');const paused=el.progress.value;advance(1000);assert.equal(el.progress.value,paused);
el.hold.fire('pointerdown',down);advance(9000);assert.equal(el.progress.value,8000);assert.equal(el.reading.hidden,false);
assert.match(el.page.innerHTML,/You just engaged/);
assert.equal(el.lion.style.transform,'translate(0%, 0%) rotate(0deg) scaleY(1)');
el.next.fire('click');assert.equal(el.page.lang,'zh-Hans');assert.match(el.page.innerHTML,/每逢春节/);
el.next.fire('click');assert.match(el.page.innerHTML,/Have you ever joined or watched a cultural celebration\?/);assert.match(el.page.innerHTML,/你有没有参加或观看过文化节庆活动/);
assert.doesNotMatch(el.page.innerHTML,/No answer is recorded|此页面不会记录/);
el.back.fire('click');assert.equal(el.page.lang,'zh-Hans');el.next.fire('click');el.next.fire('click');
assert.equal(el.progress.value,0);assert.equal(el.reading.hidden,true);
el.hold.fire('keydown',{key:' ',repeat:false});advance(520);el.hold.fire('keyup',{key:' '});assert.equal(el.progress.value,500);
advance(500);assert.equal(el.progress.value,500);
assert.equal(el['camera-fallback'].hidden,false);
console.log('PASS: hold/release, resume, cancel, blur, automatic story transition, EN → ZH → question, back, replay, keyboard, camera fallback');
