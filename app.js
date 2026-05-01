// ── 상수 ────────────────────────────────
const QUICK_WORDS = {
  3:  ['사랑', '엄마', '아빠', '친구', '행복', '울다', '웃다', '나누다'],
  5:  ['사랑', '우정', '감사', '용기', '질투', '거짓말', '배려', '행복'],
  7:  ['우정', '용기', '책임', '정직', '감사', '존중', '노력', '희망'],
  10: ['민주주의', '자유', '평화', '경제', '책임', '정의', '환경', '문화'],
};

const STORY_LOADING_MSGS = [
  { emoji: '🐰', text: '토끼가 연필을 잡았어요...' },
  { emoji: '🐻', text: '곰이 이야기를 생각하고 있어요...' },
  { emoji: '🦊', text: '여우가 이야기를 꾸미고 있어요...' },
  { emoji: '🐿️', text: '다람쥐가 이야기를 쓰고 있어요...' },
];

const SEARCH_LOADING_MSGS = [
  { emoji: '🔍', msg: '찾아볼게요!', sub: '열심히 설명을 준비하고 있어요...' },
  { emoji: '📖', msg: '사전을 펼치고 있어요!', sub: '쉬운 말로 바꾸는 중이에요...' },
  { emoji: '✍️', msg: '설명을 쓰고 있어요!', sub: '아이 눈높이에 맞게 다듬는 중...' },
  { emoji: '🌿', msg: '거의 다 됐어요!', sub: '조금만 기다려주세요...' },
];

// ── 상태 ────────────────────────────────
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
  renderQuickWords();
  renderTodayWord();
  window.addEventListener('popstate', () => goHome());
  document.getElementById('searchInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') searchWord();
  });
}

// ── 화면 전환 ────────────────────────────
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
  document.querySelectorAll('.tab').forEach(t =>
    t.classList.toggle('active', t.dataset.tab === tab)
  );
  document.querySelectorAll('.tab-content').forEach(c =>
    c.classList.toggle('hidden', c.id !== `tab-${tab}`)
  );
}

// ── 자주 찾는 단어 ───────────────────────
function renderQuickWords() {
  const words = QUICK_WORDS[currentAge] || QUICK_WORDS[5];
  document.getElementById('quickChips').innerHTML = words
    .map(w => `<button class="qchip" onclick="quickSearch('${esc(w)}')">${esc(w)}</button>`)
    .join('');
}

// ── 오늘의 단어 ──────────────────────────
async function renderTodayWord() {
  const today = new Date();
  const dateKey = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
  const ageKey  = `kidsDict_daily_${dateKey}_${currentAge}`;
  const card = document.getElementById('todayCard');
  card.classList.add('loading');

  // 캐시 확인
  const cached = localStorage.getItem(ageKey);
  if (cached) {
    try {
      applyTodayWord(JSON.parse(cached));
      card.classList.remove('loading');
      return;
    } catch (e) { /* 캐시 파싱 실패 시 새로 요청 */ }
  }

  // API 호출
  const ageLabel = { 3:'3~4살', 5:'5~6살', 7:'7~8살', 10:'9~10살' }[currentAge];
  try {
    const res = await fetch('/api/daily', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ageLabel, date: dateKey })
    });
    if (!res.ok) throw new Error('daily API 오류');
    const data = await res.json();
    localStorage.setItem(ageKey, JSON.stringify(data));
    applyTodayWord(data);
  } catch (e) {
    // 실패 시 나이별 기본값
    const fallback = { 3:'행복', 5:'감사', 7:'용기', 10:'책임' };
    applyTodayWord({
      word: fallback[currentAge] || '감사',
      emoji: '🌟',
      reason: '탭해서 알아보기 →'
    });
    console.error(e);
  } finally {
    card.classList.remove('loading');
  }
}

function applyTodayWord(data) {
  document.getElementById('todayWord').textContent  = data.word  || '감사';
  document.getElementById('todayEmoji').textContent = data.emoji || '💡';
  const hint = document.getElementById('todayHint');
  if (hint) hint.textContent = data.reason || '탭해서 알아보기 →';
}

function searchTodayWord() {
  const word = document.getElementById('todayWord').textContent;
  if (word && word !== '불러오는 중...') quickSearch(word);
}

