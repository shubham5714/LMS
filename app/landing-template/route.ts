import { readFile, stat } from "fs/promises"
import path from "path"
import { NextResponse } from "next/server"

export const runtime = "nodejs"

/**
 * Hide leftover Framer marketplace chrome.
 * Copy and section edits belong in references/template.html.
 * Behavior patches (styles and scripts) can be injected here the same way
 * DRX Public does in app/landing-template/route.ts.
 */
const PRODUCTION_HIDE_STYLE = `<style id="lms-production-hide">
#__framer-badge-container,
.framer-x1unk3-container,
[data-framer-name="Footer Bottom"] [data-framer-name="Rating"]{
  display:none!important;
  visibility:hidden!important;
  pointer-events:none!important;
}
/* Title stays two lines. The template column is 720px, which wraps a long role onto a third line. */
[data-framer-name="Hero Top"]{
  max-width:min(1120px, calc(100vw - 48px))!important;
  overflow:visible!important;
}
[data-framer-name="Hero description"]{
  max-width:720px!important;
}
[data-framer-name="Hero title"]{
  --framer-text-wrap-override:none!important;
  white-space:normal!important;
  word-break:normal!important;
}
[data-framer-name="Hero title"] h1{
  display:flex!important;
  flex-direction:column!important;
  align-items:center!important;
  justify-content:center!important;
  width:100%!important;
  white-space:normal!important;
  word-break:normal!important;
  overflow-wrap:normal!important;
}
.lms-hero-line{
  display:block!important;
  white-space:nowrap!important;
  word-break:keep-all!important;
  overflow-wrap:normal!important;
  width:max-content;
  max-width:none;
}
[data-lms-role]{
  color:rgb(121,97,245)!important;
  white-space:nowrap!important;
}
[data-lms-role]::after{
  content:"";
  display:inline-block;
  width:2px;
  height:0.82em;
  margin-left:3px;
  background:rgb(121,97,245);
  vertical-align:-0.06em;
  animation:lms-role-caret 1s steps(1) infinite;
}
@keyframes lms-role-caret{50%{opacity:0}}
@media (prefers-reduced-motion:reduce){
  [data-lms-role]::after{animation:none}
}
/* Same eight tool logos and positions as the previous hero. */
[data-framer-name="Section Hero"]{overflow:visible!important}
.lms-hero-floats{position:absolute;left:0;right:0;z-index:1;pointer-events:none}
.lms-float{
  display:none;
  position:absolute;
  align-items:center;
  justify-content:center;
  padding:0.65rem;
  border-radius:1rem;
  border:1px solid rgba(255,255,255,0.1);
  background:#1c1c1c;
  box-shadow:0 2px 12px rgba(0,0,0,0.3);
  animation-timing-function:ease-in-out;
  animation-iteration-count:infinite;
}
.lms-float img{width:2.85rem;height:auto;max-height:2.85rem;object-fit:contain;user-select:none}
.lms-float--1{top:12%;left:6%;animation-name:lms-float-n;animation-duration:5.2s}
.lms-float--2{top:35%;left:3%;animation-name:lms-float-ne;animation-duration:4.8s;animation-delay:.35s}
.lms-float--3{top:58%;left:4%;animation-name:lms-float-e;animation-duration:5.5s;animation-delay:.7s}
.lms-float--4{top:82%;left:10%;animation-name:lms-float-se;animation-duration:4.6s;animation-delay:1.05s}
.lms-float--5{top:12%;right:6%;animation-name:lms-float-s;animation-duration:5.1s;animation-delay:.15s}
.lms-float--6{top:35%;right:3%;animation-name:lms-float-sw;animation-duration:5.4s;animation-delay:.5s}
.lms-float--7{top:58%;right:4%;animation-name:lms-float-w;animation-duration:4.9s;animation-delay:.85s}
.lms-float--8{top:82%;right:10%;animation-name:lms-float-nw;animation-duration:5.3s;animation-delay:1.2s}
@media (min-width:992px){.lms-float{display:flex}}
@keyframes lms-float-n{0%,100%{transform:translate(0,0)}50%{transform:translate(0,-14px)}}
@keyframes lms-float-ne{0%,100%{transform:translate(0,0)}50%{transform:translate(10px,-10px)}}
@keyframes lms-float-e{0%,100%{transform:translate(0,0)}50%{transform:translate(14px,0)}}
@keyframes lms-float-se{0%,100%{transform:translate(0,0)}50%{transform:translate(10px,10px)}}
@keyframes lms-float-s{0%,100%{transform:translate(0,0)}50%{transform:translate(0,14px)}}
@keyframes lms-float-sw{0%,100%{transform:translate(0,0)}50%{transform:translate(-10px,10px)}}
@keyframes lms-float-w{0%,100%{transform:translate(0,0)}50%{transform:translate(-14px,0)}}
@keyframes lms-float-nw{0%,100%{transform:translate(0,0)}50%{transform:translate(-10px,-10px)}}
@media (prefers-reduced-motion:reduce){.lms-float{animation:none}}
/* Framer mobile variants were not exported; adapt desktop nav/footer the same way as DRX Public. */
@media (max-width:1015.98px){
  nav.framer-LVVZm,
  nav[data-framer-name=Desktop],
  nav[data-framer-name="Desktop"]{
    width:100%!important;
    max-width:100%!important;
    box-sizing:border-box!important;
  }
  nav [data-framer-name="Nav Menu"],
  nav [data-framer-name="Button Wrapper"]{display:none!important}
  nav .lms-mobile-toggle{
    display:inline-flex!important;
    align-items:center;
    justify-content:center;
    width:40px;
    height:40px;
    margin-left:auto;
    border:1px solid rgba(255,255,255,.12);
    border-radius:4px;
    background:rgba(255,255,255,.04);
    color:#fff;
    cursor:pointer;
    flex:none;
  }
  nav .lms-mobile-toggle svg{display:block;width:18px;height:18px}
  .lms-mobile-panel{
    display:none;
    position:fixed;
    z-index:10050;
    top:72px;
    left:16px;
    right:16px;
    max-height:calc(100vh - 96px);
    overflow:auto;
    padding:16px;
    border:1px solid rgba(255,255,255,.1);
    border-radius:8px;
    background:rgba(14,15,19,.96);
    backdrop-filter:blur(16px);
    box-shadow:0 16px 40px rgba(0,0,0,.45);
  }
  .lms-mobile-panel.is-open{display:flex;flex-direction:column;gap:4px}
  .lms-mobile-panel a{
    display:block;
    padding:12px 14px;
    border-radius:6px;
    color:#fff!important;
    text-decoration:none!important;
    font:500 15px/1.3 Inter,system-ui,sans-serif;
  }
  .lms-mobile-panel a:hover,
  .lms-mobile-panel a:focus-visible{background:rgba(255,255,255,.06)}
  .lms-mobile-panel a.lms-mobile-cta{
    margin-top:8px;
    text-align:center;
    background:rgb(122,95,255)!important;
    box-shadow:rgba(122,95,255,.15) 0 0 0 2px,rgba(122,95,255,.45) 0 1px 2px 1px;
  }
  .lms-mobile-panel a.lms-mobile-cta:hover,
  .lms-mobile-panel a.lms-mobile-cta:focus-visible{filter:brightness(1.06)}
  .lms-mobile-backdrop{
    display:none;
    position:fixed;
    inset:0;
    z-index:10040;
    background:rgba(0,0,0,.45);
  }
  .lms-mobile-backdrop.is-open{display:block}
}
@media (min-width:1016px){
  nav.framer-LVVZm,
  nav[data-framer-name=Desktop],
  nav[data-framer-name="Desktop"]{
    width:max-content!important;
    max-width:calc(100vw - 32px)!important;
  }
  nav [data-framer-name="Nav Menu"]{
    margin-left:40px!important;
    gap:16px!important;
    flex-wrap:nowrap!important;
  }
  nav [data-framer-name="Button Wrapper"]{
    margin-left:20px!important;
  }
  nav [data-framer-name="Nav Menu"] p{
    white-space:nowrap!important;
  }
}
nav a[data-framer-name=White]{
  width:auto!important;
  height:auto!important;
  overflow:visible!important;
  display:flex!important;
  align-items:center!important;
  text-decoration:none!important;
  flex:none!important;
}
nav a[data-framer-name=White] [data-framer-background-image-wrapper]{display:none!important}
nav a[data-framer-name=White] .lms-wordmark{
  display:block;
  height:30px;
  width:auto;
}
@media (min-width:1016px){
  nav .lms-mobile-toggle,
  .lms-mobile-panel,
  .lms-mobile-backdrop{display:none!important}
}
@media (max-width:809.98px){
  footer.framer-BbRsn,
  footer[data-framer-name=Desktop],
  footer[data-framer-name="Desktop"]{
    padding:64px 20px 40px!important;
    overflow:visible!important;
  }
  [data-framer-name="Footer Top"]{
    flex-direction:column!important;
    align-items:stretch!important;
    justify-content:flex-start!important;
    gap:40px!important;
    width:100%!important;
  }
  [data-framer-name="Footer Left"],
  [data-framer-name="Logo Container"],
  [data-framer-name="Footer Left"] [data-framer-name=Description],
  [data-framer-name="Footer Left"] [data-framer-name="Description"],
  footer .framer-d18dyi,
  footer .framer-forvwt,
  footer .framer-pumzwt{
    width:100%!important;
    max-width:100%!important;
    flex:none!important;
  }
  [data-framer-name="Footer Links Wrapper"],
  footer .framer-sy0420{
    display:grid!important;
    grid-template-columns:repeat(2,minmax(0,1fr))!important;
    grid-auto-rows:auto!important;
    width:100%!important;
    max-width:100%!important;
    gap:28px 24px!important;
    flex:none!important;
  }
  [data-framer-name="Footer Column"]{
    width:100%!important;
    max-width:100%!important;
  }
  [data-framer-name="Footer Links Wrapper"]>[data-framer-name="Footer Column"]:nth-child(3){
    grid-column:1!important;
  }
  [data-framer-name="Social Wrapper"],
  footer [data-framer-name="Social Wrapper"]{
    display:flex!important;
    flex-direction:row!important;
    flex-wrap:nowrap!important;
    align-items:center!important;
    gap:12px!important;
  }
}
@media (min-width:810px) and (max-width:1015.98px){
  footer.framer-BbRsn,
  footer[data-framer-name=Desktop],
  footer[data-framer-name="Desktop"]{
    padding:80px 40px 48px!important;
  }
  [data-framer-name="Footer Top"]{
    flex-direction:column!important;
    align-items:stretch!important;
    gap:40px!important;
  }
  [data-framer-name="Footer Left"],
  [data-framer-name="Logo Container"],
  footer .framer-d18dyi,
  footer .framer-forvwt,
  footer .framer-pumzwt{
    width:100%!important;
    max-width:100%!important;
    flex:none!important;
  }
  [data-framer-name="Footer Links Wrapper"],
  footer .framer-sy0420{
    width:100%!important;
    max-width:100%!important;
    display:grid!important;
    grid-template-columns:repeat(3,minmax(0,1fr))!important;
    gap:32px 24px!important;
    flex:none!important;
  }
}
#features > :not(.lms-paths){display:none!important}
#features{display:block!important;height:auto!important;overflow:visible!important}
.lms-paths{width:100%;max-width:1240px;margin:0 auto;padding:88px 0 72px;box-sizing:border-box}
.lms-paths__header{display:flex;flex-direction:column;gap:28px;margin-bottom:28px}
.lms-paths__copy{display:flex;flex-direction:column;align-items:flex-start;gap:48px}
.lms-paths__eyebrow{display:inline-flex;align-items:center;gap:8px;width:max-content;margin:0;padding:4px 8px;position:relative;background:rgba(122,95,255,.1);border:1px solid rgba(255,255,255,.05);color:#ececec;font-family:Inter,"Inter Placeholder",sans-serif;font-size:14px;font-weight:500;letter-spacing:-.6px;line-height:1.3}
.lms-paths__eyebrow svg{display:block;flex:none}
.lms-paths__rocket{width:14px;height:14px}
.lms-paths__corner{position:absolute;width:5px;height:5px;pointer-events:none}
.lms-paths__corner--tr{top:0;right:0}
.lms-paths__corner--br{right:0;bottom:0}
.lms-paths__corner--bl{bottom:0;left:0}
.lms-paths__corner--tl{top:0;left:0}
.lms-paths__title{margin:0;font-family:"Inter Display","Inter Display Placeholder",sans-serif;font-weight:500;font-size:56px;letter-spacing:-2px;line-height:1.1;color:#ececec}
.lms-paths__subtitle{margin:20px 0 0;max-width:36rem;font-family:Inter,"Inter Placeholder",sans-serif;font-weight:500;font-size:18px;letter-spacing:-.8px;line-height:1.3;color:#ddd}
.lms-paths__tabs{display:inline-flex;gap:4px;padding:4px;border-radius:12px;background:#242424;flex:none}
.lms-paths__tabs button{height:36px;padding:0 14px;border:0;border-radius:8px;background:transparent;color:rgba(255,255,255,.65);font:500 13px/1 Inter,sans-serif;cursor:pointer;white-space:nowrap}
.lms-paths__tabs button.is-active{background:#3a3a3a;color:#fff}
.lms-paths__panel{border-radius:24px;background:#111;padding:20px}
.lms-paths__grid{display:grid;gap:16px}
.lms-paths__card{display:flex;flex-direction:column;height:100%;padding:22px;border-radius:16px;background:#242424;text-decoration:none;color:inherit}
.lms-paths__card:hover h3{color:rgb(121,97,245)}
.lms-paths__card-top{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}
.lms-paths__card-icon{display:grid;place-items:center;width:44px;height:44px;border-radius:999px;background:rgba(121,97,245,.16);color:rgb(176,164,255)}
.lms-paths__card-icon svg{width:22px;height:22px;display:block}
.lms-paths__card-level{padding:6px 10px;border-radius:6px;background:rgba(121,97,245,.16);color:rgb(176,164,255);font:500 11px/1.2 Inter,sans-serif;white-space:nowrap}
.lms-paths__card h3{margin:18px 0 10px;font-family:"Inter Display","Inter Display Placeholder",sans-serif;font-size:17px;font-weight:500;letter-spacing:0;line-height:1.35;color:#ececec}
.lms-paths__card p{margin:0;flex:1;font:400 13.5px/1.5 Inter,sans-serif;color:rgba(236,236,236,.72)}
.lms-paths__card-meta{margin-top:14px;font:400 12px/1.3 Inter,sans-serif;color:rgba(255,255,255,.5)}
.lms-paths__more{margin-top:16px;text-align:center}
.lms-paths__more a{color:#ececec;font:500 14px/1 Inter,sans-serif;text-decoration:none}
.lms-paths__more a:hover{color:rgb(121,97,245)}
@media (min-width:768px){.lms-paths__grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (min-width:900px){.lms-paths__header{flex-direction:row;align-items:flex-end;justify-content:space-between}}
@media (min-width:992px){.lms-paths__grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
@media (max-width:1199px) and (min-width:810px){.lms-paths__title{font-size:45px}}
@media (max-width:809.98px){
  .lms-paths{padding:56px 0 48px}
  .lms-paths__title{font-size:36px}
  .lms-paths__tabs{display:flex;width:100%}
  .lms-paths__tabs button{flex:1;padding:0 8px}
}
</style>`

