import FileViewer from "../../components/room/file-viewer";
import RoomTerminal from "../../components/room/room-terminal";
export default function RoomPage() {
  return (
    <div className="h-screen">
      {/* 왼쪽 사이드바 */}
      <aside className="border">
        <div>
          {/* 파일 익스플로러 */}
          <FileViewer />
        </div>
        <div>{/* 음성채팅 */}</div>
      </aside>
      {/* 메인 영역 */}
      <main className="border">
        <div>{/* 에디터 */}</div>
        <div>
          {/* 터미널 */}
          {/* 높이 지정(h-[500px]? 또는 h-screen)
     일단 막 넣어놓음핑 */}
          <div className="h-screen w-full">
            <RoomTerminal
              projectName="codin_nator"
              branchName="main"
              userName="User"
              command="npm test"
              output={`PASS  src/App.test.jsx
              ✓ 화면에 Hello React가 보인다 (32 ms)

              Test Suites: 1 passed, 1 total
              Tests:       1 passed, 1 total
              Snapshots:   0 total
              Time:        1.214 s
              Ran all test suites.`}
              // 추가 상태바 설정핑
              status={{
                language: "Java",
                encoding: "UTF-8",
                connectedUsers: 2,
                cursorInfo: "Ln 1, Col 1",
              }}
            />
          </div>
        </div>
      </main>
      {/* 오른쪽 사이드바 */}
      <aside className="border">
        <div>{/* ai */}</div>
        <div>{/* 텍스트 채팅 */}</div>
      </aside>
    </div>
  );
}
