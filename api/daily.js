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

  // 나이별 적합 단어 수준 가이드
  const wordGuide = {
    '3~4살': '엄마, 아빠, 강아지, 꽃, 비, 밥처럼 아이가 이미 아는 쉬운 단어에 한 발짝 나아간 수준. 절대로 한자어나 추상어 금지.',
    '5~6살': '유치원생이 들어본 적 있는 단어. 감정, 계절, 자연, 일상 관련. 한자어 금지.',
    '7~8살': '초등 1~2학년 교과서에 나올 법한 단어. 약간의 추상 개념 허용.',
    '9~10살': '초등 3~4학년 수준. 사회, 과학, 감정의 다양한 어휘.'
  };

  const prompt = `당신은 새싹사전의 어린이 교육 전문가입니다.
오늘(${date}, ${season})의 단어 하나를 추천해주세요.

━━━ 조건 ━━━
- 대상: ${ageLabel} 아이
- 단어 수준: ${wordGuide[ageLabel] || wordGuide['5~6살']}
- 계절(${season})이나 일상생활과 자연스럽게 연결되는 단어
- 부모가 아이와 대화를 시작하기 좋은 단어
- reason은 부모에게 보여주는 힌트로, 왜 오늘 이 단어를 배우면 좋은지 한 문장으로

반드시 아래 JSON 형식으로만 응답하세요. 다른 말은 절대 하지 마세요:
{
  "word": "추천 단어 1개",
  "emoji": "단어를 나타내는 이모지 1개",
  "reason": "오늘 이 단어를 배우면 좋은 이유 한 문장 (${ageLabel} 눈높이 고려)"
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
