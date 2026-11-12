/* Study Studio — shared engine
   Each class page includes this file + data/classN.js */

const $=s=>document.querySelector(s);
const esc=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]]}return a};
const pick=a=>a[Math.random()*a.length|0];
const LET="ABCD";
const AR_OPTS=[
  "Both A and R are true, and R explains A",
  "Both A and R are true, but R does not explain A",
  "A is true, but R is false",
  "A is false, but R is true"
];

/* ---------- storage ---------- */
const KEY="study_studio_v3";
let S;
function load(){try{S=JSON.parse(localStorage.getItem(KEY))||{}}catch(e){S={}}
  S.q=S.q||{};S.days=S.days||{};S.wr=S.wr||{};S.tests=S.tests||[];
  S.xp=S.xp||0;S.goal=S.goal||30}
function save(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}}
load();

const today=()=>{const d=new Date();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")};
function bumpDay(n=1){const t=today();S.days[t]=(S.days[t]||0)+n}
function streak(){let s=0;const d=new Date();if(!S.days[today()])d.setDate(d.getDate()-1);
  while(true){const k=d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
  if(S.days[k]){s++;d.setDate(d.getDate()-1)}else break}return s}
function toast(m){const t=$("#toast");t.textContent=m;t.classList.add("show");
  clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove("show"),2200)}

/* ---------- routes ---------- */
let route={v:"home"};
function go(v,p={}){route=Object.assign({v},p);render();window.scrollTo(0,0)}
document.querySelectorAll("#nav button").forEach(b=>{
  b.onclick=()=>go(b.dataset.go);
});
function setNav(){document.querySelectorAll("#nav button").forEach(b=>
  b.classList.toggle("on",b.dataset.go===route.v));
  $("#nav").style.display=route.v==="quiz"?"none":"flex"}

/* ---------- data helpers ---------- */
const CLS = window.CLASS_DATA;                 // set by data/classN.js
const subj=id=>CLS.subjects.find(s=>s.id===id);
function allQs(){const out=[];for(const s of CLS.subjects)
  for(const ch of s.chapters) for(const q of ch.qs)
    out.push(Object.assign({sid:s.id,cn:ch.n},q));
  return out}
let ALL=[];
function initAll(){ALL=allQs()}
const QMAP={};
function initMap(){ALL.forEach(q=>QMAP[q.id]=q)}

function chMastery(ch){const n=ch.qs.length;if(!n)return 0;
  let c=0;for(const q of ch.qs){const r=S.q[q.id];if(r&&r.l)c++}
  return Math.round(c*100/n)}
function chSeen(ch){let c=0;for(const q of ch.qs)if(S.q[q.id])c++;return c}
function subjMastery(s){let t=0,c=0;for(const ch of s.chapters)
  for(const q of ch.qs){t++;const r=S.q[q.id];if(r&&r.l)c++}
  return t?Math.round(c*100/t):0}

/* ---------- render dispatcher ---------- */
function render(){setNav();initAll();initMap();
  const el=$("#app");
  ({home:vHome,subject:vSubject,chapter:vChapter,quiz:vQuiz,result:vResult,
    exam:vExam,mistakes:vMistakes,progress:vProgress})[route.v](el)}

