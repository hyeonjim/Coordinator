CI/CD

깃허브와 달리 자동 배포가 설정이 너무 다르다.

러너라는 것도 만들어서 사용해야 한다. 

설치 - 설정 - 실행 

config 파일도 pwsh에서 powershell로 수정

| Job | tags 있음? |
| --- | --- |
| build-job |  있음 |
| unit-test-job |  없음 |
| lint-test-job |  없음 |
| deploy-job |  없음 |

tag는 다 있어야 한다.

### package.json 안에:

```json
"scripts":{
"test":"...",
"lint":"..."
}

```

이게 **없으면 바로 Failed** 됨.

test / lint 스크립트 직접 만들어서 사용해야 하는데 (되면 나중에 추가)

cd C:\GitLab-Runner

.\gitlab-runner.exe install

.\gitlab-runner.exe start
→ Windows 서비스 시작
→ PowerShell과 무관하게 동작

## 끄고 싶을 때

```powershell
.\gitlab-runner.exe stop

```

## 완전 자동실행 제거

```powershell
.\gitlab-runner.exe uninstall

```

## 1. 환경 변수 설정

GitHub Personal Access Token을 코드에 직접 노출하지 않기 위해 `.env` 파일에 저장했다.

```env
VITE_GITHUB_TOKEN=your_token_here
```

사용할 때는 아래처럼 불러온다.

```js
const token = import.meta.env.VITE_GITHUB_TOKEN;
```

---

## 2. Base64 → UTF-8 디코딩

GitHub API에서 파일 내용을 가져오면 Base64 인코딩된 문자열로 온다.
이를 사람이 읽을 수 있는 UTF-8 문자열로 변환해야 한다.

```js
function base64ToUtf8(base64) {
  return decodeURIComponent(
    atob(base64)
      .split('')
      .map(c => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
      .join('')
  );
}
```

---

## 3. 브랜치(트리) 구조 조회

### 사용한 API

```
GET /repos/{owner}/{repo}/git/trees/{branch}?recursive=1
```

### 코드

```js
async function checkBranch() {
  const fileRes = await fetch(
    `https://api.github.com/repos/${repoOwner}/${repoName}/git/trees/${branch}?recursive=1`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  const fileData = await fileRes.json();
  console.log(fileData);
}
```

### 응답 데이터 구조

```json
{
  "sha": "...",
  "url": "...",
  "tree": [
    {
      "path": "src/App.jsx",
      "mode": "100644",
      "type": "blob",
      "sha": "...",
      "size": 1234,
      "url": "..."
    }
  ]
}
```

#### 주요 필드

| 필드   | 설명                   |
| ---- | -------------------- |
| path | 파일 경로                |
| type | blob = 파일, tree = 폴더 |
| sha  | 해당 객체의 고유 해시         |
| size | 파일 크기                |

---

## 4. 특정 파일 내용 가져오기

### 사용한 API

```
GET /repos/{owner}/{repo}/contents/{path}?ref={branch}
```

### 코드

```js
async function checkFile() {
  const fileRes = await fetch(
    `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}?ref=${branch}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  const fileData = await fileRes.json();
  const code = base64ToUtf8(fileData.content);
  setCode(code);
}
```

### 응답 데이터 구조

```json
{
  "name": "App.jsx",
  "path": "src/App.jsx",
  "sha": "...",
  "size": 1234,
  "content": "YmFzZTY0ZW5jb2RlZA==",
  "encoding": "base64"
}
```

---

## 5. Monaco Editor 테마 커스터마이징

Monaco Editor는 기본 테마 외에도 커스텀 테마를 정의할 수 있다.

```js
monaco.editor.defineTheme("myTheme", {
  base: "vs-dark",
  inherit: true,
  rules: [
    { token: "comment", foreground: "ffa500", fontStyle: "italic" },
    { token: "keyword", foreground: "00ff00", fontStyle: "bold" },
  ],
  colors: {
    "editor.background": "#1e1e1e",
    "editorLineNumber.foreground": "#888888",
    "editorCursor.foreground": "#ffffff",
  },
});

monaco.editor.setTheme("myTheme");
```

---

## 6. 느낀 점

* GitHub API는 생각보다 응답 데이터가 많다.
* Base64 디코딩을 직접 처리해야 한다.
* 트리 API와 contents API는 용도가 다르다.