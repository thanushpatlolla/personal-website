/* Art direction only. Does not modify the pointer-fluid or mouse-wave simulation. */
(() => {
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const smooth=(a,b,v)=>{const t=clamp((v-a)/(b-a),0,1);return t*t*(3-2*t);};
  const presets={
    original:{text:{swirl:1,sag:0,drip:0,settle:0},sky:{swirl:1,sag:0,drip:0,settle:0},mountains:{swirl:1,sag:0,drip:0,settle:0}},
    wax:{text:{swirl:.18,sag:.3,drip:.55,settle:.25},sky:{swirl:.15,sag:.12,drip:.1,settle:.12},mountains:{swirl:.25,sag:.38,drip:.3,settle:.25}},
    syrup:{text:{swirl:.05,sag:.5,drip:.85,settle:.5},sky:{swirl:.08,sag:.2,drip:.25,settle:.25},mountains:{swirl:.12,sag:.6,drip:.5,settle:.45}},
    quiet:{text:{swirl:.08,sag:.12,drip:.25,settle:.1},sky:{swirl:.05,sag:.06,drip:0,settle:.05},mountains:{swirl:.12,sag:.2,drip:.15,settle:.12}}
  };
  class MeltFeel {
    constructor(){this.settings=structuredClone(presets.wax);this.version=0;this.resize(1,1,0,1,{left:0,top:0,width:1,height:1});}
    resize(width,height,photoTop,photoHeight,text){Object.assign(this,{width,height,photoTop,photoHeight,text});this.version++;}
    configure(region,values){
      if(!this.settings[region])return;
      for(const key of ['swirl','sag','drip','settle'])if(Number.isFinite(Number(values[key])))this.settings[region][key]=clamp(Number(values[key]),0,key==='swirl'?1:1.25);
      this.version++;return this.snapshot();
    }
    preset(name){if(!presets[name])return;this.settings=structuredClone(presets[name]);this.version++;return this.snapshot();}
    snapshot(){return structuredClone(this.settings);}
    weights(y){return smooth(.43,.62,(y-this.photoTop)/this.photoHeight);}
    values(y,kind){
      if(kind==='text')return this.settings.text;
      const t=this.weights(y),a=this.settings.sky,b=this.settings.mountains;
      return {swirl:a.swirl+(b.swirl-a.swirl)*t,sag:a.sag+(b.sag-a.sag)*t,drip:a.drip+(b.drip-a.drip)*t,settle:a.settle+(b.settle-a.settle)*t};
    }
    displacement(x,y,dx,dy,m,kind){
      const u=x/this.width,v=y/this.height,unit=Math.min(this.width,this.height),s=this.values(y,kind);
      const edge=smooth(0,.08,u)*smooth(0,.08,1-u)*smooth(0,.06,v)*smooth(0,.12,1-v);
      let q=u,r=v,scale=unit;
      if(kind==='text'){
        const b=this.text;q=(x-b.left)/b.width;r=(y-b.top)/b.height;
        // Use the copy's coordinates for the intro, viewport coordinates for other type.
        if(q<-.1||q>1.1||r<-.1||r>1.1){q=u;r=v;scale=unit*.5;}
        else scale=Math.min(unit,b.height*1.4);
      }
      const columns=(Math.exp(-(((q-.22)/.055)**2))+.75*Math.exp(-(((q-.58)/.08)**2))+.55*Math.exp(-(((q-.83)/.045)**2)));
      const pull=smooth(0,1,clamp(r,0,1));
      const sag=scale*.075*s.sag*(.3+.7*pull);
      const drip=scale*.15*s.drip*columns*(.18+.82*pull);
      // Positive Y only: sag, lengthen, and settle instead of circling back upward.
      return [dx*s.swirl,dy*s.swirl+(sag+drip)*edge*m];
    }
    settling(x,y,m,age,kind){
      const u=x/this.width,v=y/this.height,s=this.values(y,kind);
      const edge=smooth(0,.08,u)*smooth(0,.08,1-u)*smooth(0,.06,v)*smooth(0,.12,1-v);
      return Math.min(this.width,this.height)*.018*s.settle*(1-Math.exp(-age/18))*edge*m;
    }
  }
  MeltFeel.presets=presets;
  if(typeof module!=='undefined'&&module.exports)module.exports=MeltFeel;else globalThis.MeltFeel=MeltFeel;
})();
