const assert=require('node:assert/strict'),Depth=require('../depth-field.js');
let checks=0;
for(const [w,h] of [[390,844],[1280,800],[1920,1080]]){
 const d=new Depth();d.resize(w,h,2200,1650);
 for(let y=0;y<h;y+=17)for(let x=0;x<w;x+=19){const a=d.weights(x,y);assert(a.every(v=>v>=0&&v<=1));assert(Math.abs(a.reduce((s,v)=>s+v,0)-1)<1e-10);}
 assert.deepEqual(d.weights(w/2,h/2,'text'),[1,0,0,0,0]);checks++;
 d.emit(w/2,h/2,1);const wave=d.waves[0];
 d.time=.5;assert.deepEqual(d.pulse(wave,w/2,h/2,2),[0,0]);assert.notDeepEqual(d.pulse(wave,w/2,h/2,1),[0,0]);
 d.time=1.2;assert.notDeepEqual(d.pulse(wave,w/2,h/2,2),[0,0]);assert.deepEqual(d.pulse(wave,w/2,h/2,3),[0,0]);checks+=3;
 d.advance(20);assert.equal(d.waves.length,0);assert.deepEqual(d.sample(w/2,h/2),[0,0]);checks++;
}
// Crossing ridges/text positions cannot select a different cursor surface.
const ramp=new Depth();ramp.resize(1280,800,2200,1650);
let previous=4;
for(let y=0;y<800;y++){
 const z=ramp.cursorDepth(640,y);assert(z<=previous+1e-9);assert(Math.abs(z-previous)<.01);previous=z;
 assert.equal(z,ramp.cursorDepth(120,y));
 for(let layer=0;layer<5;layer++){
  const a=ramp.cursorInfluence(640,500,layer===0?'text':'landscape',z);
  const b=ramp.cursorInfluence(640,500,layer===0?'text':'landscape',z+.001);
  assert(Math.abs(a-b)<.002);
 }
}
checks++;
module.exports={checks,result:'PASS'};
