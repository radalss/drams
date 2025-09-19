const $ = q => document.querySelector(q);
const latestRow  = $('#latest-row');
const searchRow  = $('#search-row');
const keywordEl  = $('#keyword');

window.onload = () => {
  $('#year').textContent = new Date().getFullYear();
  loadLatest();
  keywordEl.addEventListener('keydown', e => { if (e.key === 'Enter') search(); });
};

async function loadLatest(){
  latestRow.innerHTML = '<div class="card">Loading…</div>';
  const json = await fetch('/api/latest').then(r=>r.json());
  renderRow(json.data?.list||[], latestRow);
}

async function search(){
  const kw = keywordEl.value.trim();
  if (!kw) { searchRow.innerHTML = ''; return; }
  searchRow.innerHTML = '<div class="card">Loading…</div>';
  const json = await fetch(`/api/search?keyword=${encodeURIComponent(kw)}`).then(r=>r.json());
  renderRow(json.data?.list||[], searchRow);
}

function renderRow(list, container){
  container.innerHTML = '';
  list.forEach(d=>{
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <img src="${d.cover}" alt="${d.title}">
      <div class="play"></div>
      <div class="meta">
        <div class="title">${d.title}</div>
        <div class="eps">${d.chapterCount} episodes</div>
      </div>`;
    card.onclick = () => watch(d.bookId, 1);
    container.appendChild(card);
  });
}

async function watch(bookId, index){
  const json = await fetch(`/api/stream?bookId=${bookId}&index=${index}`).then(r=>r.json());
  const url = json.data?.url;
  if (!url) return alert('Stream not found');
  window.open(url, '_blank');
}