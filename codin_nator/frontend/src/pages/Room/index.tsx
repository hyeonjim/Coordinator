import { RoomProvider, useRoomContext } from "@/hooks/room/useRoomContext";
import CodeEditor from "@/components/room/code-editor";
import RoomTerminal from "@/components/room/room-terminal";
import Header from "@/components/room/Header";
import { FileViewer } from "@/components/room/file-viewer";
import { VoiceChat } from "@/components/room/chat/VoiceChat";
import { TextChat } from "@/components/room/chat/TextChat";

export default function RoomPage() {
  return (
    <RoomProvider>
      <RoomLayout />
    </RoomProvider>
  );
}

function RoomLayout() {
  const { selectedFile, currentRoomId, setEditorCode, appendTerminal, terminalOutput } =
    useRoomContext();

  return (
    <div className="room-container">
      <Header />

      <div className="room-main">
        <div className="relative self-stretch">
          <aside className="room-sidebar-left transition-all duration-300 overflow-hidden h-full">
            <div className="flex-1 overflow-auto room-scrollbar">
              <FileViewer />
            </div>
            <div className="h-1/3 flex flex-col">
              <div className="flex-1 overflow-hidden">
                <VoiceChat />
              </div>
            </div>
          </aside>
        </div>

        <main className="room-content">
          <div className="flex-1 min-h-0 overflow-hidden">
            {selectedFile ? (
              <CodeEditor
                key={selectedFile.id}
                fileId={selectedFile.id}
                roomId={Number(currentRoomId)}
                fileContent={selectedFile.content}
                fileName={selectedFile.name}
                onChange={setEditorCode}
                onAppendTerminal={appendTerminal}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-[#858585]">
                파일을 선택해주세요
              </div>
            )}
          </div>
          <RoomTerminal output={terminalOutput} />
        </main>

        <TextChat />
      </div>
    </div>
  );
}