// ── 나이 설정 ────────────────────────────
function showAgeSheet() { document.getElementById('ageSheetOverlay').classList.remove('hidden'); }
function hideAgeSheet()  { document.getElementById('ageSheetOverlay').classList.add('hidden'); }

function setAge(age) {
  currentAge = age;
  localStorage.setItem('kidsDict_age', age);
  updateAgeBadge(age);
  setActiveAgeOption(age);
  hideAgeSheet();
  renderQuickWords();
  renderTodayWord();
  if (currentWord) searchWord();
}

function updateAgeBadge(age) {
  const labels = { 3:'3~4살', 5:'5~6살', 7:'7~8살', 10:'9~10살' };
  document.getElementById('ageBadgeText').textContent = labels[age];
}

function setActiveAgeOption(age) {
  document.querySelectorAll('.age-option').forEach(o =>
    o.classList.toggle('active', parseInt(o.dataset.age) === age)
  );
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
  const chips   = document.getElementById('historyChips');
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
  if (!('speechSynthesis' in window)) {
    showToast('이 기기에서는 음성을 지원하지 않아요');
    return;
  }
  window.speechSynthesis.cancel();
  if (btnEl.classList.contains('playing')) {
    btnEl.classList.remove('playing');
    return;
  }
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = 'ko-KR'; utter.rate = 0.88; utter.pitch = 1.05;
  utter.onstart = () => btnEl.classList.add('playing');
  utter.onend   = () => btnEl.classList.remove('playing');
  utter.onerror = () => btnEl.classList.remove('playing');
  window.speechSynthesis.speak(utter);
}

// ── 공유 ────────────────────────────────
function shareText(text) {
  if (navigator.share) {
    navigator.share({ title: '우리 아이 국어사전', text }).catch(() => {});
  } else {
    navigator.clipboard.writeText(text)
      .then(() => showToast('클립보드에 복사됐어요! 카카오톡에 붙여넣기 해보세요 😊'))
      .catch(() => showToast('공유를 지원하지 않는 브라우저예요'));
  }
}

// ── 태그 관련 단어 ───────────────────────
async function showTagSheet(tag) {
  const overlay = document.getElementById('tagSheetOverlay');
  const loading = document.getElementById('tagRelatedLoading');
  const chips   = document.getElementById('tagRelatedChips');

  document.getElementById('tagSheetTitle').textContent = `#${tag} 관련 단어`;
  chips.innerHTML = '';
  loading.classList.remove('hidden');   // ← 수정: hidden 제거로 보이게
  overlay.classList.remove('hidden');

  const ageLabel = { 3:'3~4살', 5:'5~6살', 7:'7~8살', 10:'9~10살' }[currentAge];
  try {
    const res = await fetch('/api/related', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tag, ageLabel })
    });
    if (!res.ok) throw new Error();
    const data = await res.json();
    loading.classList.add('hidden');
    chips.innerHTML = (data.words || []).map(w =>
      `<button class="tag-related-chip" onclick="hideTagSheet(); quickSearch('${esc(w)}')">${esc(w)}</button>`
    ).join('');
  } catch {
    loading.classList.add('hidden');
    chips.innerHTML = '<p style="font-size:14px;color:#B0A898;padding:0.5rem 0">단어를 불러오지 못했어요 😥</p>';
  }
}

function hideTagSheet() {
  document.getElementById('tagSheetOverlay').classList.add('hidden');
}

// ── 만족도 조사 ──────────────────────────
function checkSurvey(trigger) {
  if (surveyDone) return;
  if (trigger === 'search' && searchCount >= 3) setTimeout(() => showSurvey(), 800);
  if (trigger === 'story')                       setTimeout(() => showSurvey(), 1500);
}

function showSurvey() {
  if (surveyDone) return;
  document.getElementById('surveyOverlay').classList.remove('hidden');
}

function closeSurvey(done) {
  document.getElementById('surveyOverlay').classList.add('hidden');
  if (done) { surveyDone = true; localStorage.setItem('kidsDict_surveyDone', 'true'); }
}

