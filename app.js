const DAILY_WORDS = [
  '사랑','감사','우정','용기','정직','배려','존중','희망','행복','겸손',
  '인내','성실','책임','자유','평화','지혜','친절','신뢰','공감','열정',
  '도전','꿈','노력','기쁨','슬픔','분노','질투','용서','나눔','봉사',
  '민주주의','경제','문화','역사','자연','환경','과학','예술','음악','스포츠'
];

let currentAge = parseInt(localStorage.getItem('kidsDict_age') || '5');
let searchHistory = JSON.parse(localStorage.getItem('kidsDict_history') || '[]');
let searchCount = parseInt(localStorage.getItem('kidsDict_searchCount') || '0');
let surveyDone = localStorage.getItem('kidsDict_surveyDone') === 'true';
let selectedStar = 0;
let currentWord = '';

function init() {
  setActiveAgeTab(currentAge);
  renderHistory();
  renderTodayWord();
  initBanner();

  document.getElementById('searchInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') searchWord();
  });
  document.querySelectorAll('.age-tab').forEach(tab => {
    tab.addEventListener('click', () => setAge(parseInt(tab.dataset.age)));
  });
}

// ── 배너 ───────────────────────────────────
function initBanner() {
  const hidden = localStorage.getItem('kidsDict_bannerHidden') === 'true';
  if (hidden) document.getElementById('topBanner').classList.add('hidden');
}

function closeBanner() {
  document.getElementById('topBanner').classList.add('hidden');
  localStorage.setItem('kidsDict_bannerHidden', 'true');
}

// ── 오늘의 단어 ──────────────────────────────
function renderTodayWord() {
  const today = new Date();
  const idx = (today.getFullYear() * 365 + today.getMonth() * 30 + today.getDate()) % DAILY_WORDS.length;
  const word = DAILY_WORDS[idx];
  document.getElementById('todayWord').textContent = word;
  document.getElementById('todayBtn').dataset.word = word;
}

function searchTodayWord() {
  const word = document.getElementById('todayBtn').dataset.word;
  if (word) quickSearch(word);
}

// ── 나이 설정 ───────────────────────────────
function setAge(age) {
  currentAge = age;
  localStorage.setItem('kidsDict_age', age);
  setActiveAgeTab(age);
  if (currentWord) searchWord();
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

// ── 만족도 조사 ─────────────────────────────
function checkSurvey(trigger) {
  if (surveyDone) return;
  if (trigger === 'search' && searchCount >= 3) showSurvey();
  if (trigger === 'story') showSurvey();
}

function showSurvey() {
  if (surveyDone) return;
  const overlay = document.getElementById('surveyOverlay');
  overlay.style.display = 'flex';
}

function closeSurvey(skip) {
  document.getElementById('surveyOverlay').style.display = 'none';
  if (skip) {
    surveyDone = true;
    localStorage.setItem('kidsDict_surveyDone', 'true');
  }
}

function setStar(v) {
  selectedStar = v;
  document.querySelectorAll('.star').forEach((s, i) => {
    s.classList.toggle('active', i < v);
  });
  document.getElementById('surveySubmit').disabled = false;
}

function submitSurvey() {
  const comment = document.getElementById('surveyComment').value.trim();
  surveyDone = true;
  localStorage.setItem('kidsDict_surveyDone', 'true');
  // 실제 서비스에서는 여기서 서버로 데이터를 보내면 돼요
  console.log('만족도 조사 결과:', { star: selectedStar, comment });
  document.getElementById('surveyOverlay').style.display = 'none';

  // 감사 토스트 메시지
  const toast = document.createElement('div');
  toast.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#4A7C5F;color:#fff;padding:10px 20px;border-radius:999px;font-size:13px;font-weight:500;z-index:200;animation:fadeUp 0.3s ease';
  toast.textContent = '소중한 의견 감사해요 💚';
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2500);
}

// ── TTS ────────────────────────────────────
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

// ── 공유 ───────────────────────────────────
function shareResult(word, p) {
  const text = `📖 우리 아이 국어사전\n\n"${word}"\n${p.definition.replace(/\[[^\]]+\]/g, m => m.slice(1,-1))}\n\n예문: "${p.example}"\n\n아이와 함께 단어를 배워요 🌿`;
  if (navigator.share) {
    navigator.share({ title: '우리 아이 국어사전', text }).catch(() => {});
  } else {
    navigator.clipboard.writeText(text).then(() => {
      alert('클립보드에 복사됐어요! 카카오톡에 붙여넣기 해보세요 😊');
    }).catch(() => { alert('공유 기능을 지원하지 않는 브라우저예요.'); });
  }
}

// ── 단어 링크 ──────────────────────────────
function renderLinkedDef(definition) {
  return definition.replace(/\[([^\]]+)\]/g, (_, word) => {
    const safe = word.replace(/'/g, "\\'");
    return `<span class="word-link" onclick="quickSearch('${safe}')">${word}</span>`;
  });
}

