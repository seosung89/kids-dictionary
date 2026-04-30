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

  const prompt = `당신은 어린이 교육 전문가입니다.
오늘(${date}, ${season})의 단어 하나를 추천해주세요.

조건:
- ${ageLabel} 아이에게 적합한 단어
- 계절(${season})이나 일상생활과 관련된 단어
- 너무 쉽지도 어렵지도 않은 단어
- 부모가 아이와 자연스럽게 대화할 수 있는 단어

반드시 아래 JSON 형식으로만 응답하세요. 다른 말은 절대 하지 마세요:
{
  "word": "추천 단어 1개",
  "emoji": "단어를 나타내는 이모지 1개",
  "reason": "이 단어를 추천한 이유 한 문장 (부모에게 보여주는 짧은 힌트)"
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
    return res.status(200).json(JSON.parse(clean));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};
