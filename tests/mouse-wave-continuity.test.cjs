const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
function simulate(src){
 const context={W:1280,H:800,manualMelt:null,scrollY:0,motionSettings:{speed:1.633,sway:1,wave:1.0125,smoothing:0},material:{options:{intensity:1},noise:()=>0},document:{querySelector:()=>({getBoundingClientRect:()=>({left:100,right:430,top:120,bottom:350})})},smooth:(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);}};
 vm.runInNewContext(src.slice(src.indexOf('  const AMBIENT_N='),src.indexOf('  function ambientAt('))+';this.reset=resetAmbient;this.emit=emitMouseWave;this.step=advanceAmbient;this.snapshot=()=>({x:Array.from(mouseWaveX),y:Array.from(mouseWaveY),active:mouseWaves.filter(w=>w.retired===undefined).length,total:mouseWaves.length});',context);
 context.reset();let previous=context.snapshot(),maxJump=0,maxActive=0,maxTotal=0;
 for(let frame=0;frame<600;frame++){
  if(frame<360&&frame%10===0){const side=(frame/10)%2;context.emit(side?900:450,side?620:220,side?60:-60,side?50:-50);}
  context.step(1/60);const next=context.snapshot();
  for(let i=0;i<next.x.length;i++)maxJump=Math.max(maxJump,Math.hypot(next.x[i]-previous.x[i],next.y[i]-previous.y[i]));
  maxActive=Math.max(maxActive,next.active);maxTotal=Math.max(maxTotal,next.total);previous=next;
 }
 return {maxJump,maxActive,maxTotal};
}
const src=fs.readFileSync(path.join(__dirname,'../scene.js'),'utf8'),current=simulate(src);
assert(current.maxActive<=5);assert(current.maxTotal<=8);assert(current.maxJump<2,'Displacement must not jump during rapid cross-screen input');
module.exports={simulate,...current,result:'PASS'};
