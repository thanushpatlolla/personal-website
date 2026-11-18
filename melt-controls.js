/* Compact, local-only art-direction controls. Pointer physics remain untouched. */
(() => {
  const api=window.melting;if(!api)return;
  const local=['localhost','127.0.0.1','[::1]'].includes(location.hostname);
  if(!local&&new URLSearchParams(location.search).get('tune')!=='1')return;
  const key='melt-feel-preview-v2';
  const panel=document.createElement('details');panel.className='melt-ui feel-panel';
  panel.innerHTML=`<summary>feel <span>↘</span></summary><div class="feel-body">
    <label>Try <select id="feel-preset" aria-label="Melt preset"><option value="wax">Soft wax</option><option value="quiet">Gentle sag</option><option value="syrup">Slow syrup</option><option value="original">Previous swirl</option></select></label>
    <label>Area <select id="feel-region" aria-label="Region to tune"><option value="text">Text</option><option value="sky">Sky</option><option value="mountains">Mountains</option></select></label>
    <div id="feel-sliders"></div>
    <label>Starting view <select id="feel-start" aria-label="Starting view"><option value="clear">Clear · click clock to melt</option><option value="auto">15% melted · melt on load</option><option value="melted">Fully melted</option></select></label>
    <label>Clock <select id="feel-clock" aria-label="Clock placement"><option value="warm">Floating original</option><option value="ridge">Original on ridge</option><option value="draped">Draped at right ridge</option></select></label>
    <div class="feel-actions"><button type="button" data-action="clear">clear</button><button type="button" data-action="melt">melt</button><button type="button" data-action="full">full melt</button><button type="button" data-action="save">save</button><button type="button" data-action="reset">reset</button></div>
    <p id="feel-status" role="status">Original mouse response · soft wax melt.</p>
  </div>`;
  document.body.append(panel);
  const region=panel.querySelector('#feel-region'),preset=panel.querySelector('#feel-preset'),clock=panel.querySelector('#feel-clock'),start=panel.querySelector('#feel-start'),status=panel.querySelector('#feel-status');
  const inputs={};
  for(const [name,label,max,help] of [['swirl','Swirl',1,'Sideways bends and idle oscillation'],['sag','Sag',1.25,'Broad downward droop'],['drip','Drips',1.25,'Narrow trails pulled downward'],['settle','Slow settling',1.25,'Gradual downward flow after melting']]){
    const row=document.createElement('label');row.className='feel-slider';row.title=help;
    row.innerHTML=`${label}<output></output><input type="range" min="0" max="${max}" step=".01" aria-label="${label}">`;
    const input=row.querySelector('input'),output=row.querySelector('output');inputs[name]={input,output};
    input.oninput=()=>{api.configureFeel(region.value,{[name]:input.value});preset.value='';sync();};panel.querySelector('#feel-sliders').append(row);
  }
  function sync(){for(const [name,{input,output}] of Object.entries(inputs)){const v=api.getFeel()[region.value][name];input.value=v;output.value=v.toFixed(2);}clock.value=api.getState().clockStyle;}
  function applyStart(){if(start.value==='clear')api.clear();else if(start.value==='melted')api.previewMelt(1);else {api.previewMelt(.15);api.melt();}}
  region.onchange=sync;preset.onchange=()=>{api.presetFeel(preset.value);sync();};clock.onchange=()=>api.setClockStyle(clock.value);start.onchange=applyStart;
  panel.querySelector('[data-action="clear"]').onclick=()=>api.clear();
  panel.querySelector('[data-action="melt"]').onclick=()=>api.melt();
  panel.querySelector('[data-action="full"]').onclick=()=>api.previewMelt(1);
  panel.querySelector('[data-action="save"]').onclick=()=>{try{localStorage.setItem(key,JSON.stringify({feel:api.getFeel(),clock:clock.value,clockRevision:2,start:start.value}));status.textContent='Saved here. Tell me when to adopt it.';}catch{status.textContent='Could not save in this browser.';}};
  panel.querySelector('[data-action="reset"]').onclick=()=>{try{localStorage.removeItem(key);}catch{}api.presetFeel('wax');preset.value='wax';start.value='clear';api.clear();sync();status.textContent='Soft wax defaults restored.';};
  try{const saved=JSON.parse(localStorage.getItem(key));if(saved){for(const name of ['text','sky','mountains'])if(saved.feel?.[name])api.configureFeel(name,saved.feel[name]);if(saved.clock&&(saved.clock!=='draped'||saved.clockRevision===2))api.setClockStyle(saved.clock);if(['clear','auto','melted'].includes(saved.start))start.value=saved.start;applyStart();status.textContent='Loaded saved feel.';}}catch{}
  sync();
  document.addEventListener('keydown',e=>{if(e.shiftKey&&e.key.toLowerCase()==='m'&&!e.target.matches('input,textarea,select')){e.preventDefault();panel.open=!panel.open;}});
})();
