const DAILY_WORDS = [
  '사랑','감사','우정','용기','정직','배려','존중','희망','행복','겸손',
  '인내','성실','책임','자유','평화','지혜','친절','신뢰','공감','열정',
  '도전','꿈','노력','기쁨','슬픔','분노','질투','용서','나눔','봉사',
  '민주주의','경제','문화','역사','자연','환경','과학','예술','음악','스포츠'
];

const LOADING_MSGS = [
  { emoji: '🔍', msg: '찾아볼게요!', sub: '열심히 설명을 준비하고 있어요...' },
  { emoji: '📖', msg: '사전을 펼치고 있어요!', sub: '쉬운 말로 바꾸는 중이에요...' },
  { emoji: '✍️', msg: '설명을 쓰고 있어요!', sub: '아이 눈높이에 맞게 다듬는 중...' },
  { emoji: '🌿', msg: '거의 다 됐어요!', sub: '조금만 기다려주세요...' },
];

let currentAge = parseInt(localStorage.getItem('kidsDict_age') || '5');
let searchHistory = JSON.parse(localStorage.getItem('kidsDict_history') || '[]');
let searchCount = parseInt(localStorage.getItem('kidsDict_searchCount') || '0');
let surveyDone = localStorage.getItem('kidsDict_surveyDone') === 'true';
let selectedStar = 0;
let currentWord = '';
let currentResult = null;
let storyGenerated = false;

// ── 초기화 ──────────────────────────────
function init() {
  setActiveAgeOption(currentAge);
  updateAgeBadge(currentAge);
  renderHistory();
  renderTodayWord();

  document.getElementById('searchInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') searchWord();
  });

  // 뒤로가기 제스처 방지
  window.addEventListener('popstate', () => goHome());
}

// ── 화면 전환 ───────────────────────────
function goResult() {
  document.getElementById('homeScreen').classList.add('hidden');
  document.getElementById('resultScreen').classList.remove('hidden');
  window.history.pushState({ page: 'result' }, '');
}

function goHome() {
  document.getElementById('resultScreen').classList.add('hidden');
  document.getElementById('homeScreen').classList.remove('hidden');
  document.getElementById('searchInput').value = '';
}

// ── 탭 전환 ─────────────────────────────
function switchTab(tab) {
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  document.querySelectorAll('.tab-content').forEach(c => {
    c.classList.toggle('hidden', c.id !== `tab-${tab}`);
    if (c.id === `tab-${tab}`) c.classList.remove('hidden');
  });
}

// ── 오늘의 단어 ──────────────────────────
function renderTodayWord() {
  const today = new Date();
  const idx = (today.getFullYear() * 365 + today.getMonth() * 30 + today.getDate()) % DAILY_WORDS.length;
  const word = DAILY_WORDS[idx];
  document.getElementById('todayWord').textContent = word;
}

function searchTodayWord() {
  const word = document.getElementById('todayWord').textContent;
  if (word) quickSearch(word);
}

// ── 나이 설정 ────────────────────────────
function showAgeSheet() {
  document.getElementById('ageSheetOverlay').classList.remove('hidden');
}

function hideAgeSheet() {
  document.getElementById('ageSheetOverlay').classList.add('hidden');
}

function setAge(age) {
  currentAge = age;
  localStorage.setItem('kidsDict_age', age);
  updateAgeBadge(age);
  setActiveAgeOption(age);
  hideAgeSheet();
  if (currentWord) searchWord();
}

function updateAgeBadge(age) {
  const labels = { 3: '3~4살', 5: '5~6살', 7: '7~8살', 10: '9~10살' };
  document.getElementById('ageBadgeText').textContent = labels[age];
}

function setActiveAgeOption(age) {
  document.querySelectorAll('.age-option').forEach(o => {
    o.classList.toggle('active', parseInt(o.dataset.age) === age);
  });
}

// ── 검색 기록 ────────────────────────────
function addToHistory(word) {
  searchHistory = searchHistory.filter(w => w !== word);
  searchHistory.push(word);
  if (searchHistory.length > 20) searchHistory = searchHistory.slice(-20);
  localStorage.setItem('kidsDict_history', JSON.stringify(searchHistory));
  renderHistory();
}

function renderHistory() {
  const section = document.getElementById('historySection');
  const chips = document.getElementById('historyChips');
  chips.innerHTML = '';
  if (searchHistory.length === 0) { section.style.display = 'none'; return; }
  section.style.display = 'block';
  [...searchHistory].reverse().slice(0, 8).forEach(word => {
    const btn = document.createElement('button');
    btn.className = 'qchip';
    btn.textContent = word;
    btn.onclick = () => quickSearch(word);
    chips.appendChild(btn);
  });
}

