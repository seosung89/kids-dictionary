let currentAge = parseInt(localStorage.getItem('kidsDict_age') || '5');
let searchHistory = JSON.parse(localStorage.getItem('kidsDict_history') || '[]');

function init() {
  setActiveAgeTab(currentAge);
  renderHistory();
  document.getElementById('searchInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') searchWord();
  });
  document.querySelectorAll('.age-tab').forEach(tab => {
    tab.addEventListener('click', () => setAge(parseInt(tab.dataset.age)));
  });
}

function setAge(age) {
  currentAge = age;
  localStorage.setItem('kidsDict_age', age);
  setActiveAgeTab(age);
  const word = document.getElementById('searchInput').value.trim();
  if (word) searchWord();
}

function setActiveAgeTab(age) {
  document.querySelectorAll('.age-tab').forEach(t => t.classList.remove('active'));
  const tab = document.querySelector(`.age-tab[data-age="${age}"]`);
  if (tab) tab.classList.add('active');
}

function addToHistory(word) {
  searchHistory = searchHistory.filter(w => w !== word);
  searchHistory.push(word);
  if (searchHistory.length > 20) searchHistory = searchHistory.slice(-20);
  localStorage.setItem('kidsDict_history', JSON.stringify(searchHistory));
  renderHistory();
}

function renderHistory() {
  const section = document.getElementById('historySection');
  const row = document.getElementById('historyRow');
  row.innerHTML = '';
  if (searchHistory.length === 0) { section.style.display = 'none'; return; }
  section.style.display = 'block';
  [...searchHistory].reverse().slice(0, 8).forEach(word => {
    const btn = document.createElement('button');
    btn.className = 'chip chip-history';
    btn.textContent = word;
    btn.onclick = () => quickSearch(word);
    row.appendChild(btn);
  });
}

function quickSearch(word) {
  document.getElementById('searchInput').value = word;
  searchWord();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function speak(text, btnEl) {
  if (!('speechSynthesis' in window)) { alert('이 기기에서는 음성 기능을 지원하지 않아요.'); return; }
  window.speechSynthesis.cancel();
  if (btnEl.classList.contains('playing')) { btnEl.classList.remove('playing'); return; }
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = 'ko-KR'; utter.rate = 0.88; utter.pitch = 1.05;
  utter.onstart = () => btnEl.classList.add('playing');
  utter.onend = () => btnEl.classList.remove('playing');
  utter.onerror = () => btnEl.classList.remove('playing');
  window.speechSynthesis.speak(utter);
}

// 설명 안의 [단어] 를 클릭 가능한 링크로 변환
function renderLinkedDef(definition) {
  return definition.replace(/\[([^\]]+)\]/g, (_, word) => {
    const safe = word.replace(/'/g, "\\'");
    return `<span class="word-link" onclick="quickSearch('${safe}')">${word}</span>`;
  });
}

async function searchWord() {
  const word = document.getElementById('searchInput').value.trim();
  if (!word) return;

  const resultSection = document.getElementById('resultSection');
  resultSection.innerHTML = `
    <div class="loading">
      <p>잠깐만요, 찾아볼게요...</p>
      <div class="loading-dots"><span></span><span></span><span></span></div>
    </div>`;

  addToHistory(word);
  const ageLabel = { 3: '3~4살', 5: '5~6살', 7: '7~8살', 10: '9~10살' }[currentAge];

  try {
    const res = await fetch('/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ word, ageLabel })
    });
    if (!res.ok) throw new Error(`서버 오류: ${res.status}`);
    const p = await res.json();
    renderResult(word, p);
  } catch (err) {
    resultSection.innerHTML = `<div class="loading"><p>앗, 오류가 났어요 😥<br>잠시 후 다시 시도해봐요.</p></div>`;
    console.error(err);
  }
}

function renderResult(word, p) {
  const resultSection = document.getElementById('resultSection');
  const speakText = `${word}. ${p.definition.replace(/\[[^\]]+\]/g, m => m.slice(1,-1))} 예를 들면, ${p.example}`;

  const linkedDef = renderLinkedDef(p.definition);
  const synonymChips = (p.synonyms || []).map(w => `<button class="chip-pair" onclick="quickSearch('${esc(w)}')">${esc(w)}</button>`).join('');
  const antonymChips = (p.antonyms || []).map(w => `<button class="chip-pair" onclick="quickSearch('${esc(w)}')">${esc(w)}</button>`).join('');
  const relatedChips = (p.related || []).map(w => `<button class="chip-related" onclick="quickSearch('${esc(w)}')">${esc(w)}</button>`).join('');
  const tagChips = (p.tags || []).map(t => `<span class="tag">${esc(t)}</span>`).join('');

  resultSection.innerHTML = `
    <div class="result-card">
      <div class="card-header">
        <div class="word-emoji-box">${p.emoji}</div>
        <div class="word-info">
          <div class="word-title">${esc(word)}</div>
          <div class="word-reading">${esc(p.reading || '')}</div>
        </div>
        <button class="tts-btn" id="ttsBtn" title="읽어주기">🔊</button>
      </div>
      <p class="word-def">${linkedDef}</p>
      <div class="word-example">"${esc(p.example)}"</div>
      <div class="divider"></div>
      <div class="pairs-grid">
        <div class="pair-box">
          <div class="pair-label">비슷한 말</div>
          <div class="pair-chips">${synonymChips}</div>
        </div>
        <div class="pair-box">
          <div class="pair-label">반대 말</div>
          <div class="pair-chips">${antonymChips}</div>
        </div>
      </div>
      <div class="related-row">
        <div class="related-label">연관 단어</div>
        <div class="related-chips">${relatedChips}</div>
      </div>
      <div class="tags-row">${tagChips}</div>
    </div>`;

  document.getElementById('ttsBtn').addEventListener('click', function () {
    speak(speakText, this);
  });

  resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function esc(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

init();
