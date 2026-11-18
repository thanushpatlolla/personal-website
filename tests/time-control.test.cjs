const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const src=fs.readFileSync(require('node:path').join(__dirname,'../scene.js'),'utf8');
const fn=src.slice(src.indexOf('  function toggleTime()'),src.indexOf("  still.addEventListener('click',toggleTime)"));
for(const [paused,meltEnabled,melt,expected] of [[false,false,0,'melt'],[true,false,0,'melt'],[true,false,.5,'melt'],[false,true,.8,'pause'],[false,false,1,'pause']]){
 let action;const c={paused,meltEnabled,initialMelt:true,currentMelt:()=>melt,document:{dispatchEvent(){}},Event:class{},beginMelting:()=>{action='melt';},setPaused:v=>{assert(v);action='pause';}};
 vm.runInNewContext(fn,c);c.toggleTime();assert.equal(action,expected);
}
module.exports={checks:5,result:'PASS'};
