/* Regression: shared uncached clock image must resolve every startup waiter. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'../scene.js'),'utf8');
const start=source.indexOf('  function loaded(img)');
const end=source.indexOf('  const icons=[];',start);
const loaded=vm.runInNewContext(source.slice(start,end)+'; loaded;');
class FakeImage extends EventTarget {
  complete=false;naturalWidth=0;
  finish(ok=true){this.complete=true;this.naturalWidth=ok?700:0;const e=new Event(ok?'load':'error');this.dispatchEvent(e);this['on'+e.type]?.(e);}
}
module.exports=(async()=>{
  const cold=new FakeImage();
  const waiters=Promise.all([loaded(cold),loaded(cold)]);
  cold.finish();
  let timer;
  try {await Promise.race([waiters,new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('Shared cold image left a startup waiter unresolved')),100);})]);}
  finally {clearTimeout(timer);}
  await loaded(cold);
  const broken=new FakeImage();const rejection=assert.rejects(loaded(broken));broken.finish(false);await rejection;
  await assert.rejects(loaded(broken));
  console.log('Image readiness: shared cold image, cached image and errors passed.');
})();
