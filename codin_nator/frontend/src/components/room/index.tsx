import { useRoomContext } from "@/hooks/room/useRoomContext";
import { CodeEditorPanel } from "@/components/room/code-editor";
import RoomTerminal from "@/components/room/room-terminal";
import Header from "@/components/room/Header";
import FileViewer from "@/components/room/file-viewer";
import { VoiceChat } from "@/components/room/chat/VoiceChat";
import { TextChat } from "@/components/room/chat/TextChat";

export function RoomLayout() {
  const { terminalOutput } = useRoomContext();

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
            <CodeEditorPanel />
          </div>
          <RoomTerminal output={terminalOutput} />
        </main>
        <TextChat />
      </div>
    </div>
  );
}
