프론트엔드에서 폴더 구조를 시각적으로 구현하는 방법 학습 내용

1. 구현 목표

코드 편집기를 요하는 서비스를 개발하기 위해 다음과 같은 프로젝트 폴더 구조를
VS Code의 파일 탐색기처럼 프론트엔드 화면에 트리 구조로 시각화할 필요가 있음.

src/
 ┣ components/
 ┃ ┣ common/
 ┃ ┗ layout/
 ┣ pages/
 ┃ ┣ auth/
 ┃ ┃ ┣ Login.jsx
 ┃ ┃ ┗ Signup.jsx
 ┃ ┣ main/
 ┃ ┗ mypage/
 ┣ services/
 ┃ ┗ authApi.js
 ┣ hooks/
 ┣ styles/
 ┣ utils/
 ┗ App.jsx

2. 방법

폴더 구조를 “데이터(JSON)”로 정의 → 재귀 컴포넌트로 렌더링(실제 파일이 아니라 구조 데이터 기반 렌더링)

3. 폴더 구조 데이터 설계
3.1 트리 구조 JSON 정의
// folderTree.js
export const folderTree = {
  name: "src",
  type: "folder",
  children: [
    {
      name: "components",
      type: "folder",
      children: [
        { name: "common", type: "folder", children: [] },
        { name: "layout", type: "folder", children: [] },
      ],
    },
    {
      name: "pages",
      type: "folder",
      children: [
        {
          name: "auth",
          type: "folder",
          children: [
            { name: "Login.jsx", type: "file" },
            { name: "Signup.jsx", type: "file" },
          ],
        },
        { name: "main", type: "folder", children: [] },
        { name: "mypage", type: "folder", children: [] },
      ],
    },
    {
      name: "services",
      type: "folder",
      children: [{ name: "authApi.js", type: "file" }],
    },
    { name: "hooks", type: "folder", children: [] },
    { name: "styles", type: "folder", children: [] },
    { name: "utils", type: "folder", children: [] },
    { name: "App.jsx", type: "file" },
  ],
};

4. 트리 렌더링 컴포넌트 구현
4.1 재귀 컴포넌트 구조

폴더 안에 또 폴더/파일이 들어가므로 재귀 렌더링이 필수

// FileTree.jsx
import { useState } from "react";

function FileTree({ node }) {
  const [isOpen, setIsOpen] = useState(false);

  if (node.type === "file") {
    return <div style={{ paddingLeft: 20 }}>📄 {node.name}</div>;
  }

  return (
    <div>
      <div
        style={{ cursor: "pointer" }}
        onClick={() => setIsOpen(!isOpen)}
      >
        📁 {node.name}
      </div>

      {isOpen &&
        node.children.map((child, index) => (
          <div key={index} style={{ paddingLeft: 20 }}>
            <FileTree node={child} />
          </div>
        ))}
    </div>
  );
}

export default FileTree;

5. 최상위에서 렌더링
// App.jsx
import FileTree from "./FileTree";
import { folderTree } from "./folderTree";

function App() {
  return (
    <div>
      <h2>Project Structure</h2>
      <FileTree node={folderTree} />
    </div>
  );
}

export default App;

6. VS Code처럼 보이게 만드는 핵심 포인트
6.1 구현 요소 정리
폴더 접기/펼치기	useState
계층 구조	padding-left
아이콘	이모지 또는 SVG
재귀	컴포넌트 자기 자신 호출

6.2 실제 VS Code 느낌을 내고 싶다면
폴더 열림/닫힘 아이콘 분리
선택된 파일 상태 표시
클릭 시 오른쪽 패널에 코드 표시
CSS로 monospace 폰트 적용

7. 이 방식이 한계점

VS Code UI를 단순 복제함

8. 확장 가능성

서버에서 폴더 구조 JSON 내려받기
파일 클릭 시 코드 하이라이팅 표시
드래그 앤 드롭 구현
GitHub 레포 구조 시각화

9. 요약

실제 폴더는 아니지만폴더 구조 데이터(JSON) → 재귀 렌더링 → VS Code 탐색기 UI 구현
즉, 프론트상에서 폴더 구조를 시각적으로 구현하는 방법임.

10. 향후 구현 방향

파일 트리 데이터인 VS Code의 탐색기를 구현하기 위해서는 파일을 클릭하면
파일 경로(path)를 기준으로 해당 파일 내용을 로딩해서 에디터에 렌더링해야 함.
아래 내용을 참고할 수 있음

1️⃣ 파일 선택 상태 관리
{
  name: "Login.jsx",
  type: "file",
  path: "src/pages/auth/Login.jsx"
}
onClick={() => setSelectedFile(node.path)}
✔️ VS Code처럼 “선택된 파일” 개념이 생김

2️⃣ 파일 내용 데이터 연결
const fileContents = {
  "src/pages/auth/Login.jsx": "function Login() { ... }",
};


파일 클릭 → path 기준으로 내용 로드

에디터 영역에 출력

👉 실제 편집기 구조 시작

3️⃣ 에디터 컴포넌트 연결
<Editor value={fileContent} onChange={setFileContent} />
Monaco Editor / CodeMirror 사용 가능
VS Code가 쓰는 Monaco도 웹에서 사용 가능

4️⃣ 수정 내용 상태 관리
{
  path: "src/pages/auth/Login.jsx",
  content: "...",
  isDirty: true
}
저장 안 된 파일 표시
여러 파일 열기 가능

5️⃣ 저장 대상만 달라질 뿐
환경	저장 대상
웹 에디터	상태 / 서버 / DB
VS Code	로컬 파일 시스템

👉 차이는 저장 위치뿐

그래서 “진짜냐, 가짜냐”의 기준
질문	YES면 진짜
파일 선택 상태 있음?	⭕
파일 내용 있음?	⭕
수정 가능?	⭕
에디터 연결됨?	⭕
상태 관리됨?	⭕

👉 이러면 **“웹 기반 코드 에디터”**다.

위 내용처럼 VS Code 탐색기의 구현 방법을 알아보았고, 에디터 + 파일 내용 연결,
저장/동기화까지 구현할 수 있어야 함.

이를 위해 추가적으로 Monaco Editor 연결 방법을 포함하여 구체적인 구현을 위한
자료조사를 할 예정임.

* API를 호출하는 경우 트리가 깊어지면 트리를 재렌더하는 방식은 매우 비효율적이므로
  아래와 같이 구성하는 것이 좋다고 한다.
✅ 탐색기용 API
GET /api/tree
{
  "path": "src",
  "type": "folder",
  "children": [
    {
      "path": "src/components",
      "type": "folder",
      "children": [
        { "path": "src/components/common", "type": "folder" },
        { "path": "src/components/layout", "type": "folder" }
      ]
    },
    {
      "path": "src/App.jsx",
      "type": "file"
    }
  ]
}
-> content 없음
-> 불필요한 메타데이터 없음
-> 탐색기 전용

✅ 파일 내용 API (필요할 때만)
GET /api/file?path=src/pages/auth/Login.jsx

{
  "path": "src/pages/auth/Login.jsx",
  "content": "function Login() { ... }"
}

즉, 클릭한 파일만 로딩하도록 하고, 탐색기와 에디터를 분리하여 탐색기는 구조 관리,
에디터는 내용 관리를 하도록 한다.
+ 캐싱을 통해 한 번 연 파일은 다시 API 호출을 하지 않는다. (const fileCache = new Map();)
+ 한 번 연 파일은 다시 API 호출을 안 하도록 함

* 부분 렌더링
* 열린 폴더만 렌더
* memo / key 사용