// Memory-only preview shim: registry previews must never persist anything.
const SHIM = `(function(){
try{
function makeStorage(){
  var m=new Map();
  var api={
    getItem:function(k){k=String(k);return m.has(k)?m.get(k):null;},
    setItem:function(k,v){m.set(String(k),String(v));},
    removeItem:function(k){m.delete(String(k));},
    clear:function(){m.clear();},
    key:function(i){var a=Array.from(m.keys());return i>=0&&i<a.length?a[i]:null;}
  };
  var tag=function(){return '[object Storage]';};
  return new Proxy(api,{
    get:function(t,p){
      if(p==='length')return m.size;
      if(typeof p==='symbol'){
        if(p===Symbol.toStringTag)return 'Storage';
        if(p===Symbol.toPrimitive)return tag;
        return undefined;
      }
      if(p==='toString')return tag;
      if(Object.prototype.hasOwnProperty.call(t,p))return t[p];
      return m.has(p)?m.get(p):undefined;
    },
    set:function(t,p,v){if(typeof p!=='symbol')m.set(String(p),String(v));return true;},
    deleteProperty:function(t,p){if(typeof p!=='symbol')m.delete(p);return true;},
    has:function(t,p){return typeof p==='string'&&(m.has(p)||p in t);},
    ownKeys:function(){return Array.from(m.keys());},
    getOwnPropertyDescriptor:function(t,p){
      if(typeof p==='string'&&m.has(p))return {value:m.get(p),writable:true,enumerable:true,configurable:true};
      return undefined;
    }
  });
}
['localStorage','sessionStorage'].forEach(function(name){
  try{
    var s=makeStorage();
    Object.defineProperty(window,name,{get:function(){return s;},configurable:true});
  }catch(e){}
});
try{
  var cookies=new Map();
  Object.defineProperty(document,'cookie',{
    get:function(){return Array.from(cookies.entries()).map(function(e){return e[0]+'='+e[1];}).join('; ');},
    set:function(v){
      var str=String(v);var parts=str.split(';');var first=parts[0];var i=first.indexOf('=');
      var k=(i<0?'':first.slice(0,i)).trim();var val=i<0?first:first.slice(i+1);
      var expired=false;
      for(var j=1;j<parts.length;j++){
        var a=parts[j].trim();var low=a.toLowerCase();
        if(low.indexOf('max-age=')===0){var n=parseInt(a.slice(8),10);if(n<=0)expired=true;}
        else if(low.indexOf('expires=')===0){var t=new Date(a.slice(8)).getTime();if(t<Date.now())expired=true;}
      }
      if(expired)cookies.delete(k);else cookies.set(k,val.trim());
    },
    configurable:true
  });
}catch(e){}
try{Object.defineProperty(window,'indexedDB',{value:undefined,configurable:true});}catch(e){}
}catch(e){}
})();`;

export function injectPreviewShim(html: string): string {
  const script = `<script>${SHIM.replace(/<\/script/gi, "<\\/script")}</script>`;
  const insert = (re: RegExp) => html.replace(re, (m) => m + script);
  if (/<head[\s>]/i.test(html)) return insert(/<head(?:\s[^>]*)?>/i);
  if (/<html[\s>]/i.test(html)) return insert(/<html(?:\s[^>]*)?>/i);
  const doctype = /^\s*<!doctype[^>]*>/i.exec(html);
  if (doctype) return doctype[0] + script + html.slice(doctype[0].length);
  return script + html;
}
