const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const src=fs.readFileSync(require('node:path').join(__dirname,'../scene.js'),'utf8');
const release=src.slice(src.indexOf('  function release(event)'),src.indexOf('  function pointerAngle'));
function scenario(event,gesture={startedClear:true,moved:false,startedAt:0}){
 const c={holding:true,keyWinding:false,clockGesture:gesture,gestureTurned:false,performance:{now:()=>100},windingGain:1.5,windingOffset:0,paused:false,handTime:0,localClockSeconds:()=>100,clockHintDismissed:false,windHint:{style:{}},angle:0,gestureCenter:{},charge:1,energy:1,meltEnabled:false,note:{},activations:0,refreshTimeControl:()=>{}};
 c.beginMelting=()=>{c.meltEnabled=true;c.activations++;};vm.createContext(c);vm.runInContext(release,c);c.release({type:event});return c;
}
const click=scenario('pointerup');assert.equal(click.activations,1);assert.equal(click.meltEnabled,true);
click.release({type:'lostpointercapture'});assert.equal(click.meltEnabled,true);assert.equal(click.activations,1);
assert.equal(scenario('pointercancel').activations,0);
assert.equal(scenario('pointerup',{startedClear:true,moved:true,startedAt:0}).activations,0);
assert.equal(scenario('pointerup',{startedClear:false,moved:false,startedAt:0}).activations,0);
module.exports={checks:5,result:'PASS'};