/** Two lines: the sentence, then "a job-ready" plus the cycling role. */
const HERO_TITLE_HTML = `<span class=lms-hero-line>Everything you need to become</span><span class=lms-hero-line>a job-ready <span data-lms-role>SOC Analyst</span></span>`

const PREVIOUS_HERO_TITLE =
  '<h1 class="framer-text framer-styles-preset-bc00tz" data-styles-preset=YzKDtHK7h style=--framer-text-alignment:center><span style=display:inline-block;opacity:1;filter:blur(0px);transform:none;will-change:transform>Manage</span> <span style=display:inline-block;opacity:1;filter:blur(0px);transform:none;will-change:transform>projects,</span> <span style=display:inline-block;opacity:1;filter:blur(0px);transform:none;will-change:transform>tasks,</span> <span style=display:inline-block;opacity:1;filter:blur(0px);transform:none;will-change:transform>and</span> <span style=display:inline-block;opacity:1;filter:blur(0px);transform:none;will-change:transform>team</span> <span style=display:inline-block;opacity:1;filter:blur(0px);transform:none;will-change:transform>workflows</span></h1>'

const NEXT_HERO_TITLE = `<h1 class="framer-text framer-styles-preset-bc00tz" data-styles-preset=YzKDtHK7h style=--framer-text-alignment:center>${HERO_TITLE_HTML}</h1>`

