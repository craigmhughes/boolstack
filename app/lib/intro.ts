export const INTRO_SESSION_KEY = 'boolstack-intro-seen';

/** Inline pre-paint gate: decides whether the intro plays this tab session. */
export const introInitScript = `(function(){try{
var d=document.documentElement;
if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
if(sessionStorage.getItem('${INTRO_SESSION_KEY}'))return;
sessionStorage.setItem('${INTRO_SESSION_KEY}','1');
d.dataset.intro='play';
setTimeout(function(){
if(d.dataset.intro){delete d.dataset.intro;window.dispatchEvent(new CustomEvent('intro:done'));}
},8000);
}catch(e){}})();`;
