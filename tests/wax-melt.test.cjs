const assert=require('node:assert/strict'),Feel=require('../melt-feel.js');
let checks=0,maxStretch=0;
for(const [w,h] of [[390,844],[1280,800],[1920,1080]]){
 const f=new Feel();f.resize(w,h,0,h,{left:w*.09,top:125,width:330,height:250});
 for(const kind of ['text','landscape'])for(let y=40;y<h-40;y+=15)for(let x=40;x<w-40;x+=19){
  let last=0;
  for(const m of [0,.2,.4,.6,.8,1]){
   const p=f.displacement(x,y,80,-80,m,kind);assert(p[1]>=last-1e-8,'Melt should settle downward monotonically');last=p[1];
   const q=f.displacement(x,y+1,80,-80,m,kind);maxStretch=Math.max(maxStretch,1+q[1]-p[1]);
   assert(Math.abs(q[1]-p[1])<(kind==='text'?.75:.3),'Melt must remain smooth and avoid vertical folds');
  }
 }
 checks++;
}
module.exports={checks,maxStretch,result:'PASS'};
