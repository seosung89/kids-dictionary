module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { tag, ageLabel } = req.body;
  if (!tag || !ageLabel) return res.status(400).json({ error: '태그와 나이를 입력해주세요.' });

  const wordGuide = {
    '3~4살': '엄마/밥/강아지처럼 아이가 일상에서 직접 경험하는 것들. 한자어 절대 금지.',
    '5~6살': '유치원생이 알 법한 단어. 친근하고 구체적인 것들.',
    '7~8살': '초등 1~2학년 교과서에 나올 단어. 일상 + 약간의 개념어.',
    '9~10살': '초등 3~4학년 수준. 다양한 어휘 허용.'
  };

  const prompt = `당신은 새싹사전의 어린이 교육 전문가입니다.
"${tag}"와 관련된 단어 8개를 추천해주세요.

━━━ 조건 ━━━
- 대상: ${ageLabel} 아이
- 단어 수준: ${wordGuide[ageLabel] || wordGuide['5~6살']}
- "${tag}"와 자연스럽게 연결되는 단어들
- 아이가 실제로 찾아보고 싶어질 흥미로운 단어들
- 8개 모두 서로 다른 단어

반드시 아래 JSON 형식으로만 응답하세요. 다른 말은 절대 하지 마세요:
{
  "words": ["단어1", "단어2", "단어3", "단어4", "단어5", "단어6", "단어7", "단어8"]
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
        max_tokens: 300,
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
    if (!Array.isArray(parsed.words)) throw new Error('words 배열 없음');
    return res.status(200).json(parsed);
  } catch (err) {
    console.error('[related]', err.message);
    return res.status(500).json({ error: err.message });
  }
};
