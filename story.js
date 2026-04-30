module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { word, ageLabel } = req.body;
  if (!word || !ageLabel) return res.status(400).json({ error: '단어와 나이를 입력해주세요.' });

  const prompt = `당신은 어린이를 위한 동화 작가입니다.
"${word}"라는 단어가 자연스럽게 나오는 ${ageLabel} 아이를 위한 짧은 동화를 써주세요.

조건:
- 3~5문장으로 아주 짧게
- 따뜻하고 귀여운 내용
- 아이가 쉽게 이해할 수 있는 단어 사용
- "${word}"의 뜻이 자연스럽게 전달되도록
- 동화 내용만 출력하고 제목이나 다른 말은 하지 마세요`;

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
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`Anthropic API 오류: ${response.status} / ${errBody}`);
    }

    const data = await response.json();
    const story = data.content.map(i => i.text || '').join('').trim();
    return res.status(200).json({ story });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};
