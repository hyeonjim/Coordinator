import FileViewer from "../../components/room/file-viewer";

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
        <div>{/* 터미널 */}</div>
      </main>
      {/* 오른쪽 사이드바 */}
      <aside className="border">
        <div>{/* ai */}</div>
        <div>{/* 텍스트 채팅 */}</div>
      </aside>
    </div>
  );
}
