/* First discoveries follow the landscape; revisits remain available. */
(() => {
  const order=['peak-photo','hill-photo','lake-song','clock-reward'];
  let next=0;
  window.photoJourney={
    canOpen(id){const i=order.indexOf(id);return i<0||i<=next;},
    open(id){
      const i=order.indexOf(id);if(i<0)return true;if(i>next)return false;
      if(i===next){next++;document.dispatchEvent(new Event('discoverychange'));}
      return true;
    }
  };
})();
