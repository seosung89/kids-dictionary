module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { tag, ageLabel } = req.body;
  if (!tag || !ageLabel) return res.status(400).json({ error: '태그와 나이를 입력해주세요.' });

  const prompt = `당신은 어린이 교육 전문가입니다.
"${tag}"와 관련된 단어 8개를 추천해주세요.
${ageLabel} 아이가 배우기 좋은 단어들로 선택해주세요.

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
    return res.status(200).json(JSON.parse(clean));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};
