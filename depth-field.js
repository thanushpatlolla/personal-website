/* Five coupled depth planes. Photo masks follow ridgelines, not horizontal bands.
   Depth is artistic (not recovered metric geometry): text 0, near 1, mid 2,
   distant 3, sky 4. One wave travels through (screen x, screen y, depth). */
(() => {
  const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
  const ridges=[
    [[0,.47],[.04,.48],[.10,.49],[.16,.478],[.23,.49],[.29,.485],[.36,.495],[.45,.494],[.55,.503],[.64,.49],[.72,.504],[.80,.502],[.89,.497],[1,.50]],
    [[0,.548],[.015,.543],[.045,.56],[.08,.548],[.10,.561],[.13,.543],[.19,.538],[.23,.527],[.255,.517],[.272,.518],[.29,.533],[.34,.544],[.365,.558],[.40,.551],[.44,.552],[.48,.545],[.497,.542],[.51,.55],[.55,.547],[.575,.535],[.586,.525],[.60,.536],[.65,.542],[.70,.548],[.76,.559],[.80,.552],[.85,.531],[.89,.503],[.91,.507],[.94,.531],[.97,.542],[1,.538]],
    [[0,.65],[.045,.677],[.10,.697],[.15,.70],[.20,.72],[.25,.751],[.30,.785],[.35,.81],[.40,.79],[.45,.752],[.49,.73],[.53,.745],[.57,.735],[.61,.705],[.65,.675],[.70,.64],[.75,.605],[.80,.58],[.85,.568],[.90,.558],[.95,.552],[1,.55]]
  ];
  const height=(line,u)=>{for(let i=1;i<line.length;i++)if(u<=line[i][0]){const a=line[i-1],b=line[i];return a[1]+(b[1]-a[1])*(u-a[0])/(b[0]-a[0]);}return line.at(-1)[1];};
  class DepthField {
    constructor(){this.time=0;this.waves=[];this.width=1;this.height=1;this.spacing=105;this.speed=114;this.nx=32;this.ny=24;this.resize(1,1,2200,1650);}
    resize(w,h,pw,ph){this.width=w;this.height=h;const s=Math.max(w/pw,h/ph);this.pw=pw*s;this.ph=ph*s;this.left=(w-this.pw)/2;this.top=(h-this.ph)/2;this.ny=Math.max(24,Math.min(64,Math.round(32*h/w)));this.fields=Array.from({length:5},()=>new Float32Array(this.nx*this.ny*2));this.clear();}
    clear(){this.waves=[];for(const f of this.fields)f.fill(0);}
    weights(x,y,kind='landscape'){
      if(kind==='text')return [1,0,0,0,0];
      const u=Math.max(0,Math.min(1,(x-this.left)/this.pw)),v=(y-this.top)/this.ph;
      const a=smooth(height(ridges[0],u)-.014,height(ridges[0],u)+.014,v);
      const b=Math.min(a,smooth(height(ridges[1],u)-.018,height(ridges[1],u)+.018,v));
      const c=Math.min(b,smooth(height(ridges[2],u)-.025,height(ridges[2],u)+.025,v));
      return [0,c,b-c,a-b,1-a];
    }
    depth(x,y,kind){return this.weights(x,y,kind).reduce((sum,w,i)=>sum+w*i,0);}
    cursorDepth(x,y){
      // A continuous photo-space ramp, independent of ridges and text hit boxes.
      const v=(y-this.top)/this.ph;
      return Math.max(1,Math.min(4,4-3*(v-.28)/.62));
    }
    cursorInfluence(x,y,kind,z){
      return this.weights(x,y,kind).reduce((sum,w,i)=>sum+w*(1-smooth(0,1.6,Math.abs(i-z))),0);
    }
    emit(x,y,z,dx=0,dy=1,strength=1){const n=Math.hypot(dx,dy)||1;this.waves.push({x,y,z,dx:dx/n,dy:dy/n,strength,born:this.time});if(this.waves.length>8)this.waves.shift();}
    pulse(w,x,y,z){
      const age=this.time-w.born,dx=x-w.x,dy=y-w.y,dz=(z-w.z)*this.spacing,r=Math.hypot(dx,dy,dz),arrival=r/this.speed;
      if(age<arrival)return [0,0]; // Strict causality: no response ahead of 3D front.
      const t=age-arrival,envelope=Math.sin(Math.min(1,t/.22)*Math.PI/2)*Math.exp(-t*1.6)*Math.exp(-r/1100);
      const phase=x*.008+y*.006-z*.38-this.time*.8;
      const amplitude=14*w.strength*envelope*(1-smooth(12,16,age));
      return [amplitude*(.65*dx/(r||1)+.2*w.dx+.23*Math.sin(phase)),amplitude*(.65*dy/(r||1)+.2*w.dy+.23*Math.cos(phase*.83))];
    }
    advance(dt){
      const wasActive=this.waves.length>0;this.time+=dt;this.waves=this.waves.filter(w=>this.time-w.born<16);
      if(!wasActive)return false;
      for(let z=0;z<5;z++){const f=this.fields[z];for(let j=0;j<this.ny;j++)for(let i=0;i<this.nx;i++){
        const x=i/(this.nx-1)*this.width,y=j/(this.ny-1)*this.height;let dx=0,dy=0;
        for(const w of this.waves){const p=this.pulse(w,x,y,z);dx+=p[0];dy+=p[1];}
        const edge=smooth(0,30,x)*smooth(0,30,this.width-x)*smooth(0,25,y)*smooth(0,25,this.height-y),k=(j*this.nx+i)*2;
        f[k]=10*Math.tanh(dx/10)*edge;f[k+1]=10*Math.tanh(dy/10)*edge;
      }}return true;
    }
    sample(x,y,kind='landscape'){
      const weights=this.weights(x,y,kind),gx=Math.max(0,Math.min(this.nx-1.001,x/this.width*(this.nx-1))),gy=Math.max(0,Math.min(this.ny-1.001,y/this.height*(this.ny-1)));
      const ix=Math.floor(gx),iy=Math.floor(gy),fx=gx-ix,fy=gy-iy,k=(iy*this.nx+ix)*2;let dx=0,dy=0;
      for(let z=0;z<5;z++)if(weights[z]){const a=this.fields[z];for(let axis=0;axis<2;axis++){const v=((a[k+axis]*(1-fx)+a[k+2+axis]*fx)*(1-fy)+(a[k+this.nx*2+axis]*(1-fx)+a[k+this.nx*2+2+axis]*fx)*fy)*weights[z];if(axis)dy+=v;else dx+=v;}}
      return [dx,dy];
    }
  }
  DepthField.ridges=ridges;
  if(typeof module!=='undefined')module.exports=DepthField;else window.DepthField=DepthField;
})();
