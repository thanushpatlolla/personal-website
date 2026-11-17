/* Local design controls only; saved choices stay in this browser until adopted. */
(() => {
  if(!['localhost','127.0.0.1','[::1]'].includes(location.hostname)||!window.melting)return;
  const api=window.melting,defaults={...api.getMountainSettings(),...api.getMotionSettings()},key='mountain-preview-v3';
  const panel=document.createElement('details');panel.open=true;panel.className='melt-ui mountain-preview';
  panel.innerHTML='<summary>Mountain preview</summary><div class="preview-controls"></div>';
  const controls=panel.querySelector('div'),inputs={};
  const fields=[['speed','Oscillation speed',.1,4,.01],['sway','Drifting sway',0,3,.01],['wave','Traveling waves',0,3,.01],['smoothing','Motion smoothing (seconds)',0,3,.05],['viscosity','Mouse spread / viscosity',.05,.23,.005],['damping','Mouse damping',2,12,.1],['persistence','Disturbance lifetime',.25,5,.05],['sideways','Sideways bend',0,2,.01],['vertical','Vertical bend',0,1.5,.01],['curlX','Sideways curl',0,.04,.0002],['curlY','Vertical curl',0,.03,.0002],['stretch','Vertical stretch',0,1,.01]];
  for(const [name,label,min,max,step] of fields){
    const row=document.createElement('label');row.textContent=label;
    const output=document.createElement('output'),input=document.createElement('input');input.type='range';input.min=min;input.max=max;input.step=step;input.value=defaults[name];input.setAttribute('aria-label',label);
    const sync=()=>output.value=Number(input.value).toFixed(name.startsWith('curl')?4:2);
    input.addEventListener('input',()=>{sync();api.setMountainSettings({[name]:input.value});api.setMotionSettings({[name]:input.value});});sync();inputs[name]={input,sync};row.append(output,input);controls.append(row);
  }
  const help=document.createElement('p');help.textContent='Use Run clock to tune moving oscillations. Smoothing softens changes; mouse controls affect disturbances from your cursor. Freeze shape stops ambient motion.';controls.prepend(help);
  const actions=document.createElement('div'),status=document.createElement('p');status.setAttribute('role','status');
  const button=(text,action)=>{const b=document.createElement('button');b.type='button';b.textContent=text;b.onclick=action;actions.append(b);};
  function apply(values){const current={...api.setMountainSettings(values),...api.setMotionSettings(values)};for(const [name,{input,sync}] of Object.entries(inputs)){input.value=current[name];sync();}}
  button('Freeze shape',()=>api.setMeltProgress(1));
  button('Run clock',()=>api.useClock());
  button('Save settings',()=>{try{localStorage.setItem(key,JSON.stringify({...api.getMountainSettings(),...api.getMotionSettings()}));status.textContent='Saved in this browser. Tell me when these are ready to become the defaults.';}catch{status.textContent='Browser storage unavailable.';}});
  button('Reset',()=>{apply(defaults);try{localStorage.removeItem(key);}catch{}status.textContent='Original mountain settings restored.';});
  controls.append(actions,status);document.body.append(panel);
  try{const saved=JSON.parse(localStorage.getItem(key));if(saved&&typeof saved==='object'){apply(saved);status.textContent='Loaded your saved preview settings.';}}catch{}
})();
