import {createClient} from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.116.0/+esm';
import {SUPABASE_URL,SUPABASE_KEY} from './config.js';
import {getLang,t} from './i18n.js';
import {esc} from './common.js';

const sb=createClient(SUPABASE_URL,SUPABASE_KEY);
let posts=[],commentsByPost={},activePost=null,category='all',postLang='all';
const $=s=>document.querySelector(s);
const msg=(text,type='')=>{const el=$('#forumMessage');if(!el)return;el.className='notice '+type;el.textContent=text;el.hidden=false;setTimeout(()=>el.hidden=true,5000)};
const fmt=d=>new Intl.DateTimeFormat(getLang(),{dateStyle:'medium',timeStyle:'short'}).format(new Date(d));

function anonymousName(){
  const lang=getLang();
  if(lang==='ja') return '匿名';
  if(lang==='es') return 'Anónimo';
  if(lang==='ru') return 'Аноним';
  return 'Anonymous';
}
function cleanName(v){
  const name=(v||'').trim().slice(0,32);
  return name || anonymousName();
}
function rememberName(name){
  if(name && !['匿名','Anonymous','Anónimo','Аноним'].includes(name)) localStorage.setItem('ot_forum_name',name);
}
function restoreName(){
  const saved=localStorage.getItem('ot_forum_name')||'';
  if($('#postName')) $('#postName').value=saved;
}
async function publishPost(e){
  e.preventDefault();
  const author_name=cleanName($('#postName').value);
  const payload={
    author_name,
    title:$('#postTitle').value.trim(),
    body:$('#postBody').value.trim(),
    category:$('#postCategory').value,
    language:$('#postLanguage').value,
    is_hidden:false
  };
  if(payload.title.length<3 || !payload.body) return;
  const {error}=await sb.from('ot_forum_posts').insert(payload);
  if(error){msg(error.message,'error');return}
  rememberName(author_name);
  $('#postTitle').value='';$('#postBody').value='';
  msg(t('status.saved'),'success');await loadForum();
}
async function publishReply(e){
  e.preventDefault();
  if(!activePost)return;
  const nameInput=$('#replyName');
  const author_name=cleanName(nameInput?.value||'');
  const body=$('#replyBody').value.trim();
  if(!body)return;
  const {error}=await sb.from('ot_forum_comments').insert({
    post_id:activePost.id,
    author_name,
    language:getLang(),
    body,
    is_hidden:false
  });
  if(error){msg(error.message,'error');return}
  rememberName(author_name);
  $('#replyBody').value='';
  await loadComments(activePost.id);renderDetail();
}
async function loadComments(postId){
  const {data,error}=await sb.from('ot_forum_comments').select('*').eq('post_id',postId).eq('is_hidden',false).order('created_at',{ascending:true});
  if(error){commentsByPost[postId]=[];return}
  commentsByPost[postId]=data||[];
}
async function openPost(id){
  activePost=posts.find(p=>p.id===id);if(!activePost)return;
  await loadComments(id);renderDetail();$('#postDetail').scrollIntoView({behavior:'smooth',block:'start'});
}
function renderPosts(){
  const target=$('#forumList');if(!target)return;
  const shown=posts.filter(p=>(category==='all'||p.category===category)&&(postLang==='all'||p.language===postLang));
  if(!shown.length){target.innerHTML=`<div class="empty">${esc(t('forum.noPosts'))}</div>`;return}
  target.innerHTML=shown.map(p=>`<article class="post-card" data-open="${p.id}">
    <div class="post-top"><div><div class="post-meta"><span>${esc(t('cat.'+p.category))}</span><span>${esc((p.language||'').toUpperCase())}</span><span>${esc(p.author_name||anonymousName())}</span><span>${esc(fmt(p.created_at))}</span></div><h3>${esc(p.title)}</h3></div></div>
    <div class="post-body">${esc(p.body.length>360?p.body.slice(0,360)+'…':p.body)}</div>
    <div class="post-actions"><button class="icon-btn" data-open-btn="${p.id}">${esc(t('forum.open'))}</button></div>
  </article>`).join('');
  target.querySelectorAll('[data-open]').forEach(el=>el.addEventListener('click',e=>{if(e.target.closest('button'))return;openPost(Number(el.dataset.open))}));
  target.querySelectorAll('[data-open-btn]').forEach(b=>b.addEventListener('click',()=>openPost(Number(b.dataset.openBtn))));
}
function renderDetail(){
  const target=$('#postDetail');if(!target||!activePost){if(target)target.innerHTML='';return}
  const cs=commentsByPost[activePost.id]||[];
  const saved=localStorage.getItem('ot_forum_name')||'';
  target.innerHTML=`<div class="detail-panel">
    <div class="post-meta"><span>${esc(t('cat.'+activePost.category))}</span><span>${esc((activePost.language||'').toUpperCase())}</span><span>${esc(activePost.author_name||anonymousName())}</span><span>${esc(fmt(activePost.created_at))}</span></div>
    <h2 style="font-size:38px;margin:14px 0">${esc(activePost.title)}</h2>
    <div class="post-body">${esc(activePost.body)}</div>
    <h3 style="margin-top:30px">${esc(t('forum.comments'))} · ${cs.length}</h3>
    <div class="comments">${cs.map(c=>`<div class="comment"><small>${esc(c.author_name||anonymousName())} · ${esc(fmt(c.created_at))}</small><p>${esc(c.body)}</p></div>`).join('')||`<div class="help">—</div>`}</div>
    <form id="replyForm" style="margin-top:14px">
      <div class="form-row"><label>${esc(t('forum.name'))}</label><input id="replyName" class="input" maxlength="32" value="${esc(saved)}"><div class="help">${esc(t('forum.nameHelp'))}</div></div>
      <textarea id="replyBody" class="textarea" maxlength="2000" required></textarea>
      <button class="btn primary" style="margin-top:9px">${esc(t('forum.reply'))}</button>
    </form>
  </div>`;
  $('#replyForm').addEventListener('submit',publishReply);
}
async function loadForum(resetDetail=true){
  const {data,error}=await sb.from('ot_forum_posts').select('*').eq('is_hidden',false).order('created_at',{ascending:false}).limit(100);
  if(error){msg(error.message,'error');return}
  posts=data||[];renderPosts();
  if(resetDetail){activePost=null;$('#postDetail').innerHTML=''}
  else if(activePost){activePost=posts.find(x=>x.id===activePost.id)||activePost}
}
function bind(){
  $('#postForm')?.addEventListener('submit',publishPost);
  $('#refreshBtn')?.addEventListener('click',()=>loadForum(false));
  document.querySelectorAll('[data-cat-filter]').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('[data-cat-filter]').forEach(x=>x.classList.remove('active'));b.classList.add('active');category=b.dataset.catFilter;renderPosts()}));
  $('#languageFilter')?.addEventListener('change',e=>{postLang=e.target.value;renderPosts()});
  window.addEventListener('ot-language-change',()=>{renderPosts();if(activePost)renderDetail();$('#postLanguage').value=getLang()});
}
bind();restoreName();$('#postLanguage').value=getLang();await loadForum();
