/* Photos are free to explore; only the lake unlocks the clock finale. */
(() => {
  const discovered=new Set();
  const canOpen=id=>id!=='clock-reward'||discovered.has('lake-song');
  window.photoJourney={
    canOpen,
    open(id){
      if(!canOpen(id))return false;
      if(!discovered.has(id)){
        discovered.add(id);document.dispatchEvent(new Event('discoverychange'));
      }
      return true;
    }
  };
})();