// ── 빠른 검색 ──────────────────────────────
function quickSearch(word) {
  document.getElementById('searchInput').value = word;
  searchWord();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── 검색 ───────────────────────────────────
async function searchWord() {
  const word = document.getElementById('searchInput').value.trim();
  if (!word) return;

  currentWord = word;
  searchCount++;
  localStorage.setItem('kidsDict_searchCount', searchCount);

  const resultSection = document.getElementById('resultSection');
  const msgs = [
    { emoji: '🔍', msg: '잠깐만요, 찾아볼게요!', sub: '열심히 설명을 준비하고 있어요...' },
    { emoji: '📖', msg: '사전을 펼치고 있어요!', sub: '쉬운 말로 바꾸는 중이에요...' },
    { emoji: '✍️', msg: '설명을 쓰고 있어요!', sub: '아이 눈높이에 맞게 다듬는 중...' },
    { emoji: '🌿', msg: '거의 다 됐어요!', sub: '조금만 기다려주세요...' },
  ];
  const lm = msgs[Math.floor(Math.random() * msgs.length)];

  resultSection.innerHTML = `
    <div class="loading">
      <div class="loading-emoji">${lm.emoji}</div>
      <p class="loading-msg">${lm.msg}</p>
      <p class="loading-sub">${lm.sub}</p>
      <div class="loading-dots"><span></span><span></span><span></span></div>
    </div>`;

  addToHistory(word);
  const ageLabel = { 3:'3~4살', 5:'5~6살', 7:'7~8살', 10:'9~10살' }[currentAge];

  try {
    const res = await fetch('/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ word, ageLabel })
    });
    if (!res.ok) throw new Error(`서버 오류: ${res.status}`);
    const p = await res.json();
    renderResult(word, p);
    checkSurvey('search');
  } catch (err) {
    resultSection.innerHTML = `
      <div class="loading">
        <div class="loading-emoji">😥</div>
        <p class="loading-msg">앗, 오류가 났어요</p>
        <p class="loading-sub">잠시 후 다시 시도해봐요</p>
        <div style="margin-top:1rem">
          <button class="search-btn" onclick="searchWord()" style="font-size:13px;padding:10px 20px;">다시 시도하기</button>
        </div>
      </div>`;
    console.error(err);
  }
}

// ── 결과 렌더링 ────────────────────────────
function renderResult(word, p) {
  const resultSection = document.getElementById('resultSection');
  const speakText = `${word}. ${p.definition.replace(/\[[^\]]+\]/g, m => m.slice(1,-1))} 예를 들면, ${p.example}`;
  const linkedDef = renderLinkedDef(p.definition);

  const synonymChips = (p.synonyms||[]).map(w=>`<button class="chip-pair" onclick="quickSearch('${esc(w)}')">${esc(w)}</button>`).join('');
  const antonymChips = (p.antonyms||[]).map(w=>`<button class="chip-pair" onclick="quickSearch('${esc(w)}')">${esc(w)}</button>`).join('');
  const relatedChips = (p.related||[]).map(w=>`<button class="chip-related" onclick="quickSearch('${esc(w)}')">${esc(w)}</button>`).join('');
  const tagChips = (p.tags||[]).map(t=>`<span class="tag">${esc(t)}</span>`).join('');

  resultSection.innerHTML = `
    <div class="result-card">
      <div class="card-header">
        <div class="word-emoji-box">${p.emoji}</div>
        <div class="word-info">
          <div class="word-title">${esc(word)}</div>
          <div class="word-reading">${esc(p.reading||'')}</div>
        </div>
        <div class="card-actions">
          <button class="retry-btn" id="retryBtn" title="다시 설명받기">🔄</button>
          <button class="tts-btn" id="ttsBtn" title="읽어주기">🔊</button>
        </div>
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
      <button class="story-btn" id="storyBtn">✨ "${esc(word)}"으로 동화 만들기</button>
      <button class="share-btn" id="shareBtn">🔗 이 설명 공유하기</button>
    </div>
    <div id="storySection"></div>`;

  document.getElementById('ttsBtn').addEventListener('click', function(){ speak(speakText, this); });
  document.getElementById('retryBtn').addEventListener('click', () => searchWord());
  document.getElementById('storyBtn').addEventListener('click', () => makeStory(word, p));
  document.getElementById('shareBtn').addEventListener('click', () => shareResult(word, p));

  resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ── 미니 동화 ───────────────────────────────
async function makeStory(word, p) {
  const storySection = document.getElementById('storySection');
  const btn = document.getElementById('storyBtn');
  btn.disabled = true;
  btn.textContent = '✨ 동화를 쓰고 있어요...';

  storySection.innerHTML = `
    <div class="story-loading">
      <div class="loading-emoji" style="font-size:28px;margin-bottom:0.5rem;">✍️</div>
      <p>따뜻한 동화를 만들고 있어요...</p>
    </div>`;

  const ageLabel = { 3:'3~4살', 5:'5~6살', 7:'7~8살', 10:'9~10살' }[currentAge];

  try {
    const res = await fetch('/api/story', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ word, ageLabel })
    });
    if (!res.ok) throw new Error('동화 생성 실패');
    const data = await res.json();

    storySection.innerHTML = `
      <div class="story-card">
        <div class="story-header">
          <span class="story-label">✨ ${esc(word)} 동화</span>
          <button class="story-tts" id="storyTtsBtn">🔊</button>
        </div>
        <p class="story-text">${esc(data.story)}</p>
      </div>`;

    document.getElementById('storyTtsBtn').addEventListener('click', function(){
      speak(data.story, this);
    });

    storySection.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // 동화 완료 후 만족도 조사 체크
    setTimeout(() => checkSurvey('story'), 1500);

  } catch (err) {
    storySection.innerHTML = `<div class="story-loading"><p>동화 생성 중 오류가 났어요 😥</p></div>`;
    console.error(err);
  } finally {
    btn.disabled = false;
    btn.textContent = `✨ "${word}"으로 동화 다시 만들기`;
  }
}

// ── 유틸 ───────────────────────────────────
function esc(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

init();