function setStar(v) {
  selectedStar = v;
  document.querySelectorAll('.star').forEach((s, i) => s.classList.toggle('active', i < v));
  document.getElementById('surveySubmit').disabled = false;
}

function submitSurvey() {
  console.log('만족도:', {
    star: selectedStar,
    comment: document.getElementById('surveyComment').value.trim()
  });
  surveyDone = true;
  localStorage.setItem('kidsDict_surveyDone', 'true');
  closeSurvey(true);
  showToast('소중한 의견 감사해요 💚');
}

// ── 단어 링크 렌더링 ─────────────────────
// [단어] 형식을 탭 가능한 초록 하이라이트로 변환
// 설명(definition)과 예문(example) 양쪽에 모두 적용
function renderLinkedDef(text) {
  if (!text) return '';
  return text.replace(/\[([^\]]+)\]/g, (_, w) => {
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
  if (!word) {
    const box = document.getElementById('homeSearchBox');
    box.classList.add('shake');
    setTimeout(() => box.classList.remove('shake'), 300);
    return;
  }

  currentWord = word;
  storyGenerated = false;
  searchCount++;
  localStorage.setItem('kidsDict_searchCount', searchCount);
  addToHistory(word);

  goResult();
  switchTab('explain');

  const lm = SEARCH_LOADING_MSGS[Math.floor(Math.random() * SEARCH_LOADING_MSGS.length)];
  document.getElementById('loadingEmoji').textContent = lm.emoji;
  document.getElementById('loadingMsg').textContent   = lm.msg;
  document.getElementById('loadingSub').textContent   = lm.sub;
  document.getElementById('resultLoading').classList.remove('hidden');
  document.getElementById('resultContent').classList.add('hidden');
  document.getElementById('resultHeaderWord').textContent = word;

  const ageLabel = { 3:'3~4살', 5:'5~6살', 7:'7~8살', 10:'9~10살' }[currentAge];

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
    document.getElementById('loadingMsg').textContent   = '앗, 오류가 났어요';
    document.getElementById('loadingSub').textContent   = '잠시 후 다시 시도해봐요';
    console.error(err);
  }
}

// ── 결과 렌더링 ──────────────────────────
function renderResult(word, p) {
  // 단어 헤더
  document.getElementById('wordEmoji').textContent   = p.emoji   || '📖';
  document.getElementById('wordBig').textContent     = word;
  document.getElementById('wordReading').textContent = p.reading || '';

  // 설명 — [단어] 링크 포함
  document.getElementById('explainDef').innerHTML = renderLinkedDef(p.definition);

  // 예문 — [단어] 링크 포함 (따옴표 제거)
  const exampleText = (p.example || '').replace(/^"|"$/g, '');
  document.getElementById('explainExample').innerHTML = renderLinkedDef(exampleText);

  // 비슷한말 / 반대말
  document.getElementById('synonymChips').innerHTML = (p.synonyms || [])
    .map(w => `<button class="wchip" onclick="quickSearch('${esc(w)}')">${esc(w)}</button>`).join('');
  document.getElementById('antonymChips').innerHTML = (p.antonyms || [])
    .map(w => `<button class="wchip" onclick="quickSearch('${esc(w)}')">${esc(w)}</button>`).join('');

  // 연관 단어
  document.getElementById('relatedChips').innerHTML = (p.related || [])
    .map(w => `<button class="rchip" onclick="quickSearch('${esc(w)}')">${esc(w)}</button>`).join('');

  // 태그 — 탭하면 관련 단어 시트 오픈
  document.getElementById('tagChips').innerHTML = (p.tags || [])
    .map(t => `<button class="tchip" onclick="showTagSheet('${esc(t)}')"><span class="tchip-hash">#</span>${esc(t)}</button>`).join('');

  // 동화 탭 초기화
  document.getElementById('storyArea').innerHTML = `
    <div class="story-intro">
      <span class="story-intro-emoji">✨</span>
      <div class="story-intro-title">동화 만들기</div>
      <div class="story-intro-sub">검색한 단어가 주인공인<br>짧은 동화를 만들어드려요</div>
      <button class="btn-amber full" onclick="makeStory()">동화 시작하기</button>
    </div>`;

  // 설명 탭 버튼 연결
  const cleanDef  = (p.definition || '').replace(/\[[^\]]+\]/g, m => m.slice(1,-1));
  const cleanEx   = (p.example   || '').replace(/^"|"$/g, '').replace(/\[[^\]]+\]/g, m => m.slice(1,-1));
  const speakText = `${word}. ${cleanDef} 예를 들면, ${cleanEx}`;

  const ttsBtn   = document.getElementById('ttsBtn');
  const shareBtn = document.getElementById('shareBtn');
  const retryBtn = document.getElementById('retryBtn');

  ttsBtn.onclick   = () => speak(speakText, ttsBtn);
  shareBtn.onclick = () => shareText(
    `📖 우리 아이 국어사전\n\n"${word}"\n${cleanDef}\n\n예문: ${cleanEx}\n\n아이와 함께 단어를 배워요 🌿`
  );
  retryBtn.onclick = () => searchWord();

  // 로딩 → 결과 전환
  document.getElementById('resultLoading').classList.add('hidden');
  document.getElementById('resultContent').classList.remove('hidden');
}

