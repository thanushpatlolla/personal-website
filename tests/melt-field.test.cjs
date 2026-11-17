/* Run with node tests/melt-field.test.cjs. Pure geometry; no browser dependencies. */
const assert=require('node:assert/strict');
const MeltField=require('../melt-field.js');
const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
let checks=0,minArea=Infinity;
for(const [width,height] of [[390,844],[1280,800],[1920,1080]]){
  for(const options of [{},{intensity:1.5,gravity:1.6,scale:.65,detail:1,noiseFrequency:4},{intensity:1.5,scale:1.7,direction:60,anchoring:0}]){
    const field=new MeltField(options);field.resize(width,height);
    for(const progress of [0,.25,.5,.75,1]){
      const nx=48,ny=48,points=[];
      for(let y=0;y<=ny;y++)for(let x=0;x<=nx;x++){
        const px=x*width/nx,py=y*height/ny,p=field.map(px,py,progress);
        assert.ok(p.every(Number.isFinite));
        assert.deepEqual(p,field.map(px,py,progress),'Same progress must reproduce exactly');
        if(progress===0)assert.deepEqual(p,[px,py,1],'Zero must be exactly original');
        if(x===0||y===0||x===nx||y===ny){assert.ok(Math.abs(p[0]-px)<1e-8&&Math.abs(p[1]-py)<1e-8,'Image perimeter stays fixed');}
        points.push(p);
      }
      for(let y=0;y<ny;y++)for(let x=0;x<nx;x++){
        const i=y*(nx+1)+x,a=points[i],b=points[i+1],c=points[i+nx+1],d=points[i+nx+2];
        const area=Math.min(cross(a,b,c),cross(b,d,c))/(width/nx*height/ny);
        minArea=Math.min(minArea,area);assert.ok(area>.005,`No folded-over triangles: ${JSON.stringify({width,height,options,progress,x,y,area})}`);
      }
      checks++;
    }
  }
}
const field=new MeltField();field.resize(1280,800);
const before=field.map(450,350,.7);field.map(450,350,1);field.map(450,350,0);
assert.deepEqual(field.map(450,350,.7),before,'Scrubbing must not accumulate drift');
field.configure({intensity:Infinity,gravity:NaN,scale:-20});
assert.equal(field.options.intensity,1);assert.equal(field.options.gravity,1);assert.equal(field.options.scale,.65);
assert.throws(()=>field.setRegions({anchors:[[.5,.5,0,.1,1]]}),TypeError);
field.setRegions({zones:[],anchors:[]});field.configure({detail:0});assert.deepEqual(field.map(500,300,1),[500,300,1]);
const result={checks,minNormalizedTriangleArea:Number(minArea.toFixed(4)),result:'PASS'};
module.exports=result;

// Exercise the actual clock mapper too: tilted plane + softened rim + anchored spindle.
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const scene=fs.readFileSync(path.join(__dirname,'../scene.js'),'utf8');
const watchCode=scene.slice(scene.indexOf('  function watchPoint('),scene.indexOf('  function createGrid('));
for(const clockStyle of ['original','warm','ridge'])for(const [width,height,size] of [[1280,800,262.5],[390,844,162]]){
  const material=new MeltField();material.resize(width,height);
  const context={material,clockStyle,clockBox:{x:width*.62,y:height*.1,size},turn:0,recoil:0,centerCache:null,
    flow:(x,y,m)=>material.map(x,y,m),
    gauss:(x,c,w)=>Math.exp(-(((x-c)/w)**2)),
    smooth:(a,b,x)=>{const t=Math.min(1,Math.max(0,(x-a)/(b-a)));return t*t*(3-2*t);}};
  vm.runInNewContext(watchCode+'\nglobalThis.mapWatch=watchPoint;',context);
  for(const m of [0,.5,1]){
    context.centerCache=null;
    for(let y=0;y<40;y++)for(let x=0;x<40;x++){
      const a=context.mapWatch(x/40,y/40,m),b=context.mapWatch((x+1)/40,y/40,m),c=context.mapWatch(x/40,(y+1)/40,m),d=context.mapWatch((x+1)/40,(y+1)/40,m);
      assert.ok(cross(a,b,c)>0&&cross(b,d,c)>0,'Clock geometry must retain its orientation');
    }
  }
}
result.clockChecks=18;



// Copy-area protection keeps the nominal 16px text from inflating excessively.
let maxTextStretch=0;
for(const [w,h,left,top,right,bottom] of [[1280,800,152,125,482,370],[390,844,32,237,358,500]]){
  const f=new MeltField();f.resize(w,h);
  f.setMasks([[(left-12)/w,(top-12)/h,(right+12)/w,(bottom+12)/h,.82,65/w,65/h]]);
  for(let y=top;y<top+120;y+=12)for(let x=left;x<right;x+=18){
    const p=f.map(x,y,1),px=f.map(x+1,y,1),py=f.map(x,y+1,1);
    const a=px[0]-p[0],b=py[0]-p[0],c=px[1]-p[1],d=py[1]-p[1];
    const trace=a*a+b*b+c*c+d*d,det=(a*d-b*c)**2;
    const stretch=Math.sqrt((trace+Math.sqrt(Math.max(0,trace*trace-4*det)))/2);
    maxTextStretch=Math.max(maxTextStretch,stretch);assert.ok(stretch<3.5,'Local letter stretching must remain bounded');
    assert.ok(Math.hypot(b,d)<3.2,'Localized stretching must stay bounded');
    assert.ok(a*d-b*c>0,'Protected regions must not fold');
  }
}
result.maxTextStretch=Number(maxTextStretch.toFixed(4));
if(require.main===module)console.log(JSON.stringify(result));
