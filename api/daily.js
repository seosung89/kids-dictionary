module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { ageLabel, date } = req.body;
  if (!ageLabel) return res.status(400).json({ error: '나이를 입력해주세요.' });

  const today = new Date();
  const month = today.getMonth() + 1;
  const season = month >= 3 && month <= 5 ? '봄' :
                 month >= 6 && month <= 8 ? '여름' :
                 month >= 9 && month <= 11 ? '가을' : '겨울';

  const wordGuide = {
    '3~4살': '엄마/강아지/꽃처럼 아이가 이미 아는 것에 한 발짝 나아간 쉬운 단어. 한자어/추상어 절대 금지.',
    '5~6살': '유치원생이 들어본 적 있는 단어. 감정, 계절, 자연, 일상 관련. 한자어 금지.',
    '7~8살': '초등 1~2학년 교과서에 나올 법한 단어. 약간의 추상 개념 허용.',
    '9~10살': '초등 3~4학년 수준. 사회, 과학, 감정의 다양한 어휘.'
  };

  // reason은 부모에게 보여주는 대화 힌트
  const reasonGuide = {
    '3~4살': '부모가 아이와 나눌 수 있는 짧은 대화 힌트. 예: "산책할 때 이 단어로 아이와 이야기 나눠보세요"',
    '5~6살': '부모가 아이와 나눌 수 있는 대화 힌트. 일상 속 어떤 순간에 이 단어를 꺼내면 좋은지.',
    '7~8살': '부모가 아이와 나눌 수 있는 대화 힌트. 아이의 경험과 연결되는 이야기 소재.',
    '9~10살': '부모가 아이와 나눌 수 있는 대화 힌트. 아이가 스스로 생각해볼 수 있는 질문 형식도 좋음.'
  };

  const prompt = `당신은 새싹사전의 어린이 교육 전문가입니다.
오늘(${date}, ${season}) 부모가 아이와 함께 배우기 좋은 단어 하나를 추천해주세요.

━━━ 조건 ━━━
- 대상 아이: ${ageLabel}
- 단어 수준: ${wordGuide[ageLabel] || wordGuide['5~6살']}
- ${season}이나 일상생활과 자연스럽게 연결되는 단어
- 부모가 아이와 대화를 시작하기 좋은 단어

━━━ reason 작성 기준 (중요) ━━━
- 이 앱은 부모가 아이를 위해 사용하는 사전이에요
- reason은 부모에게 보여주는 메시지예요
- ${reasonGuide[ageLabel] || reasonGuide['5~6살']}
- 예시: "봄나들이 나가기 전에 이 단어로 아이와 이야기 나눠보세요"
- 20자 내외로 짧고 자연스럽게

반드시 아래 JSON 형식으로만 응답하세요. 다른 말은 절대 하지 마세요:
{
  "word": "추천 단어 1개",
  "emoji": "단어를 나타내는 이모지 1개",
  "reason": "부모에게 보여주는 대화 힌트 한 문장"
}`;

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
        max_tokens: 200,
        messages: [{ role: 'user', content: prompt }]
      })
    });
    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`API 오류: ${response.status} / ${errBody}`);
    }
    const data = await response.json();
    const raw = data.content.map(i => i.text || '').join('');
    const clean = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);
    if (!parsed.word) throw new Error('단어 없음');
    return res.status(200).json(parsed);
  } catch (err) {
    console.error('[daily]', err.message);
    return res.status(500).json({ error: err.message });
  }
};
