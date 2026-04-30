// ────────────────────────────────────────────
//  우리 아이 국어사전 — app.js
//  Anthropic API 키는 .env 또는 서버사이드에서 주입하세요.
//  배포 시 VITE_API_KEY 환경변수로 관리합니다.
// ────────────────────────────────────────────

const API_KEY = window.ANTHROPIC_API_KEY || '';
// ※ 실제 배포 시 이 값을 서버사이드에서 주입하거나
//   Vercel 환경변수(VITE_API_KEY)로 관리하세요.

let currentAge = parseInt(localStorage.getItem('kidsDict_age') || '5');
let searchHistory = JSON.parse(localStorage.getItem('kidsDict_history') || '[]');

// ── 초기화 ──────────────────────────────────
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

// ── 나이 설정 ───────────────────────────────
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

// ── 검색 기록 ───────────────────────────────
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

  if (searchHistory.length === 0) {
    section.style.display = 'none';
    return;
  }
  section.style.display = 'block';
  [...searchHistory].reverse().slice(0, 8).forEach(word => {
    const btn = document.createElement('button');
    btn.className = 'chip chip-history';
    btn.textContent = word;
    btn.onclick = () => quickSearch(word);
    row.appendChild(btn);
  });
}

// ── 빠른 검색 ──────────────────────────────
function quickSearch(word) {
  document.getElementById('searchInput').value = word;
  searchWord();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── TTS ────────────────────────────────────
function speak(text, btnEl) {
  if (!('speechSynthesis' in window)) {
    alert('이 기기에서는 음성 기능을 지원하지 않아요.');
    return;
  }
  window.speechSynthesis.cancel();
  if (btnEl.classList.contains('playing')) {
    btnEl.classList.remove('playing');
    return;
  }
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = 'ko-KR';
  utter.rate = 0.88;
  utter.pitch = 1.05;
  utter.onstart = () => btnEl.classList.add('playing');
  utter.onend = () => btnEl.classList.remove('playing');
  utter.onerror = () => btnEl.classList.remove('playing');
  window.speechSynthesis.speak(utter);
}

// ── 검색 ───────────────────────────────────
async function searchWord() {
  const word = document.getElementById('searchInput').value.trim();
  if (!word) return;

  const resultSection = document.getElementById('resultSection');
  resultSection.innerHTML = `
    <div class="loading">
      <p>잠깐만요, 찾아볼게요...</p>
      <div class="loading-dots">
        <span></span><span></span><span></span>
      </div>
    </div>`;

  addToHistory(word);

  const ageLabel = { 3: '3~4살', 5: '5~6살', 7: '7~8살', 10: '9~10살' }[currentAge];

  const prompt = `당신은 어린이 전용 국어사전입니다.
"${word}"라는 단어를 ${ageLabel} 아이에게 설명해주세요.

반드시 아래 JSON 형식으로만 응답하세요. 다른 말은 절대 하지 마세요:
{
  "emoji": "단어를 나타내는 이모지 1개",
  "reading": "읽는 법 (예: [사랑])",
  "definition": "${ageLabel} 아이가 이해할 수 있는 쉬운 설명. 친근한 비유나 예시 포함. 2~3문장.",
  "example": "일상에서 쓸 수 있는 짧은 예문 1개",
  "synonyms": ["비슷한 말 2~3개"],
  "antonyms": ["반대 말 1~2개"],
  "related": ["연관 단어 3개"],
  "tags": ["관련 개념 태그 2~3개"]
}`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!res.ok) throw new Error(`API 오류: ${res.status}`);
    const data = await res.json();
    const rawText = data.content.map(i => i.text || '').join('');
    const clean = rawText.replace(/```json|```/g, '').trim();
    const p = JSON.parse(clean);

    renderResult(word, p);
  } catch (err) {
    resultSection.innerHTML = `
      <div class="loading">
        <p>앗, 오류가 났어요 😥<br>잠시 후 다시 시도해봐요.</p>
      </div>`;
    console.error(err);
  }
}

// ── 결과 렌더링 ────────────────────────────
function renderResult(word, p) {
  const resultSection = document.getElementById('resultSection');
  const speakText = `${word}. ${p.definition} 예를 들면, ${p.example}`;

  const synonymChips = (p.synonyms || [])
    .map(w => `<button class="chip-pair" onclick="quickSearch('${esc(w)}')">${esc(w)}</button>`)
    .join('');
  const antonymChips = (p.antonyms || [])
    .map(w => `<button class="chip-pair" onclick="quickSearch('${esc(w)}')">${esc(w)}</button>`)
    .join('');
  const relatedChips = (p.related || [])
    .map(w => `<button class="chip-related" onclick="quickSearch('${esc(w)}')">${esc(w)}</button>`)
    .join('');
  const tagChips = (p.tags || [])
    .map(t => `<span class="tag">${esc(t)}</span>`)
    .join('');

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

      <p class="word-def">${esc(p.definition)}</p>
      <div class="word-example">"${esc(p.example)}"</div>

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

// ── 유틸 ───────────────────────────────────
function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── 시작 ───────────────────────────────────
init();
