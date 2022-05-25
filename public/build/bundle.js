var app=function(){"use strict";function t(){}function e(t){return t()}function n(){return Object.create(null)}function o(t){t.forEach(e)}function s(t){return"function"==typeof t}function c(t,e){return t!=t?e==e:t!==e||t&&"object"==typeof t||"function"==typeof t}let r,d;function i(t,e){return r||(r=document.createElement("a")),r.href=e,t===r.href}function u(t,e){t.appendChild(e)}function l(t,e,n){t.insertBefore(e,n||null)}function a(t){t.parentNode.removeChild(t)}function f(t){return document.createElement(t)}function m(){return t=" ",document.createTextNode(t);var t}function p(t,e,n){null==n?t.removeAttribute(e):t.getAttribute(e)!==n&&t.setAttribute(e,n)}function g(t){d=t}const h=[],b=[],y=[],$=[],k=Promise.resolve();let E=!1;function I(t){y.push(t)}const _=new Set;let B=0;function w(){const t=d;do{for(;B<h.length;){const t=h[B];B++,g(t),v(t.$$)}for(g(null),h.length=0,B=0;b.length;)b.pop()();for(let t=0;t<y.length;t+=1){const e=y[t];_.has(e)||(_.add(e),e())}y.length=0}while(h.length);for(;$.length;)$.pop()();E=!1,_.clear(),g(t)}function v(t){if(null!==t.fragment){t.update(),o(t.before_update);const e=t.dirty;t.dirty=[-1],t.fragment&&t.fragment.p(t.ctx,e),t.after_update.forEach(I)}}const x=new Set;const M="undefined"!=typeof window?window:"undefined"!=typeof globalThis?globalThis:global;function j(t,e){-1===t.$$.dirty[0]&&(h.push(t),E||(E=!0,k.then(w)),t.$$.dirty.fill(0)),t.$$.dirty[e/31|0]|=1<<e%31}function q(c,r,i,u,l,f,m,p=[-1]){const h=d;g(c);const b=c.$$={fragment:null,ctx:null,props:f,update:t,not_equal:l,bound:n(),on_mount:[],on_destroy:[],on_disconnect:[],before_update:[],after_update:[],context:new Map(r.context||(h?h.$$.context:[])),callbacks:n(),dirty:p,skip_bound:!1,root:r.target||h.$$.root};m&&m(b.root);let y=!1;if(b.ctx=i?i(c,r.props||{},((t,e,...n)=>{const o=n.length?n[0]:e;return b.ctx&&l(b.ctx[t],b.ctx[t]=o)&&(!b.skip_bound&&b.bound[t]&&b.bound[t](o),y&&j(c,t)),e})):[],b.update(),y=!0,o(b.before_update),b.fragment=!!u&&u(b.ctx),r.target){if(r.hydrate){const t=function(t){return Array.from(t.childNodes)}(r.target);b.fragment&&b.fragment.l(t),t.forEach(a)}else b.fragment&&b.fragment.c();r.intro&&(($=c.$$.fragment)&&$.i&&(x.delete($),$.i(k))),function(t,n,c,r){const{fragment:d,on_mount:i,on_destroy:u,after_update:l}=t.$$;d&&d.m(n,c),r||I((()=>{const n=i.map(e).filter(s);u?u.push(...n):o(n),t.$$.on_mount=[]})),l.forEach(I)}(c,r.target,r.anchor,r.customElement),w()}var $,k;g(h)}const{document:L}=M;function N(e){let n,o,s,c,r,d;return{c(){n=f("script"),s=f("script"),r=m(),d=f("body"),d.innerHTML='<section id="profile"><img id="pictureUrl" src="https://mokmoon.com/images/ic_liff.png" class="svelte-rql0u0"/> \n\t\t<p id="userId" class="svelte-rql0u0"></p> \n\t\t<p id="displayName" class="svelte-rql0u0"></p> \n\t\t<p id="statusMessage" class="svelte-rql0u0"></p> \n\t\t<p id="status" class="svelte-rql0u0"></p></section> \n\t\n\t  <section id="feature"></section> \n\t\n\t  <section id="button"></section>',i(n.src,o="https://static.line-scdn.net/liff/edge/2/sdk.js")||p(n,"src","https://static.line-scdn.net/liff/edge/2/sdk.js"),i(s.src,c="https://unpkg.com/@stackblitz/sdk/bundles/sdk.umd.js")||p(s,"src","https://unpkg.com/@stackblitz/sdk/bundles/sdk.umd.js"),p(d,"id","body"),p(d,"class","svelte-rql0u0")},m(t,e){u(L.head,n),u(L.head,s),l(t,r,e),l(t,d,e)},p:t,i:t,o:t,d(t){a(n),a(s),t&&a(r),t&&a(d)}}}function S(t){const e=document.getElementById("body");document.getElementById("btnSend"),document.getElementById("btnClose"),document.getElementById("btnShare"),document.getElementById("btnLogIn"),document.getElementById("btnLogOut"),document.getElementById("btnScanCode"),document.getElementById("btnOpenWindow"),document.getElementById("email");const n=document.getElementById("userId"),o=document.getElementById("pictureUrl"),s=document.getElementById("displayName"),c=document.getElementById("statusMessage");return document.getElementById("code"),document.getElementById("friendShip"),async function(){switch(await liff.init({liffId:"1657163335-3GLvEy0J"}),console.log("Pass"),liff.getOS()){case"andriod":e.style.backgroundColor="black";break;case"ios":e.style.backgroundColor="white"}!async function(){const t=await liff.getProfile();o.src=t.pictureUrl,n.innerHTML="<b>userId:</b> "+t.userId,c.innerHTML="<b>statusMessage:</b> "+t.statusMessage,s.innerHTML="<b>displayName:</b> "+t.displayName}()}(),[]}return new class extends class{$destroy(){!function(t,e){const n=t.$$;null!==n.fragment&&(o(n.on_destroy),n.fragment&&n.fragment.d(e),n.on_destroy=n.fragment=null,n.ctx=[])}(this,1),this.$destroy=t}$on(t,e){const n=this.$$.callbacks[t]||(this.$$.callbacks[t]=[]);return n.push(e),()=>{const t=n.indexOf(e);-1!==t&&n.splice(t,1)}}$set(t){var e;this.$$set&&(e=t,0!==Object.keys(e).length)&&(this.$$.skip_bound=!0,this.$$set(t),this.$$.skip_bound=!1)}}{constructor(t){super(),q(this,t,S,N,c,{})}}({target:document.body,props:{name:"world"}})}();
//# sourceMappingURL=bundle.js.map
