var i=Object.defineProperty;var f=e=>i(e,"__esModule",{value:!0});var u=(e,t)=>{f(e);for(var o in t)i(e,o,{get:t[o],enumerable:!0})};u(exports,{default:()=>x});function a(e){e.directive("tash",(t,{},{evaluate:o,effect:c})=>{let s=t.getAttribute("x-tash").split(",").map(n=>n.trim()),p=document.createElement("template"),m=n=>new RegExp(`{${n}}`,"g");p.innerHTML=t.innerHTML;let r=`${r.innerHTML}`;c(()=>{s.forEach(n=>{let l=o(n),d=m(n);r=r.replace(d,l)}),t.innerHTML=r,r=template.innerHTML})})}var x=a;0&&(module.exports={});