// ── TTS ─────────────────────────────────
function speak(text, btnEl) {
  if (!('speechSynthesis' in window)) { showToast('이 기기에서는 음성을 지원하지 않아요'); return; }
  window.speechSynthesis.cancel();
  if (btnEl.classList.contains('playing')) { btnEl.classList.remove('playing'); return; }
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = 'ko-KR'; utter.rate = 0.88; utter.pitch = 1.05;
  utter.onstart = () => btnEl.classList.add('playing');
  utter.onend = () => btnEl.classList.remove('playing');
  utter.onerror = () => btnEl.classList.remove('playing');
  window.speechSynthesis.speak(utter);
}

// ── 공유 ────────────────────────────────
function shareResult() {
  if (!currentResult) return;
  const p = currentResult;
  const text = `📖 우리 아이 국어사전\n\n"${currentWord}"\n${p.definition.replace(/\[[^\]]+\]/g, m => m.slice(1,-1))}\n\n예문: "${p.example}"\n\n아이와 함께 단어를 배워요 🌿`;
  if (navigator.share) {
    navigator.share({ title: '우리 아이 국어사전', text }).catch(() => {});
  } else {
    navigator.clipboard.writeText(text)
      .then(() => showToast('클립보드에 복사됐어요! 카카오톡에 붙여넣기 해보세요 😊'))
      .catch(() => showToast('공유를 지원하지 않는 브라우저예요'));
  }
}

// ── 만족도 조사 ──────────────────────────
function checkSurvey(trigger) {
  if (surveyDone) return;
  if (trigger === 'search' && searchCount >= 3) setTimeout(() => showSurvey(), 800);
  if (trigger === 'story') setTimeout(() => showSurvey(), 1500);
}

function showSurvey() {
  if (surveyDone) return;
  document.getElementById('surveyOverlay').classList.remove('hidden');
}

function closeSurvey(done) {
  document.getElementById('surveyOverlay').classList.add('hidden');
  if (done) {
    surveyDone = true;
    localStorage.setItem('kidsDict_surveyDone', 'true');
  }
}

function setStar(v) {
  selectedStar = v;
  document.querySelectorAll('.star').forEach((s, i) => s.classList.toggle('active', i < v));
  document.getElementById('surveySubmit').disabled = false;
}

function submitSurvey() {
  const comment = document.getElementById('surveyComment').value.trim();
  console.log('만족도 조사:', { star: selectedStar, comment });
  surveyDone = true;
  localStorage.setItem('kidsDict_surveyDone', 'true');
  closeSurvey(true);
  showToast('소중한 의견 감사해요 💚');
}

// ── 단어 링크 ────────────────────────────
function renderLinkedDef(def) {
  return def.replace(/\[([^\]]+)\]/g, (_, w) => {
    const safe = w.replace(/'/g, "\\'");
    return `<span class="word-link" onclick="quickSearch('${safe}')">${w}</span>`;
  });
}

// ── 빠른 검색 ────────────────────────────
function quickSearch(word) {
  document.getElementById('searchInput').value = word;
  searchWord();
}

// ── 검색 ────────────────────────────────
async function searchWord() {
  const word = document.getElementById('searchInput').value.trim();
  if (!word) return;

  currentWord = word;
  storyGenerated = false;
  searchCount++;
  localStorage.setItem('kidsDict_searchCount', searchCount);
  addToHistory(word);

  // 결과 화면으로 전환
  goResult();
  switchTab('explain');

  // 로딩 표시
  const lm = LOADING_MSGS[Math.floor(Math.random() * LOADING_MSGS.length)];
  document.getElementById('loadingEmoji').textContent = lm.emoji;
  document.getElementById('loadingMsg').textContent = lm.msg;
  document.getElementById('loadingSub').textContent = lm.sub;
  document.getElementById('resultLoading').classList.remove('hidden');
  document.getElementById('resultContent').classList.add('hidden');
  document.getElementById('resultHeaderWord').textContent = word;

  const ageLabel = { 3: '3~4살', 5: '5~6살', 7: '7~8살', 10: '9~10살' }[currentAge];

  try {
    const res = await fetch('/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ word, ageLabel })
    });
    if (!res.ok) throw new Error(`서버 오류: ${res.status}`);
    const p = await res.json();
    currentResult = p;
    renderResult(word, p);
    checkSurvey('search');
  } catch (err) {
    document.getElementById('loadingEmoji').textContent = '😥';
    document.getElementById('loadingMsg').textContent = '앗, 오류가 났어요';
    document.getElementById('loadingSub').textContent = '잠시 후 다시 시도해봐요';
    console.error(err);
  }
}