const PREVIOUS_HERO_SUBTITLE =
  "Planquo brings clarity to your daily work with flexible project boards, real-time collaboration, and integrated docs, so your team stays aligned and on track."

const NEXT_HERO_SUBTITLE =
  "Learn the fundamentals, build real investigations, practice SIEM workflows, and run hands-on labs — one platform, start to hired."

const HERO_ROLE_SCRIPT = `<script id="lms-hero-role">
(function(){
  var roles=["SOC Analyst","Detection Engineer","Incident Responder","DFIR Analyst","Automation Engineer"];
  var longest="Automation Engineer";
  var typeMs=70, deleteMs=40, holdMs=1600, gapMs=280;
  function fit(){
    var top=document.querySelector('[data-framer-name="Hero Top"]');
    var h1=document.querySelector('[data-framer-name="Hero title"] h1');
    var roleEl=document.querySelector("[data-lms-role]");
    if(!top||!h1)return;
    var saved=roleEl?roleEl.textContent:"";
    if(roleEl)roleEl.textContent=longest;
    h1.style.fontSize="";
    var available=top.clientWidth;
    var lines=h1.querySelectorAll(".lms-hero-line");
    var widest=0;
    for(var n=0;n<lines.length;n++){
      widest=Math.max(widest, lines[n].getBoundingClientRect().width);
    }
    var size=parseFloat(getComputedStyle(h1).fontSize)||64;
    if(widest>available && available>0){
      h1.style.fontSize=Math.max(22, size*((available-4)/widest))+"px";
    }
    if(roleEl)roleEl.textContent=saved;
  }
  var floatTools=[
    ["Microsoft Sentinel","/assets/images/brand-logos/landing-sentinel.png","lms-float--1"],
    ["Elastic","/assets/images/brand-logos/landing-elastic.png","lms-float--2"],
    ["Palo Alto","/assets/images/brand-logos/landing-paloalto.png","lms-float--3"],
    ["CrowdStrike","/assets/images/brand-logos/landing-crowdstrike.png","lms-float--4"],
    ["Trend Micro","/assets/images/brand-logos/landing-trendmicro.png","lms-float--5"],
    ["QRadar","/assets/images/brand-logos/landing-qradar.png","lms-float--6"],
    ["Splunk","/assets/images/brand-logos/landing-splunk.png","lms-float--7"],
    ["Zscaler","/assets/images/brand-logos/landing-zscaler.png","lms-float--8"]
  ];
  function placeFloats(){
    var section=document.querySelector('[data-framer-name="Section Hero"]');
    var hero=document.querySelector('[data-framer-name="Hero Top"]');
    if(!section||!hero)return;
    var layer=section.querySelector(".lms-hero-floats");
    if(!layer){
      layer=document.createElement("div");
      layer.className="lms-hero-floats";
      layer.setAttribute("aria-hidden","true");
      for(var t=0;t<floatTools.length;t++){
        var item=floatTools[t];
        var card=document.createElement("div");
        card.className="lms-float "+item[2];
        var img=document.createElement("img");
        img.src=item[1];
        img.alt="";
        img.width=46;
        img.height=46;
        img.draggable=false;
        card.appendChild(img);
        layer.appendChild(card);
      }
      section.appendChild(layer);
    }
    var sectionBox=section.getBoundingClientRect();
    var heroBox=hero.getBoundingClientRect();
    layer.style.top="0px";
    layer.style.height=Math.max(0, heroBox.bottom-sectionBox.top)+"px";
  }
  function layout(){
    fit();
    placeFloats();
  }
  function run(){
    var el=document.querySelector("[data-lms-role]");
    if(!el)return;
    fit();
    var role=0, i=roles[0].length, deleting=false;
    function tick(){
      var full=roles[role];
      if(!deleting){
        if(i<full.length){
          i++;
          el.textContent=full.slice(0,i);
          setTimeout(tick, typeMs);
          return;
        }
        setTimeout(function(){deleting=true;tick();}, holdMs);
        return;
      }
      if(i>0){
        i--;
        el.textContent=full.slice(0,i);
        setTimeout(tick, deleteMs);
        return;
      }
      deleting=false;
      role=(role+1)%roles.length;
      setTimeout(tick, gapMs);
    }
    setTimeout(tick, holdMs);
  }
  function boot(){
    run();
    placeFloats();
    window.addEventListener("resize", layout);
    if(document.fonts&&document.fonts.ready)document.fonts.ready.then(layout);
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
</script>`

