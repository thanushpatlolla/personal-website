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
    noise(x,y){
      // Smooth seeded value noise: no repeating columns or sinusoidal bands.
      const hash=(a,b)=>{let n=Math.imul(a+71,374761393)^Math.imul(b+19,668265263);n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967295;};
      const ix=Math.floor(x),iy=Math.floor(y),fade=t=>t*t*t*(t*(t*6-15)+10),fx=fade(x-ix),fy=fade(y-iy);
      return (hash(ix,iy)*(1-fx)+hash(ix+1,iy)*fx)*(1-fy)+(hash(ix,iy+1)*(1-fx)+hash(ix+1,iy+1)*fx)*fy;
    }
    materialAt(x,y,kind){
      const unit=Math.min(this.width,this.height),text=kind==='text';
      // Broad coherent soft patches keep words and ridges recognizable.
      const length=text?Math.max(170,this.text.width*.68):Math.max(220,unit*.40);
      const broad=this.noise(x/length+3.7,y/(length*1.4)+8.1);
      const detail=this.noise(x/(length*.57)+31.4,y/(length*.9)+17.2);
      return {mobility:.15+.85*smooth(.15,.85,.8*broad+.2*detail),side:this.noise(x/(length*1.3)+62,y/length+9)-.5,yield:.04+.20*(1-broad),unit:text?Math.min(320,unit):unit};
    }
    displacement(x,y,dx,dy,m,kind){
      const u=x/this.width,v=y/this.height,s=this.values(y,kind);
      if(s.swirl===1&&s.sag===0&&s.drip===0&&s.settle===0)return [dx,dy];
      const edge=smooth(0,.10,u)*smooth(0,.10,1-u)*smooth(0,.20,v)*smooth(0,.24,1-v);
      const wax=this.materialAt(x,y,kind),progress=smooth(wax.yield,1,m);
      // Each patch yields at a different point, then sags and settles. Vertical
      // displacement is bounded, not multiplied by height within the material.
      const sag=wax.unit*.10*s.sag*(.25+.75*wax.mobility);
      const run=wax.unit*.13*s.drip*wax.mobility*wax.mobility;
      const side=wax.unit*.055*s.swirl*wax.side;
      const limit=wax.unit*.045;
      return [side*progress*edge,limit*Math.tanh((sag+run)/limit)*progress*edge*(kind==='text'?1.35:1)];
    }
    settling(x,y,m,age,kind){
      const u=x/this.width,v=y/this.height,s=this.values(y,kind),wax=this.materialAt(x,y,kind);
      const edge=smooth(0,.10,u)*smooth(0,.10,1-u)*smooth(0,.20,v)*smooth(0,.24,1-v);
      return (kind==='text'?1.35:1)*wax.unit*.025*s.settle*wax.mobility*(1-Math.exp(-age/22))*edge*m;
    }

  }
  MeltFeel.presets=presets;
  if(typeof module!=='undefined'&&module.exports)module.exports=MeltFeel;else globalThis.MeltFeel=MeltFeel;
})();