// ── 결과 렌더링 ──────────────────────────
function renderResult(word, p) {
  // 단어 헤더
  document.getElementById('wordEmoji').textContent = p.emoji;
  document.getElementById('wordBig').textContent = word;
  document.getElementById('wordReading').textContent = p.reading || '';

  // 설명 탭
  document.getElementById('explainDef').innerHTML = renderLinkedDef(p.definition);
  document.getElementById('explainExample').textContent = `"${p.example}"`;
  document.getElementById('explainTags').innerHTML = (p.tags || []).map(t => `<span class="tag">${esc(t)}</span>`).join('');

  // 단어 탭
  document.getElementById('synonymChips').innerHTML = (p.synonyms || [])
    .map(w => `<button class="wchip" onclick="quickSearch('${esc(w)}')">${esc(w)}</button>`).join('');
  document.getElementById('antonymChips').innerHTML = (p.antonyms || [])
    .map(w => `<button class="wchip" onclick="quickSearch('${esc(w)}')">${esc(w)}</button>`).join('');
  document.getElementById('relatedChips').innerHTML = (p.related || [])
    .map(w => `<button class="wchip related" onclick="quickSearch('${esc(w)}')">${esc(w)}</button>`).join('');

  // 동화 탭 초기화
  document.getElementById('storyArea').innerHTML = `
    <button class="story-make-btn" id="storyMakeBtn" onclick="makeStory()">
      ✨ "${esc(word)}"으로 동화 만들기
    </button>`;

  // 헤더 버튼 연결
  const speakText = `${word}. ${p.definition.replace(/\[[^\]]+\]/g, m => m.slice(1,-1))} 예를 들면, ${p.example}`;
  const ttsBtn = document.getElementById('ttsBtn');
  const retryBtn = document.getElementById('retryBtn');
  const shareBtn = document.getElementById('shareBtn');

  ttsBtn.onclick = () => speak(speakText, ttsBtn);
  retryBtn.onclick = () => searchWord();
  shareBtn.onclick = () => shareResult();

  // 로딩 → 결과 전환
  document.getElementById('resultLoading').classList.add('hidden');
  document.getElementById('resultContent').classList.remove('hidden');
}

// ── 미니 동화 ────────────────────────────
async function makeStory() {
  if (storyGenerated) return;
  const btn = document.getElementById('storyMakeBtn');
  if (!btn) return;
  btn.disabled = true;
  btn.textContent = '✨ 동화를 쓰고 있어요...';

  document.getElementById('storyArea').innerHTML = `
    <div class="story-loading-text">
      <div style="font-size:32px;margin-bottom:0.75rem;animation:bounce 1s ease-in-out infinite">✍️</div>
      <p>따뜻한 동화를 만들고 있어요...</p>
    </div>`;

  const ageLabel = { 3: '3~4살', 5: '5~6살', 7: '7~8살', 10: '9~10살' }[currentAge];

  try {
    const res = await fetch('/api/story', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ word: currentWord, ageLabel })
    });
    if (!res.ok) throw new Error('동화 생성 실패');
    const data = await res.json();
    storyGenerated = true;

    document.getElementById('storyArea').innerHTML = `
      <p class="story-text">${esc(data.story)}</p>
      <div class="story-tts-row">
        <button class="story-tts" id="storyTtsBtn">🔊 읽어주기</button>
      </div>
      <div style="margin-top:1rem">
        <button class="story-make-btn" onclick="restartStory()" style="font-size:13px;padding:12px;">
          🔄 다시 만들기
        </button>
      </div>`;

    document.getElementById('storyTtsBtn').addEventListener('click', function () {
      speak(data.story, this);
    });

    checkSurvey('story');
  } catch (err) {
    document.getElementById('storyArea').innerHTML = `
      <div class="story-loading-text"><p>동화 생성 중 오류가 났어요 😥</p></div>
      <button class="story-make-btn" onclick="restartStory()" style="margin-top:1rem">다시 시도하기</button>`;
    console.error(err);
  }
}

function restartStory() {
  storyGenerated = false;
  document.getElementById('storyArea').innerHTML = `
    <button class="story-make-btn" id="storyMakeBtn" onclick="makeStory()">
      ✨ "${esc(currentWord)}"으로 동화 만들기
    </button>`;
}

// ── 토스트 ──────────────────────────────
function showToast(msg) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2500);
}

// ── 유틸 ────────────────────────────────
function esc(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

init();