/** Mobile hamburger. The export only includes the desktop nav. */
const NAV_SCRIPT = `<script id="lms-nav-script">
(function(){
  function linkLabel(a){
    if(!a)return "";
    var p=a.querySelector("p");
    var raw=p?p.textContent:a.textContent;
    return (raw||"").replace(/\\s+/g," ").trim();
  }
  function uniqueLabels(anchors){
    var out=[], seen={};
    for(var i=0;i<anchors.length;i++){
      var a=anchors[i];
      var label=linkLabel(a);
      if(!label||seen[label])continue;
      seen[label]=1;
      out.push({href:a.getAttribute("href")||"#", label:label});
    }
    return out;
  }
  function applyLogo(){
    var links=document.querySelectorAll("nav a[data-framer-name=White]");
    for(var i=0;i<links.length;i++){
      var link=links[i];
      link.setAttribute("href","/");
      link.setAttribute("aria-label","Cyber Peers");
      if(link.querySelector(".lms-wordmark"))continue;
      var mark=document.createElement("img");
      mark.className="lms-wordmark";
      mark.src="__LMS_LOGO__";
      mark.alt="Cyber Peers";
      mark.draggable=false;
      link.appendChild(mark);
    }
  }
  function applyMenu(){
    var menu=document.querySelector('nav [data-framer-name="Nav Menu"]');
    if(!menu||!menu.children.length)return;
    var items=[
      ["Courses","/courses"],
      ["Tracks","/tracks"],
      ["Labs","/labs"],
      ["Virtual SOC","/virtual-soc"],
      ["Mentorship","/mentorship"],
      ["Resources","/resources"],
      ["Community","/community"],
      ["Pricing","/pages/pricing"]
    ];
    var proto=menu.children[0];
    while(menu.children.length<items.length){
      menu.appendChild(proto.cloneNode(true));
    }
    while(menu.children.length>items.length){
      menu.removeChild(menu.lastElementChild);
    }
    for(var i=0;i<items.length;i++){
      var link=menu.children[i].querySelector("a");
      if(!link)continue;
      link.setAttribute("href", items[i][1]);
      var labels=link.querySelectorAll("p");
      for(var n=0;n<labels.length;n++) labels[n].textContent=items[i][0];
    }
  }
  function armMobile(){
    var nav=document.querySelector("nav");
    if(!nav||nav.dataset.lmsMobile==="1")return;
    nav.dataset.lmsMobile="1";
    var menu=nav.querySelector('[data-framer-name="Nav Menu"]');
    var actions=nav.querySelector('[data-framer-name="Button Wrapper"]');
    var items=uniqueLabels(menu?menu.querySelectorAll("a"):[]);
    var cta=actions?actions.querySelector("a"):null;
    if(cta){
      items.push({
        href:cta.getAttribute("href")||"#",
        label:linkLabel(cta)||"Start for Free",
        cta:true
      });
    }
    var btn=document.createElement("button");
    btn.type="button";
    btn.className="lms-mobile-toggle";
    btn.setAttribute("aria-label","Open menu");
    btn.setAttribute("aria-expanded","false");
    btn.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>';
    var container=nav.querySelector('[data-framer-name=Container]')||nav.querySelector(".framer-yg3pqa")||nav;
    if(actions&&actions.parentNode){
      actions.parentNode.insertBefore(btn, actions.nextSibling);
    }else{
      container.appendChild(btn);
    }
    var backdrop=document.createElement("div");
    backdrop.className="lms-mobile-backdrop";
    var panel=document.createElement("div");
    panel.className="lms-mobile-panel";
    panel.setAttribute("role","dialog");
    panel.setAttribute("aria-label","Menu");
    for(var i=0;i<items.length;i++){
      var item=items[i];
      var link=document.createElement("a");
      link.href=item.href;
      link.textContent=item.label;
      if(item.cta)link.className="lms-mobile-cta";
      panel.appendChild(link);
    }
    document.body.appendChild(backdrop);
    document.body.appendChild(panel);
    function setOpen(open){
      panel.classList.toggle("is-open", open);
      backdrop.classList.toggle("is-open", open);
      btn.setAttribute("aria-expanded", open?"true":"false");
      btn.setAttribute("aria-label", open?"Close menu":"Open menu");
      document.documentElement.style.overflow=open?"hidden":"";
    }
    btn.addEventListener("click", function(ev){
      ev.preventDefault();
      setOpen(!panel.classList.contains("is-open"));
    });
    backdrop.addEventListener("click", function(){setOpen(false);});
    panel.addEventListener("click", function(ev){
      var t=ev.target;
      if(t&&t.tagName==="A")setOpen(false);
    });
    window.addEventListener("keydown", function(ev){
      if(ev.key==="Escape")setOpen(false);
    });
  }
  function run(){applyLogo();applyMenu();armMobile();}
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded", run);
  else run();
})();
</script>`