// ── 동화 포맷팅 ─────────────────────────
// 문장 부호 기준으로 줄바꿈해서 가독성 높이기
function formatStory(text) {
  if (!text) return '';
  return text
    .split(/(?<=[.!?~])\s+/)
    .map(s => esc(s.trim()))
    .filter(Boolean)
    .join('<br><br>');
}

// ── 동화 ────────────────────────────────
async function makeStory() {
  if (storyGenerated) return;

  const lm = STORY_LOADING_MSGS[Math.floor(Math.random() * STORY_LOADING_MSGS.length)];
  document.getElementById('storyArea').innerHTML = `
    <div class="story-loading-wrap">
      <span class="story-loading-emoji">${lm.emoji}</span>
      <p class="story-loading-text">${lm.text}</p>
    </div>`;

  const ageLabel = { 3:'3~4살', 5:'5~6살', 7:'7~8살', 10:'9~10살' }[currentAge];

  try {
    const res = await fetch('/api/story', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ word: currentWord, ageLabel })
    });
    if (!res.ok) throw new Error();
    const data = await res.json();
    storyGenerated = true;

    document.getElementById('storyArea').innerHTML = `
      <div class="story-result">
        <div class="story-book">
          <div class="story-book-label">✨ ${esc(currentWord)} 동화</div>
          <p class="story-text">${formatStory(data.story)}</p>
        </div>
        <div class="story-actions">
          <button class="btn-base" id="storyTtsBtn">🔊 읽어주기</button>
          <button class="btn-base" id="storyShareBtn">🔗 공유</button>
        </div>
        <div class="action-row" style="margin-top:8px">
          <button class="btn-amber full" onclick="restartStory()">🔄 다시 만들기</button>
        </div>
      </div>`;

    const storyTtsBtn = document.getElementById('storyTtsBtn');
    storyTtsBtn.onclick = () => speak(data.story, storyTtsBtn);
    document.getElementById('storyShareBtn').onclick = () =>
      shareText(`✨ ${currentWord} 동화\n\n${data.story}\n\n우리 아이 국어사전 🌿`);

    checkSurvey('story');
  } catch {
    document.getElementById('storyArea').innerHTML = `
      <div class="story-intro">
        <span class="story-intro-emoji">😥</span>
        <div class="story-intro-title">동화 생성 실패</div>
        <div class="story-intro-sub">잠시 후 다시 시도해봐요</div>
        <button class="btn-amber full" onclick="restartStory()">다시 시도하기</button>
      </div>`;
  }
}

function restartStory() {
  storyGenerated = false;
  document.getElementById('storyArea').innerHTML = `
    <div class="story-intro">
      <span class="story-intro-emoji">✨</span>
      <div class="story-intro-title">동화 만들기</div>
      <div class="story-intro-sub">검색한 단어가 주인공인<br>짧은 동화를 만들어드려요</div>
      <button class="btn-amber full" onclick="makeStory()">동화 시작하기</button>
    </div>`;
}

// ── 토스트 ──────────────────────────────
function showToast(msg) {
  document.querySelectorAll('.toast').forEach(t => t.remove());
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2500);
}

// ── 유틸 ────────────────────────────────
function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

init();
