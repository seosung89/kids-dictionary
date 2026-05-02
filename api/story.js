module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { word, ageLabel } = req.body;
  if (!word || !ageLabel) return res.status(400).json({ error: '단어와 나이를 입력해주세요.' });

  const animals = ['토끼 솜이', '곰 뭉이', '강아지 콩이', '고양이 나비', '다람쥐 도토리', '여우 루나'];
  const animal = animals[Math.floor(Math.random() * animals.length)];

  const ageGuide = {
    '3~4살': `
- 사용 단어: 엄마, 아빠, 밥, 자다, 먹다, 뛰다, 예쁘다 수준
- 한 문장 최대 8단어. 총 5~6문장.
- "~했어요", "~이에요" 말투
- 같은 표현 반복해도 OK (3~4살은 반복을 좋아함)
- 감정은 "기뻤어요", "슬펐어요", "무서웠어요" 수준으로
- 금지: 한자어, 추상어, 긴 문장

■ 나쁜 예시 vs 좋은 예시 ("용기" 단어 기준)
  ❌ "솜이는 두려움을 극복하고 용기를 발휘하여 어려운 상황을 헤쳐나갔어요. 결국 솜이는 자신의 내면에서 진정한 힘을 발견했어요."
  ✅ "솜이는 무서웠어요. 그래도 한 발짝 내딛었어요. 엄마가 '잘했어!' 하고 안아줬어요. 솜이는 기뻤어요."`,

    '5~6살': `
- 사용 단어: 유치원 교재 수준. 친구, 놀이터, 꽃, 나무, 비, 바람
- 한 문장 최대 12단어. 총 7~8문장.
- "~했어요", "~이에요" 말투
- 의성어/의태어 적극 활용 (폴짝폴짝, 살금살금, 반짝반짝)
- 감정 표현 풍부하게
- 금지: 한자어, 과학 용어, 어른 말투

■ 나쁜 예시 vs 좋은 예시 ("나눔" 단어 기준)
  ❌ "콩이는 자원의 분배와 공유의 중요성을 인식하게 되었어요. 타인을 배려하는 것이 사회적 관계에서 얼마나 중요한지 깨달았죠."
  ✅ "콩이에게는 맛있는 도토리가 딱 하나 있었어요. 친구 나비가 배고파 보였어요. 콩이는 도토리를 반으로 나눠줬어요. 둘이 함께 먹으니 더 맛있었어요!"`,

    '7~8살': `
- 사용 단어: 초등 1~2학년 교과서 수준
- 한 문장 최대 15단어. 총 8~9문장.
- 자연스러운 서술 말투 가능
- 주인공의 생각과 감정을 구체적으로 묘사
- 간단한 문제 해결 과정 포함
- 약간의 교훈이 자연스럽게 녹아들면 좋음

■ 나쁜 예시 vs 좋은 예시 ("인내" 단어 기준)
  ❌ "루나는 역경을 극복하는 과정에서 인내의 가치를 체득했어요. 목표 달성을 위한 지속적인 노력이 성공의 핵심임을 깨달았죠."
  ✅ "루나는 매일 조금씩 돌을 날랐어요. 힘들어서 포기하고 싶었지만 꾹 참았어요. 드디어 집이 완성되자 루나는 뿌듯함에 눈물이 났어요."`,

    '9~10살': `
- 사용 단어: 초등 3~4학년 교과서 수준
- 한 문장 최대 20단어. 총 9~10문장.
- 풍부한 묘사와 비유 사용 가능
- 주인공이 고민하고 선택하는 과정 포함
- 명확한 교훈 또는 감동적인 메시지로 마무리
- 이야기의 기승전결이 뚜렷하게

■ 나쁜 예시 vs 좋은 예시 ("책임" 단어 기준)
  ❌ "뭉이는 책임의 개념적 의미를 이해하고 사회적 의무를 다하는 것이 공동체 유지에 필수적임을 인식하게 되었습니다."
  ✅ "뭉이는 화단 물주기를 맡았지만 며칠 동안 잊어버렸어요. 시든 꽃을 보며 마음이 무거웠어요. 그때부터 뭉이는 달력에 표시하며 단 하루도 빠뜨리지 않았어요. 꽃이 다시 활짝 피던 날, 뭉이는 책임진다는 게 뭔지 온몸으로 느꼈어요."`
  };

  const prompt = `당신은 어린이를 위한 동화 작가입니다.
주인공 "${animal}"가 나오는 따뜻한 동화를 써주세요.
이야기 안에서 "${word}"라는 단어의 의미가 자연스럽게 느껴져야 해요.

━━━ ${ageLabel} 동화 규칙 (반드시 준수) ━━━
${ageGuide[ageLabel] || ageGuide['5~6살']}

━━━ 구조 ━━━
기(시작): ${animal} 소개와 상황 설명
승(사건): 문제나 설레는 일이 생김
전(핵심): "${word}"의 의미가 이야기 속에 자연스럽게 녹아듦
결(마무리): 따뜻하고 행복하게 끝남

━━━ 주의사항 ━━━
✔ 모든 단어가 ${ageLabel} 수준에 맞는지 확인
✔ 억지스럽지 않게 "${word}"가 이야기에 녹아들게
✔ 아이가 읽으면 미소 짓거나 공감할 수 있는 내용
✔ 동화 본문만 출력. 제목, 작가명, 설명 절대 쓰지 말 것.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 900,
        messages: [{ role: 'user', content: prompt }]
      })
    });
    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`API 오류: ${response.status} / ${errBody}`);
    }
    const data = await response.json();
    const story = data.content.map(i => i.text || '').join('').trim();
    return res.status(200).json({ story });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};