const PATHS_SCRIPT = `<script id="lms-paths">
(function(){
  var tabs=[
    {id:"tracks",label:"Career Tracks"},
    {id:"courses",label:"Courses"},
    {id:"skills",label:"Skill Tracks"}
  ];
  var icons={
    shield:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 3.5 19 6.3v5.4c0 4.2-2.8 7.2-7 8.8-4.2-1.6-7-4.6-7-8.8V6.3L12 3.5z"/></svg>',
    radar:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="8"/><path d="M12 12 17 9M12 8v4"/></svg>',
    bug:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M8 9a4 4 0 0 1 8 0v2H8V9zM6 13h12M9 17v3M15 17v3M7 11 4 9M17 11l3-2"/></svg>',
    cap:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="m3 10 9-5 9 5-9 5-9-5z"/><path d="M7 12v4c0 1.5 2.2 3 5 3s5-1.5 5-3v-4"/></svg>',
    alarm:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="13" r="7"/><path d="M12 9v5l3 2M5 4 3 6M19 4l2 2"/></svg>',
    db:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6"/></svg>',
    search:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="11" cy="11" r="6"/><path d="m20 20-3.5-3.5"/></svg>',
    flow:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="3" width="6" height="6" rx="1"/><rect x="15" y="15" width="6" height="6" rx="1"/><path d="M6 9v3a3 3 0 0 0 3 3h6"/></svg>'
  };
  var data={
    tracks:[
      {title:"SOC Analyst",level:"Beginner → Intermediate",href:"/tracks/soc-analyst",description:"Zero to job-ready SOC analyst — roles, threat lifecycle, triage, SIEM fundamentals, and log analysis, with hands-on labs after every stage.",meta:"4.9 · 12+ hours · 2 courses · guided path",icon:"shield"},
      {title:"SIEM Practitioner",level:"Intermediate",href:"/tracks/siem-practitioner",description:"Operate Securonix in production — architecture, tenant activation, UI workflows, AI agents, and Hub installation.",meta:"4.8 · 9 hours · 6 modules · labs",icon:"radar"},
      {title:"Detection Engineer",level:"Intermediate → Advanced",href:"/courses",description:"Build detection use cases, tune alert quality, and validate investigations across SIEM and security telemetry.",meta:"4.8 · skill-focused · scenarios",icon:"bug"}
    ],
    courses:[
      {title:"SOC Fundamentals",level:"Beginner",href:"/courses/soc-fundamentals",description:"Core security operations concepts: roles, threat lifecycle, triage, SIEM basics, and log analysis.",meta:"6 hrs · 6 modules · 28 lessons",icon:"cap"},
      {title:"Securonix SIEM",level:"Intermediate",href:"/courses/securonix-siem",description:"Platform architecture, tenant activation, UI tour, AI agents, and Hub installation.",meta:"9 hrs · 6 modules · 42 lessons",icon:"radar"},
      {title:"Incident Triage Lab",level:"Beginner",href:"/courses/soc-fundamentals/incident-triage",description:"Practice real alert workflows — prioritize, investigate, and document like a day-one analyst.",meta:"hands-on · SOC workflows",icon:"alarm"}
    ],
    skills:[
      {title:"SIEM Fundamentals",level:"Beginner → Intermediate",href:"/courses/soc-fundamentals/siem-fundamentals",description:"Query, correlate, and operationalize SIEM alerts with confidence.",meta:"skill track · detection basics",icon:"db"},
      {title:"Log Analysis",level:"Beginner",href:"/courses/soc-fundamentals/log-analysis",description:"Read telemetry, spot anomalies, and turn raw logs into investigation leads.",meta:"skill track · evidence first",icon:"search"},
      {title:"Threat Lifecycle",level:"Beginner",href:"/courses/soc-fundamentals/threat-lifecycle",description:"Map attacker behavior from initial access through impact and recovery.",meta:"skill track · kill chain",icon:"flow"}
    ]
  };
  function el(tag, cls, text){
    var node=document.createElement(tag);
    if(cls) node.className=cls;
    if(text) node.textContent=text;
    return node;
  }
  function render(grid, id){
    grid.replaceChildren();
    data[id].forEach(function(card){
      var link=el("a","lms-paths__card");
      link.href=card.href;
      var top=el("div","lms-paths__card-top");
      var icon=el("span","lms-paths__card-icon");
      icon.innerHTML=icons[card.icon];
      top.appendChild(icon);
      top.appendChild(el("span","lms-paths__card-level",card.level));
      link.appendChild(top);
      link.appendChild(el("h3","",card.title));
      link.appendChild(el("p","",card.description));
      link.appendChild(el("span","lms-paths__card-meta",card.meta));
      grid.appendChild(link);
    });
  }
  function corner(cls, d1, d2){
    return '<svg class="lms-paths__corner lms-paths__corner--'+cls+'" viewBox="0 0 5 5" aria-hidden="true"><path d="'+d1+'" fill="#EDEDFA"/><path d="'+d2+'" fill="#EDEDFA"/></svg>';
  }
  function eyebrow(){
    var node=el("p","lms-paths__eyebrow");
    node.innerHTML='<svg class="lms-paths__rocket" viewBox="0 0 14 15" fill="none" aria-hidden="true"><path stroke="#ECECEC" stroke-linecap="round" stroke-linejoin="round" stroke-width=".875" d="M9.094 8.485a3.5 3.5 0 0 1-3.407 4.305v-2.8m3.407-1.505a8.74 8.74 0 0 0 3.594-7.07 8.74 8.74 0 0 0-7.07 3.593m3.476 3.477A8.7 8.7 0 0 1 5.688 9.99m-.07-4.982a3.5 3.5 0 0 0-4.306 3.407h2.8m1.506-3.407a8.7 8.7 0 0 0-1.505 3.407M5.687 9.99l-.181.035a8.8 8.8 0 0 1-1.428-1.428l.035-.182M2.807 9.81a2.62 2.62 0 0 0-1.026 2.511 2.62 2.62 0 0 0 2.512-1.026m5.332-5.942a.875.875 0 1 1-1.75 0 .875.875 0 0 1 1.75 0"/></svg><span>Choose your path</span>'
      +corner("tr","M4.50781 0.0869141H3.50781V4.08691H4.50781V0.0869141Z","M4.50781 0.0869141H0.507812V1.08691H4.50781V0.0869141Z")
      +corner("br","M4.50781 4.08887H3.50781V0.0888672H4.50781V4.08887Z","M4.50781 4.08887H0.507812V3.08887H4.50781V4.08887Z")
      +corner("bl","M0.492188 4.08301H1.49219V0.0830078H0.492188V4.08301Z","M0.492188 4.08301H4.49219V3.08301H0.492188V4.08301Z")
      +corner("tl","M0.492188 0.0869141H1.49219V4.08691H0.492188V0.0869141Z","M0.492188 0.0869141H4.49219V1.08691H0.492188V0.0869141Z");
    return node;
  }
  function mount(){
    var section=document.getElementById("features");
    if(!section||section.querySelector(".lms-paths")) return;
    var root=el("div","lms-paths");
    var head=el("div","lms-paths__header");
    var copy=el("div","lms-paths__copy");
    copy.appendChild(eyebrow());
    var text=el("div","lms-paths__text");
    var title=el("h2","lms-paths__title","Pick the role. Follow the path.");
    title.id="landing-paths-heading";
    text.appendChild(title);
    text.appendChild(el("p","lms-paths__subtitle","Follow a complete career track, or focus on one skill at a time. Every path starts with the foundations and builds toward job-ready skills."));
    copy.appendChild(text);
    head.appendChild(copy);
    var tablist=el("div","lms-paths__tabs");
    tablist.setAttribute("role","tablist");
    tablist.setAttribute("aria-label","Learning catalog");
    head.appendChild(tablist);
    root.appendChild(head);
    var panel=el("div","lms-paths__panel");
    panel.setAttribute("role","tabpanel");
    var grid=el("div","lms-paths__grid");
    panel.appendChild(grid);
    var more=el("div","lms-paths__more");
    var moreLink=el("a","","Explore all tracks");
    moreLink.href="/tracks";
    more.appendChild(moreLink);
    panel.appendChild(more);
    root.appendChild(panel);
    section.setAttribute("aria-labelledby","landing-paths-heading");
    section.appendChild(root);
    tabs.forEach(function(tab){
      var button=el("button", tab.id==="tracks"?"is-active":"");
      button.type="button";
      button.setAttribute("role","tab");
      button.setAttribute("aria-selected", tab.id==="tracks"?"true":"false");
      button.textContent=tab.label;
      button.addEventListener("click", function(){
        tablist.querySelectorAll("button").forEach(function(other){
          var on=other===button;
          other.classList.toggle("is-active", on);
          other.setAttribute("aria-selected", on?"true":"false");
        });
        render(grid, tab.id);
      });
      tablist.appendChild(button);
    });
    render(grid, "tracks");
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded", mount);
  else mount();
})();
</script>`

