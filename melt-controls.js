/* Optional tuning UI: ?tune=1 or Shift+M. Normal visitors see only the landscape. */
(() => {
  const api=window.melting;if(!api)return;
  const panel=document.createElement('aside');panel.className='melt-ui';panel.hidden=true;
  panel.setAttribute('aria-label','Melt tuning');
  panel.innerHTML=`<div class="tune-heading"><strong>Melt studio</strong><button type="button" id="tune-close" aria-label="Close melt tuning">×</button></div>
    <label class="tune-row" for="tune-progress">Melt progress <output id="progress-value">0</output></label>
    <input id="tune-progress" aria-label="Melt progress" type="range" min="0" max="1" step=".01">
    <p class="tune-note" id="tune-mode">Following the clock</p>
    <label class="tune-row" for="tune-clock-style">Clock</label>
    <select id="tune-clock-style"><option value="original">Original painted clock</option><option value="warm">Warm painted clock · sky</option><option value="ridge">Warm painted clock · mountains</option></select>
    <div id="tune-settings"></div>
    <div class="tune-actions"><button type="button" id="tune-clock">Use clock</button><button type="button" id="tune-clear">Clear paint</button><button type="button" id="tune-reset">Reset</button><button type="button" id="tune-save">Save settings</button></div>
    <p class="tune-note" id="tune-status" role="status">Drag the image with your mouse. Shift+M hides these controls.</p>`;
  document.body.append(panel);
  const labels={intensity:'Intensity',scale:'Bend scale',gravity:'Gravity',direction:'Gravity direction',anchoring:'Anchoring',noiseFrequency:'Noise frequency',detail:'Organic detail',viscosity:'Mouse viscosity',damping:'Mouse damping',drag:'Mouse strength'};
  const settings=panel.querySelector('#tune-settings');
  const advanced=document.createElement('details');advanced.innerHTML='<summary>Detail & mouse feel</summary>';settings.append(advanced);
  for(const [key,label] of Object.entries(labels)){
    const [min,max]=api.limits[key],step=key==='direction'?1:.01;
    const row=document.createElement('div');row.className='tune-setting';
    row.innerHTML=`<label class="tune-row" for="tune-${key}">${label}<output id="value-${key}"></output></label><input id="tune-${key}" type="range" min="${min}" max="${max}" step="${step}" aria-label="${label}">`;
    const input=row.querySelector('input');
    input.addEventListener('input',()=>{api.configure({[key]:Number(input.value)});syncSettings();});
    if(['noiseFrequency','detail','viscosity','damping','drag'].includes(key))advanced.append(row);else settings.insertBefore(row,advanced);
  }
  const clockStyle=panel.querySelector('#tune-clock-style');
  clockStyle.addEventListener('change',()=>{api.setClockStyle(clockStyle.value);});
  const progress=panel.querySelector('#tune-progress');
  progress.addEventListener('input',()=>{api.setMeltProgress(Number(progress.value));syncProgress();});
  function syncSettings(){
    clockStyle.value=api.getState().clockStyle;
    for(const [key,value] of Object.entries(api.getState().options)){
      const input=panel.querySelector(`#tune-${key}`);if(!input)continue;
      input.value=value;panel.querySelector(`#value-${key}`).textContent=Number(value.toFixed(2))+(key==='direction'?'°':'');
    }
  }
  function syncProgress(){
    const state=api.getState();progress.value=state.meltProgress;
    panel.querySelector('#progress-value').textContent=state.meltProgress.toFixed(2);
    panel.querySelector('#tune-mode').textContent=state.manual?'Holding this shape · wind the clock to resume':'Following the clock';
  }
  const show=value=>{panel.hidden=!value;if(value){syncSettings();syncProgress();}};
  panel.querySelector('#tune-close').addEventListener('click',()=>show(false));
  panel.querySelector('#tune-clock').addEventListener('click',()=>{api.useClock();syncProgress();});
  panel.querySelector('#tune-clear').addEventListener('click',()=>api.resetInteraction());
  panel.querySelector('#tune-reset').addEventListener('click',()=>{
    api.configure(api.defaults);api.setClockStyle('ridge');api.resetInteraction();api.useClock();
    try{localStorage.removeItem('melting-settings-v1');localStorage.removeItem('melting-clock-v1');}catch{}
    syncSettings();syncProgress();panel.querySelector('#tune-status').textContent='Default settings restored.';
  });
  panel.querySelector('#tune-save').addEventListener('click',()=>{
    try{localStorage.setItem('melting-settings-v1',JSON.stringify(api.getState().options));localStorage.setItem('melting-clock-v1',api.getState().clockStyle);panel.querySelector('#tune-status').textContent='Saved in this browser.';}
    catch{panel.querySelector('#tune-status').textContent='This browser could not save the settings.';}
  });
  try{const saved=JSON.parse(localStorage.getItem('melting-settings-v1')||'null');if(saved&&typeof saved==='object')api.configure(saved);}catch{}
  try{if(!new URLSearchParams(location.search).has('clock'))api.setClockStyle(localStorage.getItem('melting-clock-v1'));}catch{}
  document.addEventListener('keydown',event=>{
    if(event.shiftKey&&event.key.toLowerCase()==='m'&&!event.target.matches('input,textarea')){event.preventDefault();show(panel.hidden);}
    if(event.key==='Escape'&&!panel.hidden)show(false);
  });
  setInterval(()=>{if(!panel.hidden&&!document.hidden)syncProgress();},120);
  show(new URLSearchParams(location.search).get('tune')==='1');
})();