/* ---------- HOME ---------- */
function vHome(el){
  const st=streak();const td=S.days[today()]||0;
  const hr=new Date().getHours();
  const greet=hr<12?"Good morning ☀️":hr<17?"Good afternoon 🌤️":"Good evening 🌙";
  let mastered=0;ALL.forEach(q=>{if(S.q[q.id]&&S.q[q.id].l)mastered++});
  const tot=ALL.length;
  const wrongCount=ALL.filter(q=>S.q[q.id]&&!S.q[q.id].l).length;
  el.innerHTML=`
  <div class="hero" style="background:linear-gradient(135deg,#5b4bdb,#8b5cf6 60%,#c084fc);
    color:#fff;border-radius:26px;padding:22px;position:relative;overflow:hidden">
    <div style="opacity:.9;font-size:15px">${greet}</div>
    <h1 style="font-size:30px;margin:2px 0 6px">${CLS.name} Studio 🌸</h1>
    <div style="font-size:14px;opacity:.85">${new Date().toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long"})}</div>
    <div style="display:flex;gap:10px;margin-top:16px;flex-wrap:wrap">
      <div style="background:rgba(255,255,255,.18);border-radius:14px;padding:8px 12px;font-size:14px">
        <b style="font-size:18px;display:block">🔥 ${st}</b>day streak</div>
      <div style="background:rgba(255,255,255,.18);border-radius:14px;padding:8px 12px;font-size:14px">
        <b style="font-size:18px;display:block">${td}/${S.goal}</b>today's goal</div>
      <div style="background:rgba(255,255,255,.18);border-radius:14px;padding:8px 12px;font-size:14px">
        <b style="font-size:18px;display:block">⭐ ${S.xp}</b>XP</div>
      <div style="background:rgba(255,255,255,.18);border-radius:14px;padding:8px 12px;font-size:14px">
        <b style="font-size:18px;display:block">${tot?Math.round(mastered*100/tot):0}%</b>mastered</div>
    </div>
  </div>

  <div class="grid g2 mt">
    <button class="action" onclick="startDaily()">
      <div class="ic" style="background:#fff1d6">⚡</div>
      <div><b>Daily 15 Challenge</b><small>Smart mix from all subjects</small></div>
    </button>
    <button class="action" onclick="go('mistakes')">
      <div class="ic" style="background:#fdecee">📒</div>
      <div><b>Mistake Notebook</b><small>${wrongCount} to fix</small></div>
    </button>
  </div>

  <div class="sec"><h3>Pick a subject</h3><span>${tot} practice questions</span></div>
  <div class="grid">
    ${CLS.subjects.map(s=>{const m=subjMastery(s);return `
      <button class="subj" style="--c:${s.color}" onclick="go('subject',{s:'${s.id}'})">
        <div class="ic">${s.icon}</div>
        <div style="flex:1">
          <div class="row">
            <div class="nm">${s.name}</div>
            <div class="spacer"></div>
            <div class="pct">${m}%</div>
          </div>
          <div class="bk">${s.book||""} · ${s.chapters.length} chapters</div>
          <div class="bar"><i style="width:${m}%"></i></div>
        </div>
      </button>`}).join("")}
  </div>`;
}

/* ---------- SUBJECT ---------- */
function vSubject(el){const s=subj(route.s);
  el.innerHTML=`
  <div class="top">
    <button class="back" onclick="go('home')">‹</button>
    <div><h2>${s.icon} ${s.name}</h2>
      <div class="sub">${s.book||""} · ${subjMastery(s)}% mastered</div></div>
  </div>
  <div class="grid g2" style="margin-bottom:14px">
    <button class="action" onclick="startSubjectMix('${s.id}')">
      <div class="ic" style="background:#efeafd">🎯</div>
      <div><b>Mixed practice</b><small>20 questions from all chapters</small></div>
    </button>
    <button class="action" onclick="go('exam',{pre:'${s.id}'})">
      <div class="ic" style="background:#e3f6ff">⏱️</div>
      <div><b>Timed test</b><small>Exam-style, marks at the end</small></div>
    </button>
  </div>
  <div class="grid">
    ${s.chapters.map(ch=>{const m=chMastery(ch);
      const col=m>=95?"var(--good)":m>=60?s.color:m>0?"var(--gold)":"#c9c3e8";
      return `
      <button class="chap" onclick="go('chapter',{s:'${s.id}',c:${ch.n},tab:'notes'})">
        <div class="ring" style="--p:${m};--c:${col}"><span>${m}%</span></div>
        <div style="flex:1">
          <div class="t">Ch ${ch.n} · ${esc(ch.t)}</div>
          <div class="m">${ch.notes.length} notes · ${ch.qs.length} quiz Qs · ${(ch.top||[]).length} written Qs</div>
        </div>
        ${m>=95?'<span style="font-size:24px">🏅</span>':'<span style="font-size:22px;color:var(--muted)">›</span>'}
      </button>`}).join("")}
  </div>`;
}

