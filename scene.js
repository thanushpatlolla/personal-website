/* A shared continuous material surface, not per-word transforms. */
(() => {
  'use strict';
  const root = document.documentElement;
  const clock = document.querySelector('#clock');
  const still = document.querySelector('#still');
  const note = document.querySelector('#time-note');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let paused = motion.matches, energy = .94, charge = .94, holding = false, angle = null;
  let heldFor=0, ratchet=0, turn=0, recoil=0, lastKey=0, gestureCenter=null, gestureTurned=false;
  const DETENT=Math.PI/24; // 48 detents/revolution. Three full turns from empty.
  const CHARGE_PER_DETENT=1/(48*3);
  function ratchetStep(direction=1){
    charge=Math.min(1,charge+Math.abs(direction)*CHARGE_PER_DETENT);
    handTime-=direction*92;
    turn=Math.max(-.55,Math.min(.55,turn+direction*.035));
    recoil=direction*.018;
  }
  let last = 0, elapsed = 0, handTime = 36540, frame;
  let W = 1, H = 1, clockBox, ready = false, rebuilding = false;
  const surface = document.createElement('canvas');
  surface.id = 'liquid-surface'; surface.setAttribute('aria-hidden','true');
  document.body.append(surface);
  const gl = surface.getContext('webgl', {alpha:false, antialias:true});
  // Leave real HTML and the photograph readable if the renderer is unavailable.
  if (!gl) return;
  function shader(type, source) {
    const s = gl.createShader(type); gl.shaderSource(s, source); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw Error(gl.getShaderInfoLog(s));
    return s;
  }
  const program = gl.createProgram();
  gl.attachShader(program, shader(gl.VERTEX_SHADER, `
    attribute vec2 position; attribute vec2 uv; attribute float shade;
    varying vec2 tex; varying float light;
    void main(){gl_Position=vec4(position,0.,1.);tex=uv;light=shade;}`));
  gl.attachShader(program, shader(gl.FRAGMENT_SHADER, `
    precision mediump float; varying vec2 tex; varying float light;
    uniform sampler2D image; uniform float night; uniform float isClock;
    void main(){vec4 c=texture2D(image,tex);if(c.a<.005)discard;
      c.rgb*=light;
      if(isClock>.5){
        float l=dot(c.rgb,vec3(.2126,.7152,.0722));
        c.rgb=mix(vec3(l),c.rgb,.85);
        c.rgb=mix(c.rgb,vec3(.51,.53,.50),.09);
      }
      c.rgb=mix(c.rgb,c.rgb*vec3(.65,.75,.88),night);
      gl_FragColor=c;}`));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
  gl.useProgram(program);
  const pos = gl.getAttribLocation(program,'position'), uv = gl.getAttribLocation(program,'uv');
  const shade = gl.getAttribLocation(program,'shade');
  const night = gl.getUniformLocation(program,'night'), isClock = gl.getUniformLocation(program,'isClock');
  const vb = gl.createBuffer(), ib = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER,vb);
  for (const [loc,size,offset] of [[pos,2,0],[uv,2,8],[shade,1,16]]) {
    gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc,size,gl.FLOAT,false,20,offset);
  }
  gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
  function texture() {
    const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);return t;
  }
  const sceneTexture=texture(), watchTexture=texture();
  const scene=document.createElement('canvas'), paint=document.createElement('canvas');
  const ctx=scene.getContext('2d'), brush=paint.getContext('2d');
  paint.width=paint.height=700;
  const photo=document.querySelector('#mountain-photo');
  const watch=new Image(); watch.src='/assets/painted-crash-muted.png';
  function loaded(img){return img.complete&&img.naturalWidth?Promise.resolve():new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=reject;});}
  const icons=[];
  async function prepareIcons(){
    for(const svg of document.querySelectorAll('.social-links svg')){
      const copy=svg.cloneNode(true);copy.setAttribute('xmlns','http://www.w3.org/2000/svg');
      copy.setAttribute('width','24');copy.setAttribute('height','24');
      copy.setAttribute('fill','#eee8d9');copy.setAttribute('color','#eee8d9');
      const img=new Image();img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(new XMLSerializer().serializeToString(copy));
      await loaded(img);icons.push({svg,img});
    }
  }
  function upload(t,c){gl.bindTexture(gl.TEXTURE_2D,t);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,c);}
  function paintText() {
    const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
    let n;
    while((n=walker.nextNode())){
      const el=n.parentElement;
      if(!n.textContent.trim()||el.closest('script,style,svg,.landscape,#clock,.visually-hidden,.music')||el.namespaceURI!=='http://www.w3.org/1999/xhtml')continue;
      const style=getComputedStyle(el);if(style.display==='none'||style.visibility==='hidden')continue;
      const range=document.createRange();let line='',left=0,top=0,height=0;
      ctx.font=`${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      ctx.fillStyle=style.color;ctx.textBaseline='alphabetic';
      const flush=()=>{if(line)ctx.fillText(line,left,top+height*.79);line='';};
      for(let i=0;i<n.length;i++){
        range.setStart(n,i);range.setEnd(n,i+1);const r=range.getBoundingClientRect();
        if(!r.width&&!r.height)continue;
        const y=r.top+scrollY;
        if(line&&Math.abs(y-top)>2)flush();
        if(!line){left=r.left;top=y;height=r.height;}line+=n.textContent[i];
      }
      flush();
    }
  }
  function captureScene(){
    ctx.clearRect(0,0,W,H);
    const scale=Math.max(W/photo.naturalWidth,H/photo.naturalHeight);
    ctx.drawImage(photo,(W-photo.naturalWidth*scale)/2,(H-photo.naturalHeight*scale)/2,photo.naturalWidth*scale,photo.naturalHeight*scale);
    const veil=ctx.createLinearGradient(0,0,0,H);veil.addColorStop(0,'#12212a30');veil.addColorStop(.5,'#10233318');veil.addColorStop(1,'#03151e85');
    ctx.fillStyle=veil;ctx.fillRect(0,0,W,H);
    paintText();
    for(const {svg,img} of icons){const b=svg.getBoundingClientRect();ctx.drawImage(img,b.left,b.top+scrollY,b.width,b.height);}
    const focus=document.activeElement;
    if(focus&&!focus.closest('.music')&&focus.matches('a:focus-visible,#still:focus-visible')){
      const b=focus.getBoundingClientRect();ctx.strokeStyle='#fff1c9';ctx.lineWidth=1;
      ctx.strokeRect(b.left-4,b.top+scrollY-3,b.width+8,b.height+6);
    }
    upload(sceneTexture,scene);
  }
  function paintWatch(){
    brush.clearRect(0,0,700,700);brush.drawImage(watch,0,0,700,700);
    // Hands are painted into the same texture, so numerals AND hands fold with it.
    brush.save();brush.translate(350,350);
    for(const [a,len,width,color] of [[handTime/43200*2*Math.PI,105,7,'#28333b'],[handTime/3600*2*Math.PI,155,4,'#27323a'],[Math.floor(handTime)/60*2*Math.PI,168,1.5,'#7c422c']]){
      brush.save();brush.rotate(a);brush.strokeStyle=color;brush.lineWidth=width;brush.lineCap='round';brush.beginPath();brush.moveTo(0,17);brush.lineTo(0,-len);brush.stroke();brush.restore();
    }
    brush.fillStyle='#ac783d';brush.beginPath();brush.arc(0,0,8,0,7);brush.fill();brush.restore();
    upload(watchTexture,paint);
  }
  function resize(){
    if(!ready||rebuilding)return;rebuilding=true;
    W=innerWidth;H=Math.max(innerHeight,document.body.scrollHeight);
    const dpr=Math.min(devicePixelRatio||1,2);
    surface.width=Math.round(W*dpr);surface.height=Math.round(H*dpr);
    surface.style.height=H+'px';scene.width=Math.round(W*dpr);scene.height=Math.round(H*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
    gl.viewport(0,0,surface.width,surface.height);
    const b=clock.getBoundingClientRect();
    const size=Math.min(b.width,b.height)*(W<761?.90:1.05);
    clockBox={x:b.left+(b.width-size)/2,y:b.top+scrollY-12,size};
    resetWater();captureScene();paintWatch();rebuilding=false;render(paused?0:1-energy);
  }
  const smooth=(a,b,x)=>{let t=Math.min(1,Math.max(0,(x-a)/(b-a)));return t*t*(3-2*t);};
  const gauss=(x,c,w)=>Math.exp(-(((x-c)/w)**2));
  // Seeded smooth random fields at several scales, domain-warped into each
  // other. No repeating sine-wave bands, no per-word movement, no frame noise.
  let randomSeed=0x55a1c;
  const lattice=new Float32Array(256*256);
  for(let i=0;i<lattice.length;i++){
    randomSeed=(Math.imul(randomSeed,1664525)+1013904223)|0;
    lattice[i]=(randomSeed>>>0)/2147483648-1;
  }
  const fade=t=>t*t*t*(t*(t*6-15)+10);
  function noise(x,y){
    const ix=Math.floor(x),iy=Math.floor(y),fx=fade(x-ix),fy=fade(y-iy);
    const a=lattice[(iy&255)*256+(ix&255)],b=lattice[(iy&255)*256+((ix+1)&255)];
    const c=lattice[((iy+1)&255)*256+(ix&255)],d=lattice[((iy+1)&255)*256+((ix+1)&255)];
    return (a+(b-a)*fx)*(1-fy)+(c+(d-c)*fx)*fy;
  }
  let dreamTime=0;
  // A damped wave equation: input disturbs the surface, then travels freely.
  const WATER_N=88;
  let waterH=88, water=new Float32Array(WATER_N*waterH), waterV=new Float32Array(WATER_N*waterH);
  let waterTime=0, previousPointer=null;
  function resetWater(){
    waterH=Math.max(40,Math.min(180,Math.round(WATER_N*H/W)));
    water=new Float32Array(WATER_N*waterH);waterV=new Float32Array(water.length);previousPointer=null;
  }
  function disturb(u,v,strength){
    const cx=u*(WATER_N-1),cy=v*(waterH-1);
    for(let y=Math.max(1,Math.floor(cy-4));y<Math.min(waterH-1,cy+4);y++)
      for(let x=Math.max(1,Math.floor(cx-4));x<Math.min(WATER_N-1,cx+4);x++){
        const weight=Math.exp(-((x-cx)**2+(y-cy)**2)/3.2);
        waterV[y*WATER_N+x]-=strength*weight;
      }
  }
  function advanceWater(dt){
    waterTime+=dt;
    while(waterTime>=1/60){
      for(let y=1;y<waterH-1;y++)for(let x=1;x<WATER_N-1;x++){
        const i=y*WATER_N+x;
        const lap=water[i-1]+water[i+1]+water[i-WATER_N]+water[i+WATER_N]-4*water[i];
        waterV[i]=(waterV[i]+lap*.23)*.979;
      }
      for(let i=0;i<water.length;i++)water[i]+=waterV[i];
      waterTime-=1/60;
    }
  }
  function waterAt(u,v){
    const x=Math.max(0,Math.min(WATER_N-1.001,u*(WATER_N-1)));
    const y=Math.max(0,Math.min(waterH-1.001,v*(waterH-1)));
    const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy,i=iy*WATER_N+ix;
    return (water[i]*(1-fx)+water[i+1]*fx)*(1-fy)+(water[i+WATER_N]*(1-fx)+water[i+WATER_N+1]*fx)*fy;
  }
  function velocity(x,y){
    const u=x/W,v=y/H;
    const unit=Math.min(W,H),px=x/unit,py=y/unit;
    const time=dreamTime*.025;
    const wx=noise(px*2.3+11.7,py*2.3+3.8+time);
    const wy=noise(px*2.3+37.1+time*.63,py*2.3+18.2);
    const qx=px+wx*.21,qy=py+wy*.21;
    const broadX=noise(qx*2.4+4.1,qy*2.4+9.6+time*.7);
    const broadY=noise(qx*2.4+22.3+time*.8,qy*2.4+31.7);
    const middleX=noise(qx*5.8+51.8,qy*5.8+8.3+time*.42);
    const middleY=noise(qx*5.8+12.9+time*.35,qy*5.8+61.2);
    const fineX=noise(qx*11.9+91.3,qy*11.9+4.9+time*.22);
    const fineY=noise(qx*11.9+6.8+time*.28,qy*11.9+79.4);
    // Viscous downward flow stretches longer painted contours; slow lateral
    // refraction bends them without the previous fine-grained crumpling.
    const pigment=.5+.5*noise(qx*6.2+18.4,qy*.85+54.1+time*.18);
    const gravity=90*Math.pow(pigment,2.3)*Math.pow(Math.max(0,Math.sin(Math.PI*v)),.7);
    let dx=36*broadX+11*middleX+2*fineX;
    let dy=34*broadY+13*middleY+3*fineY+gravity;
    // Refraction follows surface slopes. Nothing tracks or sticks to the cursor.
    dx+=(waterAt(u+1/WATER_N,v)-waterAt(u-1/WATER_N,v))*15;
    dy+=(waterAt(u,v+1/waterH)-waterAt(u,v-1/waterH))*15;
    const edge=smooth(0,.055,u)*smooth(0,.055,1-u)*smooth(0,.035,v)*smooth(0,.035,1-v);
    const scale=Math.max(.60,Math.min(1,W/980));
    return [dx*edge*scale,dy*edge*scale];
  }
  function flow(x,y,m){
    // Advect through several small steps rather than folding a displacement
    // grid over itself. This keeps continuous strokes instead of clipped shards.
    if(m<.0001)return [x,y,1];
    const step=m/4;
    for(let i=0;i<4;i++){
      const d=velocity(x,y);x+=d[0]*step;y+=d[1]*step;
    }
    return [x,y,1];
  }
  document.addEventListener('pointermove',event=>{
    if(holding||paused||event.pointerType==='touch')return;
    const u=event.clientX/W,v=(event.clientY+scrollY)/H;
    if(previousPointer){
      const distance=Math.hypot((u-previousPointer.u)*W,(v-previousPointer.v)*H);
      if(distance>1)disturb(u,v,Math.min(.30,distance*.006));
    }
    previousPointer={u,v};
  },{passive:true});
  document.addEventListener('pointerleave',()=>{previousPointer=null;});
  function watchPoint(u,v,m){
    // A restrained painted Crash is the resting shape. The watch then enters
    // precisely the same world-space paint/water field as the mountain and type.
    const lower=smooth(.34,.96,v);
    let x=u+m*(.035*lower*lower-.020*gauss(v,.51,.22));
    let y=v+m*.10*lower;
    const tilt=-.08+turn*.12+recoil;
    const px=x-.5,py=y-.5;
    x=.5+px*Math.cos(tilt)-py*Math.sin(tilt);
    y=.5+px*Math.sin(tilt)+py*Math.cos(tilt);
    const world=flow(clockBox.x+x*clockBox.size,clockBox.y+y*clockBox.size,m);
    return [world[0],world[1],1-m*.06*gauss(v,.60,.15)];
  }
  function mesh(tex,m,watchLayer){
    const nx=watchLayer?60:120,ny=watchLayer?70:100;
    const vertices=new Float32Array((nx+1)*(ny+1)*5),indices=new Uint16Array(nx*ny*6);
    let k=0;
    for(let j=0;j<=ny;j++)for(let i=0;i<=nx;i++){
      const u=i/nx,v=j/ny;
      const p=watchLayer?watchPoint(u,v,m):flow(u*W,v*H,m);
      vertices[k++]=p[0]/W*2-1;vertices[k++]=1-p[1]/H*2;vertices[k++]=u;vertices[k++]=v;vertices[k++]=p[2];
    }
    k=0;for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){
      const a=j*(nx+1)+i,b=a+nx+1;
      for(const n of [a,b,a+1,a+1,b,b+1])indices[k++]=n;
    }
    gl.bindTexture(gl.TEXTURE_2D,tex);gl.uniform1f(isClock,watchLayer?1:0);
    gl.bindBuffer(gl.ARRAY_BUFFER,vb);gl.bufferData(gl.ARRAY_BUFFER,vertices,gl.DYNAMIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ib);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,indices,gl.STATIC_DRAW);
    gl.drawElements(gl.TRIANGLES,indices.length,gl.UNSIGNED_SHORT,0);
  }
  function render(melt){
    root.style.setProperty('--melt',melt.toFixed(3));
    if(!ready||!clockBox)return;
    gl.clearColor(.035,.075,.09,1);gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform1f(night,melt*.12);
    mesh(sceneTexture,melt,false);mesh(watchTexture,melt,true);
  }
  let lastSecond=-1, previousMelt=-1;
  function update(now){
    const dt=Math.min(.15,(now-(last||now))/1000);last=now;
    if(!paused){
      dreamTime+=dt;
      advanceWater(dt);
      heldFor=holding?heldFor+dt:0;
      charge=Math.max(0,Math.min(1,charge+(holding?(heldFor>.7&&!gestureTurned?1/18:0):-1/6.5)*dt));
      energy+=(charge-energy)*(1-Math.exp(-dt*16));
      recoil*=Math.exp(-dt*19);
      if(!holding){handTime+=dt;turn*=Math.exp(-dt*10);}
      elapsed+=dt;
    }
    if(elapsed>1/40||paused||holding){
      const melt=paused?0:1-energy;
      const tick=Math.floor(handTime)!==lastSecond;
      if(ready&&(holding||tick)){paintWatch();lastSecond=Math.floor(handTime);}
      if(melt>.001||tick||Math.abs(previousMelt-melt)>.0001||Math.abs(turn)>.0001||Math.abs(recoil)>.0001||paused){render(melt);previousMelt=melt;}
      elapsed=0;
    }
    if(!paused)frame=requestAnimationFrame(update);
  }
  function start() { cancelAnimationFrame(frame); last = 0; frame = requestAnimationFrame(update); }
  function setPaused(value) {
    paused = value;
    holding = false;
    angle = null;
    document.body.classList.toggle('paused', paused);
    still.textContent = paused ? 'let time pass' : 'time is passing';
    still.setAttribute('aria-pressed', String(paused));
    note.textContent = paused ? 'a moment, held' : 'time is passing';
    if (paused) charge = energy = 1;
    render(paused ? 0 : 1 - energy);
    if(ready)captureScene();
    start();
  }
  function wind() {
    if (paused) setPaused(false);
    holding = true;heldFor=0;gestureTurned=false;
    note.textContent = 'turning back time';
  }
  function release() { holding = false; angle = null; gestureCenter=null; note.textContent = paused ? 'a moment, held' : 'time is passing'; }
  function pointerAngle(event) {
    const center=gestureCenter||watchPoint(.5,.5,paused?0:1-energy);
    return Math.atan2(event.clientY+scrollY-center[1],event.clientX-center[0]);
  }
  function contains(polygon,x,y){
    let inside=false;
    for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
      const a=polygon[i],b=polygon[j];
      if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])inside=!inside;
    }
    return inside;
  }
  function boundary(map,x0,y0,x1,y1){
    const points=[];
    for(let i=0;i<=16;i++)points.push(map(x0+(x1-x0)*i/16,y0));
    for(let i=1;i<=16;i++)points.push(map(x1,y0+(y1-y0)*i/16));
    for(let i=1;i<=16;i++)points.push(map(x1-(x1-x0)*i/16,y1));
    for(let i=1;i<16;i++)points.push(map(x0,y1-(y1-y0)*i/16));
    return points;
  }
  document.addEventListener('pointerdown',event=>{
    if(!ready||!event.isPrimary||event.button!==0||event.target.closest('.music'))return;
    const m=paused?0:1-energy;
    const outline=boundary((u,v)=>watchPoint(u,v,m),.09,.01,.91,.99);
    if(!contains(outline,event.clientX,event.clientY+scrollY))return;
    event.preventDefault();clock.focus({preventScroll:true});
    gestureCenter=watchPoint(.5,.5,m);clock.setPointerCapture(event.pointerId);wind();angle=pointerAngle(event);
  });
  // Hit-test the painted link/control outlines, not their unmelted DOM boxes.
  document.addEventListener('click',event=>{
    if(!ready||event.detail===0||event.target.closest('.music'))return;
    event.preventDefault();event.stopPropagation();
    const m=paused?0:1-energy;
    for(const el of document.querySelectorAll('a:not(.music a),#still')){
      const b=el.getBoundingClientRect();
      const shape=boundary((x,y)=>flow(x,y,m),b.left,b.top+scrollY,b.right,b.bottom+scrollY);
      if(contains(shape,event.clientX,event.clientY+scrollY)){
        if(el===still)setPaused(!paused);else window.location.assign(el.href);
        return;
      }
    }
  },true);
  clock.addEventListener('pointermove', event => {
    if (!holding || angle === null) return;
    const center=gestureCenter;
    // Ignore the singularity at the spindle; crossing it is not a turn.
    if(Math.hypot(event.clientX-center[0],event.clientY+scrollY-center[1])<clockBox.size*.10){angle=pointerAngle(event);return;}
    const next = pointerAngle(event);
    const delta = Math.atan2(Math.sin(next-angle),Math.cos(next-angle));
    if(Math.abs(delta)>.015)gestureTurned=true;
    ratchet+=delta;
    while(ratchet>=DETENT){ratchetStep(1);ratchet-=DETENT;}
    while(ratchet<=-DETENT){ratchetStep(-1);ratchet+=DETENT;}
    angle=next;
  });
  for (const type of ['pointerup','pointercancel','lostpointercapture','blur']) clock.addEventListener(type, release);
  clock.addEventListener('keydown', event => {
    lastKey=performance.now();
    if(['ArrowRight','ArrowUp','ArrowLeft','ArrowDown'].includes(event.key)){
      event.preventDefault();if(paused)setPaused(false);const d=['ArrowLeft','ArrowDown'].includes(event.key)?-1:1;ratchetStep(d);ratchetStep(d);
    }
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();if(!holding)wind();
    }
  });
  clock.addEventListener('keyup', event => {
    if (event.key === ' ' || event.key === 'Enter') {event.preventDefault();lastKey=performance.now();release();}
  });
  clock.addEventListener('click', event => {
    if(event.detail===0&&!holding&&performance.now()-lastKey>500){
      if(paused)setPaused(false);for(let i=0;i<4;i++)ratchetStep();
    }
  });
  still.addEventListener('click', () => setPaused(!paused));
  motion.addEventListener('change', event => setPaused(event.matches));
  document.addEventListener('visibilitychange', () => {
    release();
    if (document.hidden) cancelAnimationFrame(frame); else start();
  });
  document.querySelector('.clock-area').hidden = false;
  still.hidden = false;
  Promise.all([loaded(photo),loaded(watch),prepareIcons()]).then(()=>{
    ready=true;resize();document.body.classList.add('liquid-ready');setPaused(paused);
  }).catch(error=>{console.warn('Painting unavailable; readable HTML retained.',error);document.querySelector('.clock-area').hidden=true;still.hidden=true;});
  window.addEventListener('resize',resize);
  document.addEventListener('focusin',()=>{if(ready){captureScene();render(paused?0:1-energy);}});
  surface.addEventListener('webglcontextlost',event=>{
    event.preventDefault();cancelAnimationFrame(frame);ready=false;
    document.body.classList.remove('liquid-ready');
    document.querySelector('.clock-area').hidden=true;still.hidden=true;
  });
})();
