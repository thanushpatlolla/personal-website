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
module.exports={checks,result:'PASS'};
