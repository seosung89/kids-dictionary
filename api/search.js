module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { word, ageLabel } = req.body;
  if (!word || !ageLabel) return res.status(400).json({ error: '단어와 나이를 입력해주세요.' });

  const prompt = `당신은 어린이 전용 국어사전입니다.
"${word}"라는 단어를 ${ageLabel} 아이에게 설명해주세요.

반드시 아래 JSON 형식으로만 응답하세요. 다른 말은 절대 하지 마세요:
{
  "emoji": "단어를 나타내는 이모지 1개",
  "reading": "읽는 법 (예: [사랑])",
  "definition": "${ageLabel} 아이가 이해할 수 있는 쉬운 설명. 2~3문장. 중요한 단어나 아이가 모를 수 있는 단어는 반드시 [단어] 형식으로 대괄호로 감싸주세요. 예: [행복]은 기분이 좋고 [즐거운] 상태야.",
  "example": "일상에서 쓸 수 있는 짧은 예문 1개",
  "synonyms": ["비슷한 말 2~3개"],
  "antonyms": ["반대 말 1~2개"],
  "related": ["연관 단어 3개"],
  "tags": ["관련 개념 태그 2~3개"]
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
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`Anthropic API 오류: ${response.status} / ${errBody}`);
    }

    const data = await response.json();
    const rawText = data.content.map(i => i.text || '').join('');
    const clean = rawText.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);
    return res.status(200).json(parsed);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};
