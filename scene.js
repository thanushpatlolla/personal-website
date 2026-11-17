/* A shared continuous material surface, not per-word transforms. */
(() => {
  'use strict';
  const root = document.documentElement;
  const clock = document.querySelector('#clock');
  const still = document.querySelector('#still');
  const note = document.querySelector('#time-note');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let paused = motion.matches, energy = .94, holding = false, angle = null;
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
      c.rgb*=light; c.rgb=mix(c.rgb,c.rgb*vec3(.65,.75,.88),night*(1.-isClock));
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
  const watch=new Image(); watch.src='/assets/painted-watch.png';
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
      if(!n.textContent.trim()||el.closest('script,style,svg,.landscape,#clock,.visually-hidden')||el.namespaceURI!=='http://www.w3.org/1999/xhtml')continue;
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
    if(focus&&focus.matches('a:focus-visible,#still:focus-visible')){
      const b=focus.getBoundingClientRect();ctx.strokeStyle='#fff1c9';ctx.lineWidth=1;
      ctx.strokeRect(b.left-4,b.top+scrollY-3,b.width+8,b.height+6);
    }
    upload(sceneTexture,scene);
  }
  function paintWatch(){
    brush.clearRect(0,0,700,700);brush.drawImage(watch,0,0,700,700);
    // Hands are painted into the same texture, so numerals AND hands fold with it.
    brush.save();brush.translate(350,390);
    for(const [a,len,width,color] of [[handTime/43200*2*Math.PI,120,9,'#28333b'],[handTime/3600*2*Math.PI,175,5,'#27323a'],[Math.floor(handTime)/60*2*Math.PI,187,2,'#7c422c']]){
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
    captureScene();paintWatch();rebuilding=false;render(paused?0:1-energy);
  }
  const smooth=(a,b,x)=>{let t=Math.min(1,Math.max(0,(x-a)/(b-a)));return t*t*(3-2*t);};
  const gauss=(x,c,w)=>Math.exp(-(((x-c)/w)**2));
  function flow(x,y,m){
    const u=x/W,v=y/H;
    // Broad shoulders, narrow descending tongues, and a pool near the bottom.
    // All layers use this same spatial field; no independent letters or words.
    const drift=.024*Math.sin(v*5.3);
    const streams=.80*gauss(u,.185+drift,.052)+.98*gauss(u,.38-drift*.6,.043)+.7*gauss(u,.66+drift,.062)+.92*gauss(u,.86-drift,.043);
    const sag=m*(.018+streams*.34)*H*Math.sin(Math.PI*Math.min(1,Math.max(0,v)));
    const curl=m*m*W*.035*Math.sin(v*6+u*9)*smooth(.1,.7,v)*Math.sin(Math.PI*u);
    const pool=smooth(.72,1,v)*m;
    return [x+curl,y+sag*(1-pool*.68),1-m*.15*streams+ m*.035*Math.sin(u*45+v*9)];
  }
  function watchPoint(u,v,m){
    // A folded sheet of enamel: upper left shoulder stays suspended, the waist
    // pinches and turns back on itself, and the heavy lower lobe falls to the right.
    const t=smooth(.23,.86,v);
    const center=.5+m*(.22*Math.sin(v*6.4)-.13+ .28*t*t);
    const width=1-m*(.64*gauss(v,.59,.17)+.14*t);
    const x=center+(u-.5)*width;
    const y=v+m*(.43*t + .14*Math.sin(u*5.8+v*2)*Math.sin(Math.PI*v));
    const folded=gauss(v,.52,.09);
    return [clockBox.x+x*clockBox.size,clockBox.y+y*clockBox.size,
      1-m*.40*folded +m*.15*gauss(v,.43,.045) -m*.12*(u-.5)];
  }
  function mesh(tex,m,watchLayer){
    const nx=watchLayer?60:140,ny=watchLayer?70:100;
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
    gl.uniform1f(night,melt*.4);
    mesh(sceneTexture,melt,false);mesh(watchTexture,melt,true);
  }
  let lastSecond=-1, previousMelt=-1;
  function update(now){
    const dt=Math.min(.15,(now-(last||now))/1000);last=now;
    if(!paused){energy=Math.max(0,Math.min(1,energy+(holding?1.15:-1/5.5)*dt));handTime+=holding?-dt*1500:dt;elapsed+=dt;}
    if(elapsed>1/40||paused||holding){
      const melt=paused?0:1-energy;
      const tick=Math.floor(handTime)!==lastSecond;
      if(ready&&(holding||tick)){paintWatch();lastSecond=Math.floor(handTime);}
      if(tick||Math.abs(previousMelt-melt)>.0001||paused){render(melt);previousMelt=melt;}
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
    still.textContent = paused ? 'let time pass' : 'pause time';
    still.setAttribute('aria-pressed', String(paused));
    note.textContent = paused ? 'a moment, held' : 'time is passing';
    if (paused) energy = 1;
    render(paused ? 0 : 1 - energy);
    if(ready)captureScene();
    start();
  }
  function wind() {
    if (paused) setPaused(false);
    holding = true;
    note.textContent = 'turning back time';
  }
  function release() { holding = false; angle = null; note.textContent = paused ? 'a moment, held' : 'time is passing'; }
  function pointerAngle(event) {
    const box = clock.getBoundingClientRect();
    return Math.atan2(event.clientY - (box.top + box.height * 170 / 410), event.clientX - (box.left + box.width / 2));
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
    if(!ready||!event.isPrimary||event.button!==0)return;
    const m=paused?0:1-energy;
    const outline=boundary((u,v)=>watchPoint(u,v,m),.09,.01,.91,.99);
    if(!contains(outline,event.clientX,event.clientY+scrollY))return;
    event.preventDefault();clock.focus({preventScroll:true});
    clock.setPointerCapture(event.pointerId);wind();angle=pointerAngle(event);
  });
  // Hit-test the painted link/control outlines, not their unmelted DOM boxes.
  document.addEventListener('click',event=>{
    if(!ready||event.detail===0)return;
    event.preventDefault();event.stopPropagation();
    const m=paused?0:1-energy;
    for(const el of document.querySelectorAll('a,#still')){
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
    const next = pointerAngle(event);
    const delta = Math.atan2(Math.sin(next - angle), Math.cos(next - angle));
    energy = Math.min(1, energy + Math.abs(delta) * .2);
    handTime -= Math.abs(delta) * 600;
    angle = next;
  });
  for (const type of ['pointerup','pointercancel','lostpointercapture','blur']) clock.addEventListener(type, release);
  clock.addEventListener('keydown', event => {
    if (event.key === ' ' || event.key === 'Enter') { event.preventDefault(); wind(); }
  });
  clock.addEventListener('keyup', event => {
    if (event.key === ' ' || event.key === 'Enter') { event.preventDefault(); release(); }
  });
  // Supports assistive-technology activation without a physical key/pointer.
  clock.addEventListener('click', event => { if (event.detail === 0 && !holding) { energy = 1; render(0); } });
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
