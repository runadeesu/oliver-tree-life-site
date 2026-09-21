import {bindLanguage,getLang,t} from './i18n.js';
import {SUPABASE_URL,SUPABASE_KEY} from './config.js';
import {fallbackTimeline,fallbackSources,albums,videos,photos} from './data.js';

export const esc=(v='')=>String(v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
export async function rest(table,query='select=*'){
  const r=await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`,{headers:{apikey:SUPABASE_KEY}});
  if(!r.ok) throw new Error(`${table}: ${r.status}`);
  return r.json();
}
function setActive(){
 const page=document.body.dataset.page;
 document.querySelectorAll('.nav a').forEach(a=>a.classList.toggle('active',a.dataset.page===page));
}
function fillYear(){document.querySelectorAll('[data-year]').forEach(x=>x.textContent=new Date().getFullYear())}
bindLanguage();setActive();fillYear();

export async function initTimeline(){
 const target=document.querySelector('#timelineList'); if(!target)return;
 let items;
 try{items=await rest('ot_timeline','select=*&is_published=eq.true&order=display_order.asc')}catch{items=fallbackTimeline}
 let filter='all';
 const render=()=>{
   const rows=items.filter(x=>filter==='all'||x.category===filter);
   target.innerHTML=rows.map(x=>`<article class="timeline-row"><div class="timeline-year">${esc(x.year_label)}</div><div><h3>${esc(x.title)}</h3><p>${esc(x.description)}</p><a class="card-link" href="${esc(x.source_url)}" target="_blank" rel="noreferrer">SOURCE · ${esc(x.source_label||'')} ↗</a></div><div class="tag">${esc((x.category||'').toUpperCase())}</div></article>`).join('');
 };
 document.querySelectorAll('[data-filter]').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('[data-filter]').forEach(x=>x.classList.remove('active'));b.classList.add('active');filter=b.dataset.filter;render()}));
 render();
}
export function initMusic(){
 const target=document.querySelector('#albumGrid');if(!target)return;
 target.innerHTML=albums.map(a=>`<article class="album"><small>${esc(a.kind)} · ${esc(a.year)}</small><h3>${esc(a.title)}</h3><p>${esc(a.desc)}</p><div class="meta"><span>${esc(a.year)}</span><a href="${esc(a.url)}" target="_blank" rel="noreferrer">SOURCE ↗</a></div></article>`).join('');
}
export function initVideos(){
 const target=document.querySelector('#videoGrid');if(!target)return;
 target.innerHTML=videos.map(v=>`<article class="video"><iframe loading="lazy" src="https://www.youtube.com/embed/${esc(v.id)}" title="${esc(v.title)}" allowfullscreen></iframe><div class="video-info"><small>${esc(v.year)}</small><h3>${esc(v.title)}</h3><p>${esc(v.note)}</p></div></article>`).join('');
}
export function initPhotos(){
 const target=document.querySelector('#photoGrid');if(!target)return;
 target.innerHTML=photos.map(p=>`<figure class="photo ${p.wide?'wide':''}"><img loading="lazy" src="${esc(p.url)}" alt="${esc(p.title)}"><figcaption><a href="${esc(p.source)}" target="_blank" rel="noreferrer"><b>${esc(p.title)}</b></a><span>${esc(p.credit)}</span></figcaption></figure>`).join('');
}
export async function initSources(){
 const target=document.querySelector('#sourceList');if(!target)return;
 let items;try{items=await rest('ot_sources','select=*&is_published=eq.true&order=display_order.asc')}catch{items=fallbackSources}
 target.innerHTML=items.map(s=>`<article class="source-row"><div class="kind">${esc((s.source_type||'SOURCE').toUpperCase())}</div><div><b>${esc(s.title)}</b><p>${esc(s.note||'')}</p></div><a class="open" href="${esc(s.url)}" target="_blank" rel="noreferrer">OPEN ↗</a></article>`).join('');
}
initTimeline();initMusic();initVideos();initPhotos();initSources();
