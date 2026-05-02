module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { word, ageLabel } = req.body;
  if (!word) return res.status(400).json({ error: '단어를 입력해주세요.' });

  // 나이별 설명 수준
  const descGuide = {
    '3~4살': '엄마/밥/강아지 수준의 아주 쉬운 단어로. 8단어 이내.',
    '5~6살': '유치원생이 아는 단어로. 12단어 이내.',
    '7~8살': '초등 1~2학년 수준으로. 15단어 이내.',
    '9~10살': '초등 3~4학년 수준으로. 간결하게.'
  };

  const prompt = `"${word}"라는 단어에 동음이의어(같은 발음, 다른 뜻)가 있는지 확인해주세요.
desc는 ${ageLabel} 아이 눈높이로 작성하세요. (${descGuide[ageLabel] || descGuide['5~6살']})

반드시 아래 JSON 형식으로만 응답하세요. 다른 말은 절대 하지 마세요:

동음이의어가 있는 경우:
{
  "hasHomonym": true,
  "meanings": [
    { "meaning": "뜻 분류 (예: 열매, 시간)", "desc": "${ageLabel} 눈높이의 짧은 설명", "emoji": "이모지" },
    { "meaning": "뜻 분류", "desc": "짧은 설명", "emoji": "이모지" }
  ]
}

동음이의어가 없는 경우:
{
  "hasHomonym": false,
  "meanings": []
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
        max_tokens: 400,
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
    console.error('[homonym]', err.message);
    return res.status(500).json({ hasHomonym: false, meanings: [] });
  }
};
