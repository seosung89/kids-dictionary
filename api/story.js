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

  const prompt = `당신은 어린이를 위한 동화 작가입니다.
주인공 "${animal}"가 나오는 동화를 써주세요.
동화 안에 "${word}"라는 단어의 뜻이 자연스럽게 느껴지도록 이야기를 만들어주세요.

조건:
- ${ageLabel} 아이를 위한 쉬운 단어 사용
- 기승전결 구조로 7~10문장
- 기: ${animal} 소개와 상황 (1~2문장)
- 승: 문제나 사건 발생 (2~3문장)
- 전: "${word}"의 의미가 자연스럽게 등장 (2~3문장)
- 결: 따뜻하고 행복한 마무리 (1~2문장)
- 아이가 읽으면 미소 지을 수 있는 따뜻한 내용
- 동화 본문만 출력하고 제목이나 다른 말은 절대 하지 마세요`;

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
        max_tokens: 800,
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
