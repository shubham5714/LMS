import { readFile } from "fs/promises"
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
#__framer-badge-container{display:none!important;visibility:hidden!important;pointer-events:none!important}
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
    window.addEventListener("resize", fit);
    if(document.fonts&&document.fonts.ready)document.fonts.ready.then(fit);
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
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

  if (html.includes("</body>")) {
    html = html.replace("</body>", `${HERO_ROLE_SCRIPT}</body>`)
  } else {
    html = `${html}${HERO_ROLE_SCRIPT}`
  }

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  })
}
