const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),Field=require('../melt-field.js');
const src=fs.readFileSync(require('node:path').join(__dirname,'../scene.js'),'utf8');
let checks=0;
for(const [W,H] of [[390,844],[1037,974],[1280,800],[1920,1080]]){
 const material=new Field();material.resize(W,H);
 const Feel=require('../melt-feel.js'),feel=new Feel();feel.resize(W,H,(H-1650*Math.max(W/2200,H/1650))/2,1650*Math.max(W/2200,H/1650),{left:W*.09,top:125,width:330,height:250});
 const context={W,H,material,feel,mountainSettings:{sideways:.897,vertical:.483,curlX:.01632,curlY:.00856,stretch:.1575},photo:{naturalWidth:2200,naturalHeight:1650},smooth:(a,b,x)=>{let t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t)}};
 vm.runInNewContext('let baseMap=null;'+src.slice(src.indexOf('  function prepareBase('),src.indexOf('  function flow('))+';this.sample=(m)=>{prepareBase(m);return baseMap;}',context);
 for(const m of [0,.5,1]){
  const b=context.sample(m);
  const point=(x,y)=>{const i=(y*(b.nx+1)+x)*2;return [x*W/b.nx+b.data[i],y*H/b.ny+b.data[i+1]]};
  const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
  for(let y=0;y<b.ny;y++)for(let x=0;x<b.nx;x++){
   const a=point(x,y),c=point(x+1,y),d=point(x,y+1),e=point(x+1,y+1);
   assert(cross(a,c,d)>0&&cross(c,e,d)>0,'Protected terrain must not fold');
  }
  checks++;
 }
}
module.exports={checks,result:'PASS'};
if(require.main===module)console.log(module.exports);
