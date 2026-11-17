/* Texture-independent, deterministic geometry field. No clock or DOM dependency. */
(() => {
  'use strict';
  const defaults=Object.freeze({intensity:1,scale:1,gravity:1,direction:0,anchoring:.72,noiseFrequency:2.1,detail:.28,viscosity:.17,damping:6.3216,drag:10});
  const limits={intensity:[0,1.5],scale:[.65,1.7],gravity:[0,1.6],direction:[-60,60],anchoring:[0,1],noiseFrequency:[.5,4],detail:[0,1],viscosity:[.05,.23],damping:[2,12],drag:[0,20]};
  // Local forward pulls and local volume changes. Coordinates/radii are normalized.
  const zones=[
    [.19,.25,.14,.16,-11,35,.12], [.36,.39,.13,.19,19,57,-.12],
    [.10,.61,.13,.18,23,78,.13], [.51,.54,.18,.14,-20,48,-.10],
    [.76,.63,.17,.21,28,103,.14], [.34,.83,.12,.16,-21,62,-.12],
    [.88,.88,.14,.14,-15,72,.10],
    [.28,.20,.10,.12,5,7,.05], [.67,.28,.13,.11,-6,9,-.04],
    [.44,.65,.10,.13,7,10,.06], [.81,.49,.12,.12,-6,11,-.05],
    [.18,.79,.09,.12,5,9,.05]
  ];
  const anchors=[[.56,.40,.13,.10,.85],[.16,.13,.11,.07,.65],[.92,.38,.08,.12,.70]];
  const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
  const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
  const fade=x=>x*x*x*(x*(x*6-15)+10);
  class MeltField {
    constructor(options={}){
      this.options={...defaults};this.width=1;this.height=1;
      this.zones=zones.map(a=>a.slice());this.anchors=anchors.map(a=>a.slice());this.masks=[];
      let seed=0x55a1c;
      this.lattice=Float32Array.from({length:16384},()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2147483648-1;});
      this.scratch=[new Float64Array(2),new Float64Array(2),new Float64Array(2)];
      this.configure(options);
    }
    configure(values={}){
      for(const [key,[lo,hi]] of Object.entries(limits)){
        const value=Number(values[key]);if(values[key]!==undefined&&Number.isFinite(value))this.options[key]=clamp(value,lo,hi);
      }
      this.rebuild();return {...this.options};
    }
    resize(width,height){this.width=Math.max(1,width);this.height=Math.max(1,height);this.rebuild();}
    setRegions({zones:pulls=this.zones,anchors:fixed=this.anchors}={}){
      const valid=(row,size)=>Array.isArray(row)&&row.length===size&&row.every(Number.isFinite)&&row[2]>0&&row[3]>0;
      if(!pulls.every(r=>valid(r,7))||!fixed.every(r=>valid(r,5)))throw new TypeError('Regions need finite normalized coordinates and positive radii.');
      this.zones=pulls.map(r=>r.slice());this.anchors=fixed.map(r=>r.slice());this.rebuild();
    }
    setMasks(masks=[]){
      if(!Array.isArray(masks)||!masks.every(r=>Array.isArray(r)&&r.length===7&&r.every(Number.isFinite)&&r[2]>r[0]&&r[3]>r[1]&&r[4]>=0&&r[4]<=1&&r[5]>0&&r[6]>0))throw new TypeError('Masks need [left,top,right,bottom,strength,featherX,featherY].');
      this.masks=masks.map(r=>r.slice());this.rebuild();
    }
    noise(x,y){
      const ix=Math.floor(x),iy=Math.floor(y),fx=fade(x-ix),fy=fade(y-iy),a=this.lattice;
      const p=a[(iy&127)*128+(ix&127)],q=a[(iy&127)*128+((ix+1)&127)];
      const r=a[((iy+1)&127)*128+(ix&127)],s=a[((iy+1)&127)*128+((ix+1)&127)];
      return (p+(q-p)*fx)*(1-fy)+(r+(s-r)*fx)*fy;
    }
    raw(u,v){
      const o=this.options,unit=Math.min(this.width,this.height),scale=clamp(unit/800,.55,1.35);
      let dx=0,dy=0;
      for(const [cx,cy,rx,ry,sx,sy,volume] of this.zones){
        const xx=(u-cx)/(rx*o.scale),yy=(v-cy)/(ry*o.scale);
        const weight=Math.exp(-xx*xx-yy*yy);
        dx+=(sx+(u-cx)*unit*volume)*weight;
        dy+=(sy*o.gravity+(v-cy)*unit*volume)*weight;
      }
      // Broad correlated material variation, with a much quieter second octave.
      // The field has no time input: identical settings/progress give identical geometry.
      const f=o.noiseFrequency/o.scale;
      const broad=this.noise(u*f+13.6,v*f+41.2);
      const fine=this.noise(u*f*3.2+61.7,v*f*3.2+8.3);
      dx+=o.detail*(13*broad+2.5*fine);
      dy+=o.detail*(15*this.noise(u*f+28.7,v*f+2.3)+3*fine);
      let fixed=0;
      for(const [cx,cy,rx,ry,strength] of this.anchors)fixed=Math.max(fixed,strength*Math.exp(-(((u-cx)/rx)**2+((v-cy)/ry)**2)));
      // Keep the high sky quiet; feather all boundaries and all rigid islands.
      let protection=1,textX=0,textY=0;
      for(const [left,top,right,bottom,strength,fx,fy] of this.masks){
        const weight=smooth(left-fx,left,u)*(1-smooth(right,right+fx,u))*smooth(top-fy,top,v)*(1-smooth(bottom,bottom+fy,v));
        protection*=1-strength*weight;
        // A shallow curved baseline and shear preserve glyph height/width.
        // These pulls vary across the block, not separately for each word.
        const q=(u-left)/(right-left);let r=(v-top)/(bottom-top);
        textX+=weight*3*(r-.5);
        const copyArea=top<.6&&(right-left)*this.width>280;
        if(copyArea){
          r=1-r; // Put compressed patches above, looser areas below.
          // Isolated soft patches: different lines stretch differently. Fade to
          // zero at block edges so the enclosing text footprint stays stable.
          const edge=2.0*smooth(0,.12,q)*(1-smooth(.88,1,q))*smooth(0,.12,r)*(1-smooth(.88,1,r));
          const patch=(cx,cy,rx,ry)=>Math.exp(-(((q-cx)/rx)**2+((r-cy)/ry)**2));
          // Opposing pulls on the left: upward/outward against the main sag.
          textX-=weight*edge*(22*patch(.16,.52,.13,.30)+10*patch(.22,.82,.15,.16));
          textY-=weight*edge*22*patch(.18,.55,.16,.25)*o.gravity;
          textY+=weight*edge*12*patch(.47,.46,.15,.15)*o.gravity;
          textX+=weight*edge*1.35*(19*patch(.30,.22,.15,.19)-16*patch(.70,.64,.16,.23));
          textX+=weight*edge*1.35*12*patch(.40,.84,.18,.12);
          textX+=weight*edge*1.35*(8*patch(.77,.25,.13,.13)-7*patch(.22,.53,.12,.15));
          textY+=weight*edge*1.35*(10*patch(.76,.30,.14,.13)+9*patch(.25,.55,.14,.13)-7*patch(.76,.86,.12,.10))*o.gravity;
          // Correlated, nonperiodic waves vary by line as well as column.
          textX+=weight*edge*11*this.noise(q*4.3+17,r*3.1+9);
          textY+=weight*edge*15*this.noise(q*4.7+51,r*3.6+28)*o.gravity;
          textY+=weight*edge*1.35*16*patch(.43,.82,.18,.12)*o.gravity;
          textY+=weight*edge*1.35*(23*patch(.33,.25,.18,.16)-16*patch(.65,.68,.19,.18))*o.gravity;
        }
        textY+=weight*((copyArea?3:14)*Math.exp(-(((q-.55)/.34)**2))-3)*o.gravity*Math.min(1,(right-left)*this.width/330);
      }
      const mask=(.16+.84*smooth(.07,.32,v))*(1-o.anchoring*fixed)*protection;
      const edge=smooth(0,.12,u)*smooth(0,.12,1-u)*smooth(0,.08,v)*smooth(0,.10,1-v);
      const angle=o.direction*Math.PI/180,c=Math.cos(angle),s=Math.sin(angle);
      return [((dx*c+dy*s)*mask+textX)*edge*scale*o.intensity,((-dx*s+dy*c)*mask+textY)*edge*scale*o.intensity];
    }
    rebuild(){
      this.version=(this.version||0)+1;
      this.nx=96;this.ny=clamp(Math.round(96*this.height/this.width),48,144);
      this.field=new Float32Array((this.nx+1)*(this.ny+1)*2);
      for(let y=0;y<=this.ny;y++)for(let x=0;x<=this.nx;x++){
        const d=this.raw(x/this.nx,y/this.ny),i=(y*(this.nx+1)+x)*2;
        this.field[i]=d[0];this.field[i+1]=d[1];
      }
    }
    vector(x,y,out=[0,0]){
      const gx=clamp(x/this.width,0,1)*this.nx,gy=clamp(y/this.height,0,1)*this.ny;
      const ix=Math.min(this.nx-1,Math.floor(gx)),iy=Math.min(this.ny-1,Math.floor(gy));
      const fx=gx-ix,fy=gy-iy,a=this.field,i=(iy*(this.nx+1)+ix)*2,stride=(this.nx+1)*2;
      out[0]=(a[i]*(1-fx)+a[i+2]*fx)*(1-fy)+(a[i+stride]*(1-fx)+a[i+stride+2]*fx)*fy;
      out[1]=(a[i+1]*(1-fx)+a[i+3]*fx)*(1-fy)+(a[i+stride+1]*(1-fx)+a[i+stride+3]*fx)*fy;
      return out;
    }
    map(x,y,meltProgress,interaction){
      const m=clamp(meltProgress,0,1);if(m===0)return [x,y,1];
      // Integrate a smooth velocity field instead of adding a displacement once.
      // Midpoint integration preserves coherent contours at high curvature.
      const step=m/12,[a,b,force]=this.scratch;
      for(let i=0;i<12;i++){
        this.vector(x,y,a);
        if(interaction){interaction(x,y,force);a[0]+=force[0];a[1]+=force[1];}
        const mx=x+a[0]*step*.5,my=y+a[1]*step*.5;
        this.vector(mx,my,b);
        if(interaction){interaction(mx,my,force);b[0]+=force[0];b[1]+=force[1];}
        x+=b[0]*step;y+=b[1]*step;
      }
      return [x,y,1];
    }
  }
  MeltField.defaults=defaults;MeltField.limits=limits;
  if(typeof module!=='undefined'&&module.exports)module.exports=MeltField;
  else globalThis.MeltField=MeltField;
})();