/* ---------- CHAPTER ---------- */
function vChapter(el){
  const s=subj(route.s);
  const ch=s.chapters.find(c=>c.n===route.c);
  let tab=route.tab||"notes";
  const m=chMastery(ch);
  const tabs=[["notes","📖 Notes"],["practice","🎯 Practice"],["examq","⭐ Exam Qs"],["write","✍️ Write"],["traps","⚠️ Traps"]];
  let body="";
  const stPill=id=>{const st=S.wr[id];if(!st)return "";
    const bg=st==="g"?"var(--goodbg)":st==="p"?"#fff1d6":"var(--badbg)";
    const col=st==="g"?"var(--good)":st==="p"?"#b45309":"var(--bad)";
    return `<span class="pill" style="background:${bg};color:${col}">${
      st==="g"?"Got it":st==="p"?"Partly":"Revise"}</span>`};

  if(tab==="notes"){
    body=`
    ${ch.intro?`<div class="card"><p style="margin:0">${esc(ch.intro)}</p></div>`:""}
    ${ch.notes.length?`
      <div class="sec"><h3>Quick notes</h3><span>${ch.notes.length} key ideas</span></div>
      <div class="grid">
        ${ch.notes.map((n,i)=>`
          <div class="note-card" style="--c:${s.color}">
            <div class="nh"><span class="nn">${i+1}</span>${esc(n.h)}</div>
            <div class="nt">${esc(n.t).replace(/ · /g,"<span style='color:#5b4bdb;font-weight:900;margin:0 6px'>•</span>")}</div>
          </div>`).join("")}
      </div>`:""}
    <div class="mt">
      <button class="btn block" onclick="go('chapter',{s:'${s.id}',c:${ch.n},tab:'practice'})">
        Test myself →
      </button>
    </div>`;
  }
  else if(tab==="practice"){
    const wrong=ch.qs.filter(q=>S.q[q.id]&&!S.q[q.id].l).length;
    const unseen=ch.qs.filter(q=>!S.q[q.id]).length;
    body=`
    <div class="card">
      <div class="row">
        <div class="ring" style="--p:${m};--c:${s.color}"><span>${m}%</span></div>
        <div>
          <b>${m>=95?"Mastered! 🏅":"Mastery "+m+"%"}</b>
          <div class="small">${ch.qs.length} quiz Qs · ${unseen} not tried yet</div>
        </div>
      </div>
    </div>
    <div class="grid mt">
      <button class="action" onclick="startChapter('${s.id}',${ch.n},'smart')">
        <div class="ic" style="background:#efeafd">🧠</div>
        <div><b>Smart practice</b><small>New + previously wrong questions first</small></div>
      </button>
      <button class="action" onclick="startChapter('${s.id}',${ch.n},'all')">
        <div class="ic" style="background:#e7f8ee">📚</div>
        <div><b>Full chapter (${ch.qs.length})</b><small>Every question in this chapter</small></div>
      </button>
      ${wrong?`<button class="action" onclick="startChapter('${s.id}',${ch.n},'wrong')">
        <div class="ic" style="background:#fdecee">🔁</div>
        <div><b>Fix my mistakes (${wrong})</b><small>Only the ones you got wrong</small></div>
      </button>`:""}
    </div>`;
  }
  else if(tab==="examq"){
    body=`
    <div class="note">⭐ The most likely exam questions with model answers. Try each in your notebook first, then tap to check.</div>
    <div class="grid mt">
      ${(ch.top||[]).length?(ch.top).map((t,i)=>{const id=`${s.id}${ch.n}q${i}`;
        return `
        <div class="flash" id="f_${id}" onclick="this.classList.add('open')">
          <div class="row">
            <span class="pill">Q${i+1} · ${t.m} mark${t.m>1?"s":""}</span>
            ${t.imp?'<span class="pill imp">★ Very important</span>':""}
            ${stPill(id)}
          </div>
          <div class="q mt">${esc(t.q)}</div>
          <div class="hint">Tap to see the model answer</div>
          <div class="a">
            <b>Model answer:</b>
            <ul style="margin:6px 0 0;padding-left:20px">
              ${t.a.map(x=>`<li style="margin-bottom:4px">${esc(x)}</li>`).join("")}
            </ul>
            ${t.k?`<div class="mt" style="color:var(--brand
