/* A shared continuous material surface, not per-word transforms. */
(() => {
  'use strict';
  const root = document.documentElement;
  const clock = document.querySelector('#clock');
  const still = document.querySelector('#still');
  const note = document.querySelector('#time-note');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let paused = motion.matches, energy = 0, charge = 0, holding = false, angle = null;
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
  let W = 1, H = 1, timeBounds=null, lakeRegion=null, clockBox, ready = false, rebuilding = false;
  const material=new MeltField();
  let manualMelt=null,fluidActive=false,geometryDirty=true,pauseTween=null;
  const currentMelt=()=>pauseTween?pauseTween.from*(1-pauseTween.progress*pauseTween.progress*(3-2*pauseTween.progress)):(manualMelt===null?(paused?0:1-energy):manualMelt);
  const timing={frameMs:0,frames:0};
  let hoverPointer=null,clockHintDismissed=false;
  const hint=document.createElementNS('http://www.w3.org/2000/svg','svg');
  hint.id='interaction-hints';hint.setAttribute('aria-hidden','true');
  hint.innerHTML='<defs><marker id="wind-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto"><path d="M1 1 L7 4 L1 7" fill="none" stroke="#171b19"/></marker></defs><path id="time-underline" fill="none" stroke="currentColor"/><g id="wind-hint"><path fill="none" stroke="currentColor" marker-end="url(#wind-arrow)"/></g>';
  document.body.append(hint);
  const timeUnderline=hint.querySelector('#time-underline'),windHint=hint.querySelector('#wind-hint');
  function updateHints(m){
    if(!ready)return;
    hint.setAttribute('viewBox',`0 0 ${W} ${H}`);hint.style.height=H+'px';
    const p=hoverPointer,focus=document.activeElement;
    const pointerOnClock=p&&nearShape(boundary((u,v)=>watchPoint(u,v,m),.09,.01,.91,.99),p.x,p.y,24);
    if(p&&!pointerOnClock)clockHintDismissed=false;
    const onClock=holding||(!clockHintDismissed&&((focus===clock&&clock.matches(':focus-visible'))||pointerOnClock));
    const b=still.getBoundingClientRect();
    const onTime=(focus===still&&still.matches(':focus-visible'))||(p&&contains(boundary((x,y)=>flow(x,y,m),b.left-28,b.top+scrollY-22,b.right+28,b.bottom+scrollY+22),p.x,p.y));
    timeUnderline.style.display=onTime?'':'none';windHint.style.display=onClock?'':'none';
    if(onTime){let d='';for(let i=0;i<=16;i++){const a=flow(b.left+12+(b.width-12)*i/16,b.bottom+scrollY+3,m);d+=(i?'L':'M')+a[0]+','+a[1];}timeUnderline.setAttribute('d',d);}
    if(onClock){
      // The arc is attached to UV points just outside the painted rim, so it
      // shares every deformation, perspective change and mouse pull of the dial.
      const edge=clockRimPoints;
      if(edge.length<2)return;
      let d='';
      for(let j=0;j<edge.length-1;j++)for(let i=0;i<8;i++){
        const t=i/8,a=edge[Math.max(0,j-1)],b=edge[j],c=edge[j+1],e=edge[Math.min(edge.length-1,j+2)];
        const curve=k=>.5*((2*b[k])+(-a[k]+c[k])*t+(2*a[k]-5*b[k]+4*c[k]-e[k])*t*t+(-a[k]+3*b[k]-3*c[k]+e[k])*t*t*t);
        const q=watchPoint(curve(0),curve(1),m);
        d+=(d?'L':'M')+q[0]+','+q[1];
      }
      windHint.removeAttribute('transform');windHint.querySelector('path').setAttribute('d',d);
    }
    document.body.style.cursor=onClock?'grab':onTime?'pointer':'';
  }
  document.addEventListener('pointermove',e=>{hoverPointer=e.target.closest('.melt-ui,.hill-ui')?null:{x:e.clientX,y:e.clientY+scrollY};if(ready)updateHints(currentMelt());},{passive:true});
  document.addEventListener('pointerleave',()=>{hoverPointer=null;if(ready)updateHints(currentMelt());});
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
    uniform sampler2D image; uniform float night; uniform float isClock; uniform float clockWarm;
    void main(){vec4 c=texture2D(image,tex);if(c.a<.005)discard;
      c.rgb*=light;
      if(isClock>.5){
        float l=dot(c.rgb,vec3(.2126,.7152,.0722));
        c.rgb=mix(vec3(l),c.rgb,.85);
        c.rgb=mix(c.rgb,vec3(.51,.53,.50),.09);
        c.rgb*=mix(vec3(1.),vec3(1.10,1.025,.88),clockWarm);
        // Warm variants share the photograph's subdued contrast and air color.
        c.rgb=mix(c.rgb,(c.rgb-.5)*.86+.5,clockWarm);
        c.rgb=mix(c.rgb,vec3(.55,.54,.45),clockWarm*.17);
      }
      c.rgb=mix(c.rgb,c.rgb*vec3(.65,.75,.88),night);
      gl_FragColor=c;}`));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
  gl.useProgram(program);
  const pos = gl.getAttribLocation(program,'position'), uv = gl.getAttribLocation(program,'uv');
  const shade = gl.getAttribLocation(program,'shade');
  const night = gl.getUniformLocation(program,'night'), isClock = gl.getUniformLocation(program,'isClock');
  const clockWarm=gl.getUniformLocation(program,'clockWarm');
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
  const clockModes=['original','warm','ridge'];
  let clockStyle=new URLSearchParams(location.search).get('clock')||'warm';
  if(!clockModes.includes(clockStyle))clockStyle='warm';
  const originalWatch=new Image();originalWatch.src='/assets/user-crash-clock.png';
  // Both warm treatments use the exact original pixels; only shader color changes.
  const warmWatch=originalWatch;
  const clockRimPoints=[];
  const album=document.querySelector('.record-cover img');
  let watch=clockStyle==='original'?originalWatch:warmWatch;
  document.body.dataset.clock=clockStyle;
  clock.querySelector('img').src=watch.src;
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
      if(!n.textContent.trim()||el.closest('script,style,svg,.landscape,#clock,.visually-hidden,.melt-ui,.hill-ui')||el.namespaceURI!=='http://www.w3.org/1999/xhtml')continue;
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
    ctx.filter='saturate(1.08)';
    ctx.drawImage(photo,(W-photo.naturalWidth*scale)/2,(H-photo.naturalHeight*scale)/2,photo.naturalWidth*scale,photo.naturalHeight*scale);
    ctx.filter='none';
    const veil=ctx.createLinearGradient(0,0,0,H);veil.addColorStop(0,'#12212a30');veil.addColorStop(.5,'#10233318');veil.addColorStop(1,'#03151e85');
    ctx.fillStyle=veil;ctx.fillRect(0,0,W,H);
    if(clockStyle==='ridge'&&clockBox){
      // Soft contact shadow follows the same terrain mesh as the watch.
      ctx.save();ctx.translate(clockBox.x+clockBox.size*.52,clockBox.y+clockBox.size*.67);
      ctx.scale(clockBox.size*.49,clockBox.size*.075);
      const shadow=ctx.createRadialGradient(0,0,0,0,0,1);
      shadow.addColorStop(0,'#12201d66');shadow.addColorStop(1,'#12201d00');
      ctx.fillStyle=shadow;ctx.fillRect(-1,-1,2,2);ctx.restore();
    }
    const cover=album.getBoundingClientRect();
    ctx.save();ctx.globalAlpha=.85;ctx.filter='saturate(.6)';
    if(album.complete&&album.naturalWidth)ctx.drawImage(album,cover.left,cover.top+scrollY,cover.width,cover.height);ctx.restore();
    paintText();
    for(const {svg,img} of icons){const b=svg.getBoundingClientRect();ctx.drawImage(img,b.left,b.top+scrollY,b.width,b.height);}
    const focus=document.activeElement;
    if(focus&&!focus.closest('.melt-ui,.hill-ui')&&focus.matches('a:focus-visible,#still:focus-visible,#music-toggle:focus-visible')){
      const b=focus.getBoundingClientRect();ctx.strokeStyle='#fff1c9';ctx.lineWidth=1;
      if(focus===still){
        ctx.beginPath();ctx.moveTo(b.left+12,b.bottom+scrollY-3);
        ctx.lineTo(b.right,b.bottom+scrollY-3);ctx.stroke();
      }else ctx.strokeRect(b.left-4,b.top+scrollY-3,b.width+8,b.height+6);
    }
    upload(sceneTexture,scene);
  }
  function paintWatch(){
    brush.clearRect(0,0,700,700);
    // Preserve the exact supplied PNG's aspect ratio and transparency.
    const scale=Math.min(700/watch.naturalWidth,700/watch.naturalHeight);
    const width=watch.naturalWidth*scale,height=watch.naturalHeight*scale;
    brush.drawImage(watch,(700-width)/2,(700-height)/2,width,height);
    if(!clockRimPoints.length){
      // Trace the actual alpha silhouette, not an estimated oval. This side
      // becomes the underside after banking the original dial to the left.
      const pixels=brush.getImageData(0,0,700,700).data;
      for(let y=42;y<665;y+=12){
        for(let x=1;x<697;x++)if(pixels[(y*700+x)*4+3]>180&&pixels[(y*700+x+2)*4+3]>180){
          clockRimPoints.push([(x-27)/700,y/700]);break;
        }
      }
    }
    // Hands are painted into the same texture, so numerals AND hands fold with it.
    brush.save();brush.translate(340,350);brush.scale(.63,1);
    for(const [a,len,width,color] of [[handTime/43200*2*Math.PI,105,7,'#28333b'],[handTime/3600*2*Math.PI,155,4,'#27323a'],[Math.floor(handTime)/60*2*Math.PI,168,1.5,'#7c422c']]){
      brush.save();brush.rotate(a);brush.strokeStyle=color;brush.lineWidth=width;brush.lineCap='round';brush.beginPath();brush.moveTo(0,17);brush.lineTo(0,-len);brush.stroke();brush.restore();
    }
    brush.fillStyle='#ac783d';brush.beginPath();brush.arc(0,0,8,0,7);brush.fill();brush.restore();
    upload(watchTexture,paint);
  }
  function resize(){
    if(!ready||rebuilding)return;rebuilding=true;
    // Exclude the previous canvas height when measuring a smaller viewport.
    surface.style.height='0px';
    W=innerWidth;H=Math.max(innerHeight,document.body.scrollHeight);
    const dpr=Math.min(devicePixelRatio||1,2);
    surface.width=Math.round(W*dpr);surface.height=Math.round(H*dpr);
    surface.style.height=H+'px';scene.width=Math.round(W*dpr);scene.height=Math.round(H*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
    gl.viewport(0,0,surface.width,surface.height);
    const area=document.querySelector('.clock-area');
    area.removeAttribute('style');clock.style.height='';
    const b=clock.getBoundingClientRect();
    const size=Math.min(b.width,b.height)*(W<761?.90:1.05);
    clockBox={x:b.left+(b.width-size)/2,y:b.top+scrollY-12,size};
    if(clockStyle==='ridge'){
      const cover=Math.max(W/photo.naturalWidth,H/photo.naturalHeight);
      const peakX=(W-photo.naturalWidth*cover)/2+photo.naturalWidth*.586*cover;
      const peakY=(H-photo.naturalHeight*cover)/2+photo.naturalHeight*.527*cover;
      const ridgeSize=W<761?Math.min(235,W*.60):Math.min(350,W*.30);
      clockBox={x:Math.max(8,Math.min(W-ridgeSize-8,peakX-ridgeSize*.23)),y:peakY-ridgeSize*.48,size:ridgeSize};
      Object.assign(area.style,{left:clockBox.x+'px',top:clockBox.y+'px',right:'auto',width:ridgeSize+'px',height:ridgeSize+'px'});
      clock.style.height=ridgeSize+'px';
    }
    const photoScale=Math.max(W/photo.naturalWidth,H/photo.naturalHeight);
    lakeRegion={x:(W-photo.naturalWidth*photoScale)/2+.343*photo.naturalWidth*photoScale,
      y:(H-photo.naturalHeight*photoScale)/2+.863*photo.naturalHeight*photoScale,
      rx:.085*photo.naturalWidth*photoScale,ry:.065*photo.naturalHeight*photoScale};
    material.resize(W,H);
    const masks=[['.intro',.82],['.music',.70],['#still',.94]].map(([selector,strength])=>{
      const b=document.querySelector(selector).getBoundingClientRect();
      return [(b.left-12)/W,(b.top+scrollY-12)/H,(b.right+12)/W,(b.bottom+scrollY+12)/H,strength,65/W,65/H];
    });
    material.setMasks(masks);
    const tb=still.getBoundingClientRect();timeBounds={left:tb.left,right:tb.right,top:tb.top+scrollY,bottom:tb.bottom+scrollY};
    resetFluid();resetAmbient();geometryDirty=true;captureScene();paintWatch();rebuilding=false;render(currentMelt());
  }
  const smooth=(a,b,x)=>{let t=Math.min(1,Math.max(0,(x-a)/(b-a)));return t*t*(3-2*t);};
  const gauss=(x,c,w)=>Math.exp(-(((x-c)/w)**2));
  // Viscous vector displacement: mouse motion deposits directional momentum.
  // Diffusion carries nearby paint along; friction stops motion without ripples.
  const FLUID_N=80;
  let fluidH=80, dragX,dragY,velX,velY,nextX,nextY,nextVX,nextVY;
  let fluidTime=0, previousPointer=null;
  function resetFluid(){
    fluidH=Math.max(40,Math.min(180,Math.round(FLUID_N*H/W)));
    [dragX,dragY,velX,velY,nextX,nextY,nextVX,nextVY]=Array.from({length:8},()=>new Float32Array(FLUID_N*fluidH));
    previousPointer=null;fluidTime=0;fluidActive=false;
  }
  function dragPaint(px,py,dx,dy){
    const radius=Math.min(110,Math.max(70,W*.085));
    const cx=px/W*(FLUID_N-1),cy=py/H*(fluidH-1);
    const rx=radius/W*(FLUID_N-1),ry=radius/H*(fluidH-1);
    for(let y=Math.max(1,Math.floor(cy-ry));y<Math.min(fluidH-1,cy+ry);y++)
      for(let x=Math.max(1,Math.floor(cx-rx));x<Math.min(FLUID_N-1,cx+rx);x++){
        const r=((x-cx)/rx)**2+((y-cy)/ry)**2;
        if(r>1)continue;
        const weight=Math.exp(-r*3)*(1-r),i=y*FLUID_N+x;
        velX[i]+=dx*material.options.drag*weight;velY[i]+=dy*material.options.drag*weight;
        fluidActive=true;
      }
  }
  function advanceFluid(dt){
    if(!fluidActive)return false;
    fluidTime+=dt;
    const viscosity=material.options.viscosity,damping=Math.exp(-material.options.damping/60);
    while(fluidTime>=1/60){
      let activity=0;
      for(let y=1;y<fluidH-1;y++)for(let x=1;x<FLUID_N-1;x++){
        const i=y*FLUID_N+x;
        const lap=a=>a[i-1]+a[i+1]+a[i-FLUID_N]+a[i+FLUID_N]-4*a[i];
        nextVX[i]=(velX[i]+lap(velX)*viscosity)*damping;
        nextVY[i]=(velY[i]+lap(velY)*viscosity)*damping;
        nextX[i]=(dragX[i]+nextVX[i]/60+lap(dragX)*viscosity*.3235)*.994;
        // Disturbed pigment continues a small downward creep as momentum dies.
        nextY[i]=(dragY[i]+nextVY[i]/60+lap(dragY)*viscosity*.3235+Math.hypot(dragX[i],dragY[i])*.0006)*.994;
        activity=Math.max(activity,Math.abs(nextX[i]),Math.abs(nextY[i]),Math.abs(nextVX[i])*.1,Math.abs(nextVY[i])*.1);
      }
      [velX,nextVX]=[nextVX,velX];[velY,nextVY]=[nextVY,velY];
      [dragX,nextX]=[nextX,dragX];[dragY,nextY]=[nextY,dragY];
      fluidTime-=1/60;
      if(activity<.015){resetFluid();break;}
    }
    return true;
  }
  function fluidAt(field,u,v){
    const x=Math.max(0,Math.min(FLUID_N-1.001,u*(FLUID_N-1)));
    const y=Math.max(0,Math.min(fluidH-1.001,v*(fluidH-1)));
    const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy,i=iy*FLUID_N+ix;
    return (field[i]*(1-fx)+field[i+1]*fx)*(1-fy)+(field[i+FLUID_N]*(1-fx)+field[i+FLUID_N+1]*fx)*fy;
  }
  // Slow, deterministic ambient creep. Manual progress holds a still reference
  // shape; normal clock mode breathes without requiring pointer movement.
  const AMBIENT_N=32;
  let ambientH=32,ambientX,ambientY,ambientTime=0,ambientBlend=0;
  function resetAmbient(){
    ambientH=Math.max(24,Math.min(90,Math.round(AMBIENT_N*H/W)));
    ambientX=new Float32Array(AMBIENT_N*ambientH);ambientY=new Float32Array(ambientX.length);ambientBlend=0;
  }
  function advanceAmbient(dt){
    if(manualMelt!==null){ambientBlend=0;return false;}
    ambientTime+=dt;ambientBlend+=(1-ambientBlend)*(1-Math.exp(-dt*2));

    const copy=document.querySelector('.intro').getBoundingClientRect();
    for(let y=0;y<ambientH;y++)for(let x=0;x<AMBIENT_N;x++){
      const u=x/(AMBIENT_N-1),v=y/(ambientH-1),i=y*AMBIENT_N+x;
      const edge=smooth(0,.10,u)*smooth(0,.10,1-u)*smooth(0,.07,v)*smooth(0,.08,1-v);
      const protection=1-.45*smooth(copy.left-60,copy.left,u*W)*(1-smooth(copy.right,copy.right+60,u*W))*smooth(copy.top+scrollY-60,copy.top+scrollY,v*H)*(1-smooth(copy.bottom+scrollY,copy.bottom+scrollY+60,v*H));
      const copyWeight=(1-protection)/.45;
      const time=ambientTime*.10,fastTime=ambientTime*.20;
      const quiet=.53+.57*copyWeight;
      const strength=quiet*ambientBlend*edge*protection*(.18+.82*smooth(.08,.5,v))*material.options.intensity;
      const waveX=t=>material.noise(u*2.3+9.1+t,v*1.7+32.5+t*.37)-material.noise(u*2.3+9.1,v*1.7+32.5);
      const waveY=t=>material.noise(u*2.4+71.3-t*.24,v*2.1+6.8+t)-material.noise(u*2.4+71.3,v*2.1+6.8);
      ambientX[i]=28*(waveX(time)*(1-copyWeight)+waveX(fastTime)*copyWeight)*strength;
      ambientY[i]=38*(waveY(time)*(1-copyWeight)+waveY(fastTime)*copyWeight)*strength;
      // A low-amplitude traveling swell connects sky, landscape, clock and type.
      const swell=ambientBlend*edge*material.options.intensity;
      const phase=u*5.2+v*3.4-ambientTime*.42;
      const crossPhase=u*2.6-v*4.1+ambientTime*.31;
      ambientX[i]+=4.5*Math.sin(phase+.8)*swell;
      ambientY[i]+=(6*Math.sin(phase)+2*Math.sin(crossPhase))*swell;
    }
    return true;
  }
  function ambientAt(field,u,v){
    const x=Math.max(0,Math.min(AMBIENT_N-1.001,u*(AMBIENT_N-1))),y=Math.max(0,Math.min(ambientH-1.001,v*(ambientH-1)));
    const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy,i=iy*AMBIENT_N+ix;
    return (field[i]*(1-fx)+field[i+1]*fx)*(1-fy)+(field[i+AMBIENT_N]*(1-fx)+field[i+AMBIENT_N+1]*fx)*fy;
  }
  function interaction(x,y,out=[0,0]){
    const u=x/W,v=y/H;
    const edge=smooth(0,.055,u)*smooth(0,.055,1-u)*smooth(0,.035,v)*smooth(0,.035,1-v);
    const scale=Math.max(.60,Math.min(1,W/980));
    out[0]=65*Math.tanh(fluidAt(dragX,u,v)/65)*edge*scale;out[1]=65*Math.tanh(fluidAt(dragY,u,v)/65)*edge*scale;
    return out;
  }
  // Cache the expensive static material map separately from the moving paint.
  // Ambient motion must not force reintegration of 20,000 unchanged base points.
  let baseMap=null;
  const dragA=new Float64Array(2),dragB=new Float64Array(2);
  function prepareBase(m){
    if(baseMap&&baseMap.m===m&&baseMap.version===material.version)return;
    const nx=96,ny=Math.max(48,Math.min(144,Math.round(96*H/W)));
    const data=new Float32Array((nx+1)*(ny+1)*2);
    for(let y=0;y<=ny;y++)for(let x=0;x<=nx;x++){
      const px=x*W/nx,py=y*H/ny,p=material.map(px,py,m),i=(y*(nx+1)+x)*2;
      data[i]=p[0]-px;data[i+1]=p[1]-py;
    }
    baseMap={nx,ny,data,m,version:material.version};
  }
  function basePoint(x,y){
    const {nx,ny,data:a}=baseMap;
    const gx=Math.max(0,Math.min(nx-1e-6,x/W*nx)),gy=Math.max(0,Math.min(ny-1e-6,y/H*ny));
    const ix=Math.floor(gx),iy=Math.floor(gy),fx=gx-ix,fy=gy-iy,i=(iy*(nx+1)+ix)*2,stride=(nx+1)*2;
    return [x+(a[i]*(1-fx)+a[i+2]*fx)*(1-fy)+(a[i+stride]*(1-fx)+a[i+stride+2]*fx)*fy,
      y+(a[i+1]*(1-fx)+a[i+3]*fx)*(1-fy)+(a[i+stride+1]*(1-fx)+a[i+stride+3]*fx)*fy,1];
  }
  function flow(x,y,m){
    if(m===0)return [x,y,1];
    prepareBase(m);const p=basePoint(x,y);
    if(fluidActive){
      const step=m/4;
      for(let i=0;i<4;i++){
        interaction(p[0],p[1],dragA);
        interaction(p[0]+dragA[0]*step*.5,p[1]+dragA[1]*step*.5,dragB);
        p[0]+=dragB[0]*step;p[1]+=dragB[1]*step;
      }
    }
    if(manualMelt===null&&(!paused||pauseTween)&&ambientBlend>0){
      const u=p[0]/W,v=p[1]/H;
      p[0]+=ambientAt(ambientX,u,v)*m;p[1]+=ambientAt(ambientY,u,v)*m;
    }
    // Keep the lake recognizable and easier to catch as the surrounding paint moves.
    if(lakeRegion){
      const b=lakeRegion,weight=Math.exp(-(((x-b.x)/b.rx)**2+((y-b.y)/b.ry)**2));
      p[0]=x+(p[0]-x)*(1-.75*weight);p[1]=y+(p[1]-y)*(1-.75*weight);
    }
    if(timeBounds){
      const b=timeBounds;
      const weight=smooth(b.left-65,b.left-12,x)*(1-smooth(b.right+12,b.right+65,x))*smooth(b.top-60,b.top-10,y)*(1-smooth(b.bottom+10,b.bottom+60,y));
      p[0]=x+(p[0]-x)*(1-.86*weight);p[1]=y+(p[1]-y)*(1-.86*weight);
    }
    return p;
  }
  document.addEventListener('pointermove',event=>{
    if(!ready||holding||paused||event.pointerType==='touch'||event.target.closest('.melt-ui,.hill-ui')){previousPointer=null;return;}
    const x=event.clientX,y=event.clientY+scrollY;
    if(previousPointer){
      const dx=x-previousPointer.x,dy=y-previousPointer.y,distance=Math.hypot(dx,dy);
      if(distance>0&&distance<250){
        const steps=Math.max(1,Math.ceil(distance/16));
        for(let i=1;i<=steps;i++)dragPaint(previousPointer.x+dx*i/steps,previousPointer.y+dy*i/steps,dx/steps,dy/steps);
      }
    }
    previousPointer={x,y};
  },{passive:true});
  document.addEventListener('pointerleave',()=>{previousPointer=null;});
  let centerCache=null;
  function watchPoint(u,v,m){
    // A restrained painted Crash is the resting shape. The watch then enters
    // precisely the same world-space paint/water field as the mountain and type.
    const softness=m*material.options.intensity;
    const lower=smooth(.48,.98,v);
    // A stable spindle, a soft waist, and a heavier, slightly swollen trailing end.
    const width=1+softness*(.10*gauss(v,.84,.13)-.07*gauss(v,.66,.12));
    let x=.5+(u-.5)*width+softness*.028*lower*lower;
    let y=v+softness*.09*lower*lower;
    // Bank across the sky: a shallow, slightly receding plane rather than
    // an upright hanging dial. Shared world flow still bends the whole face.
    const tilt=(clockStyle==='ridge'?-1.37:-1.047)+turn*.12+recoil;
    const px=(x-.5)*.82,py=y-.5;
    const bankX=px*Math.cos(tilt)-py*Math.sin(tilt);
    const bankY=px*Math.sin(tilt)+py*Math.cos(tilt);
    // Yaw AFTER banking: the screen-right edge recedes and becomes smaller.
    const yaw=.60,depth=1+bankX*Math.sin(yaw)*.85;
    x=.5+bankX*Math.cos(yaw)/depth;
    y=.5+bankY/depth+softness*.065*material.options.gravity*lower*lower;
    if(clockStyle==='ridge'){
      // Lay the same painted dial over a shoulder, sagging between supports.
      x=.5+bankX*.98;
      // Shoulder rests on the ridge; the far end spills down its slope.
      // A one-sided drape avoids a suspended hammock silhouette.
      y=.49+bankY*.83+(.07+softness*.035)*gauss(bankX,.04,.29)
        +.13*smooth(-.20,.43,bankX);
    }
    const originalX=clockBox.x+x*clockBox.size,originalY=clockBox.y+y*clockBox.size;
    const world=flow(originalX,originalY,m);
    if(!centerCache||centerCache.m!==m)centerCache={m,p:flow(clockBox.x+clockBox.size*.5,clockBox.y+clockBox.size*.5,m)};
    const center=centerCache.p;
    // Freeze the spindle relative to the case while letting its perimeter soften.
    const rigid=(clockStyle==='ridge'?0:material.options.anchoring*.75)*Math.exp(-((u-.5)**2+(v-.5)**2)/.038);
    const anchorX=originalX+center[0]-(clockBox.x+clockBox.size*.5);
    const anchorY=originalY+center[1]-(clockBox.y+clockBox.size*.5);
    return [world[0]*(1-rigid)+anchorX*rigid,world[1]*(1-rigid)+anchorY*rigid,(clockStyle==='ridge'?.97-.13*smooth(.30,.95,v):1)-softness*.045*gauss(v,.72,.14)];
  }
  function createGrid(nx,ny){
    const vertices=new Float32Array((nx+1)*(ny+1)*5),indices=new Uint16Array(nx*ny*6);
    let k=0;for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){
      const a=j*(nx+1)+i,b=a+nx+1;
      for(const n of [a,b,a+1,a+1,b,b+1])indices[k++]=n;
    }
    const vb=gl.createBuffer(),ib=gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,vb);gl.bufferData(gl.ARRAY_BUFFER,vertices.byteLength,gl.DYNAMIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ib);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,indices,gl.STATIC_DRAW);
    return {nx,ny,vertices,vb,ib,count:indices.length};
  }
  const sceneGrid=createGrid(128,112),watchGrid=createGrid(64,80);
  let lastGeometryMelt=-1,lastTurn=-1,lastRecoil=-1;
  function mesh(tex,m,watchLayer,dirty){
    const grid=watchLayer?watchGrid:sceneGrid,{nx,ny,vertices}=grid;
    gl.bindBuffer(gl.ARRAY_BUFFER,grid.vb);
    if(dirty){
      let k=0;for(let j=0;j<=ny;j++)for(let i=0;i<=nx;i++){
        const u=i/nx,v=j/ny,p=watchLayer?watchPoint(u,v,m):flow(u*W,v*H,m);
        vertices[k++]=p[0]/W*2-1;vertices[k++]=1-p[1]/H*2;vertices[k++]=u;vertices[k++]=v;vertices[k++]=p[2];
      }
      gl.bufferSubData(gl.ARRAY_BUFFER,0,vertices);
    }
    for(const [loc,size,offset] of [[pos,2,0],[uv,2,8],[shade,1,16]]){
      gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,size,gl.FLOAT,false,20,offset);
    }
    gl.bindTexture(gl.TEXTURE_2D,tex);gl.uniform1f(isClock,watchLayer?1:0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,grid.ib);
    gl.drawElements(gl.TRIANGLES,grid.count,gl.UNSIGNED_SHORT,0);
  }
  function render(melt){
    root.style.setProperty('--melt',melt.toFixed(3));
    if(!ready||!clockBox)return;
    const started=performance.now();centerCache=null;
    const dirty=geometryDirty||melt!==lastGeometryMelt;
    gl.clearColor(.035,.075,.09,1);gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform1f(night,melt*.12);gl.uniform1f(clockWarm,clockStyle==='original'?0:.45);
    mesh(sceneTexture,melt,false,dirty);
    mesh(watchTexture,melt,true,dirty||turn!==lastTurn||recoil!==lastRecoil);
    lastGeometryMelt=melt;lastTurn=turn;lastRecoil=recoil;geometryDirty=false;
    updateHints(melt);
    timing.frameMs=performance.now()-started;timing.frames++;
  }
  // A slightly fast, unreliable escapement: uneven waits, an occasional
  // skipped tooth, and brief double ticks. Independent of the landscape flow.
  let tickSeed=0x1c10c, tickWait=.55;
  const tickRandom=()=>{tickSeed=(Math.imul(tickSeed,1664525)+1013904223)>>>0;return tickSeed/4294967296;};
  function advanceClock(dt){
    tickWait-=dt;
    while(tickWait<=0){
      handTime+=tickRandom()<.06?2:1;
      const temperament=tickRandom();
      tickWait+=temperament<.12?.18+tickRandom()*.16:temperament>.93?1.20+tickRandom()*.24:.50+tickRandom()*.70;
    }
  }
  let lastSecond=-1, previousMelt=-1;
  function update(now){
    const dt=Math.min(.15,(now-(last||now))/1000);last=now;
    if(pauseTween){
      pauseTween.progress=Math.min(1,pauseTween.progress+dt/2.2);geometryDirty=true;
      if(pauseTween.progress===1){pauseTween=null;charge=energy=1;resetFluid();resetAmbient();}
    }
    if(!paused){
      if(advanceFluid(dt))geometryDirty=true;
      if(advanceAmbient(dt)&&currentMelt()>.001)geometryDirty=true;
      heldFor=holding?heldFor+dt:0;
      charge=Math.max(0,Math.min(1,charge+(holding?(heldFor>.7&&!gestureTurned?1/18:0):-1/6.5)*dt));
      energy+=(charge-energy)*(1-Math.exp(-dt*16));
      recoil*=Math.exp(-dt*19);
      if(!holding){advanceClock(dt);turn*=Math.exp(-dt*10);}
      elapsed+=dt;
    }
    { // Render active deformation on every animation frame; idle geometry is cached.
      const melt=currentMelt();
      const tick=Math.floor(handTime)!==lastSecond;
      if(ready&&(holding||tick)){paintWatch();lastSecond=Math.floor(handTime);}
      if(geometryDirty||tick||Math.abs(previousMelt-melt)>.0001||Math.abs(turn)>.0001||Math.abs(recoil)>.0001||paused){render(melt);previousMelt=melt;}
      elapsed=0;
    }
    if(!paused||pauseTween)frame=requestAnimationFrame(update);
  }
  function start() { cancelAnimationFrame(frame); last = 0; frame = requestAnimationFrame(update); }
  function setPaused(value) {
    const from=currentMelt(),wasTransitioning=!!pauseTween;
    pauseTween=null;
    if(!value&&wasTransitioning)charge=energy=1-from;
    manualMelt=null;
    paused = value;
    holding = false;
    angle = null;
    document.body.classList.toggle('paused', paused);
    still.textContent = paused ? 'let time pass' : 'time is passing';
    still.setAttribute('aria-pressed', String(paused));
    note.textContent = paused ? 'a moment, held' : 'time is passing';
    if(paused){
      if(ready&&!motion.matches&&from>.001)pauseTween={from,progress:0};
      else {charge=energy=1;resetFluid();resetAmbient();}
      geometryDirty=true;
    }
    render(currentMelt());
    if(ready)captureScene();
    start();
  }
  function wind() {
    document.dispatchEvent(new Event('clockwind'));
    useClock();
    if (paused) setPaused(false);
    holding = true;heldFor=0;gestureTurned=false;
    note.textContent = 'turning back time';
  }
  function release() { clockHintDismissed=true;windHint.style.display='none';holding = false; angle = null; gestureCenter=null; note.textContent = paused ? 'a moment, held' : 'time is passing'; }
  function pointerAngle(event) {
    const center=gestureCenter||watchPoint(.5,.5,currentMelt());
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
  function nearShape(polygon,x,y,padding){
    if(contains(polygon,x,y))return true;
    for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
      const a=polygon[j],b=polygon[i],dx=b[0]-a[0],dy=b[1]-a[1];
      const t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy||1)));
      if(Math.hypot(x-a[0]-t*dx,y-a[1]-t*dy)<=padding)return true;
    }
    return false;
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
    if(!ready||!event.isPrimary||event.button!==0||event.target.closest('.melt-ui,.hill-ui'))return;
    const m=currentMelt();
    const outline=boundary((u,v)=>watchPoint(u,v,m),.09,.01,.91,.99);
    if(!nearShape(outline,event.clientX,event.clientY+scrollY,24))return;
    event.preventDefault();clock.focus({preventScroll:true});
    gestureCenter=watchPoint(.5,.5,m);clock.setPointerCapture(event.pointerId);wind();angle=pointerAngle(event);
  });
  // Hit-test the painted link/control outlines, not their unmelted DOM boxes.
  document.addEventListener('click',event=>{
    if(!ready||event.detail===0||event.target.closest('.melt-ui,.hill-ui'))return;
    event.preventDefault();event.stopPropagation();
    const m=currentMelt();
    for(const el of document.querySelectorAll('a:not(.music a):not(.melt-ui a),#still,#music-toggle')){
      const b=el.getBoundingClientRect();
      const padX=el===still?28:0,padY=el===still?22:0;
      const shape=boundary((x,y)=>flow(x,y,m),b.left-padX,b.top+scrollY-padY,b.right+padX,b.bottom+scrollY+padY);
      if(contains(shape,event.clientX,event.clientY+scrollY)){
        if(el===still)setPaused(!paused);else if(el.id==='music-toggle')el.click();else window.location.assign(el.href);
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
      event.preventDefault();useClock();if(paused)setPaused(false);const d=['ArrowLeft','ArrowDown'].includes(event.key)?-1:1;ratchetStep(d);ratchetStep(d);
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
      useClock();if(paused)setPaused(false);for(let i=0;i<4;i++)ratchetStep();
    }
  });
  function useClock(){
    if(manualMelt!==null){charge=energy=1-manualMelt;manualMelt=null;}
  }
  window.melting={
    setClockStyle(value){
      if(!clockModes.includes(value))return;
      release();clockStyle=value;watch=value==='original'?originalWatch:warmWatch;
      document.body.dataset.clock=value;clock.querySelector('img').src=watch.src;
      centerCache=null;if(ready)resize();
    },
    configure(values){material.configure(values);geometryDirty=true;render(currentMelt());return {...material.options};},
    setMeltProgress(value){
      if(!Number.isFinite(Number(value)))return;
      pauseTween=null;manualMelt=Math.max(0,Math.min(1,Number(value)));resetFluid();ambientBlend=0;geometryDirty=true;render(currentMelt());
    },
    useClock(){useClock();if(paused)setPaused(false);start();},
    resetInteraction(){resetFluid();geometryDirty=true;render(currentMelt());},
    setRegions(regions){material.setRegions(regions);geometryDirty=true;render(currentMelt());},
    getState(){return {ready,clockStyle,meltProgress:currentMelt(),manual:manualMelt!==null,options:{...material.options},fluidActive,ambientTime,ambientActive:manualMelt===null&&!paused,renderMs:timing.frameMs};},
    mapPoint(x,y,progress=currentMelt()){return material.map(x,y,progress);},
    samplePoint(x,y){return flow(x,y,currentMelt());},
    defaults:{...MeltField.defaults},limits:MeltField.limits
  };
  still.addEventListener('click', () => setPaused(!paused));
  motion.addEventListener('change', event => setPaused(event.matches));
  document.addEventListener('visibilitychange', () => {
    release();
    if (document.hidden) cancelAnimationFrame(frame); else start();
  });
  document.querySelector('.clock-area').hidden = false;
  still.hidden = false;
  Promise.all([loaded(photo),loaded(originalWatch),loaded(warmWatch),loaded(album),prepareIcons()]).then(()=>{
    ready=true;resize();document.body.classList.add('liquid-ready');setPaused(paused);
  }).catch(error=>{console.warn('Painting unavailable; readable HTML retained.',error);document.querySelector('.clock-area').hidden=true;still.hidden=true;});
  window.addEventListener('resize',resize);
  document.addEventListener('musicchange',()=>{if(ready){captureScene();render(currentMelt());}});
  document.addEventListener('focusin',()=>{if(ready){captureScene();render(currentMelt());}});
  surface.addEventListener('webglcontextlost',event=>{
    event.preventDefault();cancelAnimationFrame(frame);ready=false;
    document.body.classList.remove('liquid-ready');
    document.querySelector('.clock-area').hidden=true;still.hidden=true;
  });
})();
