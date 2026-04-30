[README.md](https://github.com/user-attachments/files/27235512/README.md)
# 우리 아이 국어사전 🐣

나이에 맞게 단어를 쉽게 설명해주는 어린이 전용 국어사전 웹앱이에요.

---

## 파일 구조

```
kids-dictionary/
├── index.html   ← 화면 구조
├── style.css    ← 디자인
├── app.js       ← 기능 로직
└── README.md    ← 이 파일
```

---

## 배포 방법 (Vercel — 무료)

### 1단계 — GitHub에 올리기

1. [github.com](https://github.com) 에서 계정 만들기
2. 우측 상단 `+` → `New repository` 클릭
3. Repository name: `kids-dictionary` 입력 후 `Create repository`
4. `uploading an existing file` 클릭
5. 이 폴더의 파일 3개(index.html, style.css, app.js)를 드래그 앤 드롭
6. `Commit changes` 클릭

### 2단계 — Vercel에 배포하기

1. [vercel.com](https://vercel.com) 접속 → `Continue with GitHub` 로그인
2. `Add New Project` → `kids-dictionary` 선택 → `Import`
3. `Environment Variables` 항목에서:
   - Name: `VITE_API_KEY`
   - Value: Anthropic API 키 입력 (https://console.anthropic.com 에서 발급)
4. `Deploy` 클릭
5. 완료! `kids-dictionary.vercel.app` 같은 주소가 생겨요.

### 3단계 — API 키 연결

`app.js` 첫 줄의 `API_KEY` 변수에 Anthropic API 키가 필요해요.

> ⚠️ 보안 주의: API 키는 코드에 직접 넣으면 안 돼요!
> Vercel 환경변수로 관리하거나, 서버(Vercel Serverless Function)를 통해 주입하세요.

Vercel Serverless Function을 쓰는 방법은 Claude에게
"Vercel Serverless Function으로 Anthropic API 키를 안전하게 사용하는 코드 만들어줘" 라고 물어보세요.

---

## 로컬에서 테스트

별도 설치 없이 바로 실행 가능해요.

1. `index.html` 파일을 크롬 브라우저에서 열기
2. `app.js` 상단의 `API_KEY` 변수에 임시로 키 입력 (테스트 후 반드시 제거)
3. 단어를 검색해서 동작 확인

---

## 주요 기능

- 나이별(3~4살 / 5~6살 / 7~8살 / 9~10살) 맞춤 설명
- 비슷한 말 / 반대 말 / 연관 단어 제공
- 🔊 음성으로 읽어주기 (Web Speech API)
- 검색 기록 자동 저장 (로컬)
- 나이 설정 기억 (로컬)

---

## 앱으로 전환할 때 (나중에)

웹앱이 안정화되면 React Native + Expo로 전환할 수 있어요.
Claude에게 "이 웹앱을 React Native로 전환해줘" 라고 요청하면 도움받을 수 있어요.