function applyHeroCopy(html: string) {
  if (!html.includes(PREVIOUS_HERO_TITLE) || !html.includes(PREVIOUS_HERO_SUBTITLE)) {
    throw new Error("Hero title or subtitle was not found in references/template.html")
  }

  let next = html.replace(PREVIOUS_HERO_TITLE, NEXT_HERO_TITLE)
  next = next.replace(PREVIOUS_HERO_SUBTITLE, NEXT_HERO_SUBTITLE)

  const marker = 'data-framer-name="CTA Wrapper"'
  const start = next.indexOf(marker)
  const end = next.indexOf("Trusted by", start)
  if (start < 0 || end < 0) {
    throw new Error("Hero CTA wrapper was not found in references/template.html")
  }

  let cta = next.slice(start, end)
  const primaryLabel = cta.replace(">Start for free</p>", ">Browse Courses</p>")
  const secondaryLabel = primaryLabel.replace(">Book a demo</p>", ">Explore Tracks</p>")
  if (secondaryLabel === cta) {
    throw new Error("Hero CTA labels were not found in references/template.html")
  }
  cta = secondaryLabel
    .replace("href=https://oma-planquo.framer.website/download", 'href="/courses"')
    .replace("href=https://oma-planquo.framer.website/contact", 'href="/tracks"')

  return next.slice(0, start) + cta + next.slice(end)
}

export async function GET() {
  const raw = await readFile(
    path.join(process.cwd(), "references", "template.html"),
    "utf8"
  )
  let html = applyHeroCopy(raw)
  html = html.includes("</head>")
    ? html.replace("</head>", `${PRODUCTION_HIDE_STYLE}</head>`)
    : `${PRODUCTION_HIDE_STYLE}${html}`

  const logoStat = await stat(
    path.join(process.cwd(), "public", "assets", "images", "brand-logos", "lms-logo.png")
  )
  const logoSrc = `/assets/images/brand-logos/lms-logo.png?v=${Math.floor(logoStat.mtimeMs)}`
  const bootScripts = `${HERO_ROLE_SCRIPT}${NAV_SCRIPT.replace("__LMS_LOGO__", logoSrc)}${PATHS_SCRIPT}`
  if (html.includes("</body>")) {
    html = html.replace("</body>", `${bootScripts}</body>`)
  } else {
    html = `${html}${bootScripts}`
  }

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  })
}
