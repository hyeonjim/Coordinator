import { RoomProvider } from "@/hooks/room/useRoomContext";
import { CodeEditorPanel } from "@/components/room/code-editor";
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
  return (
    <div className="room-container h-screen flex flex-col bg-(--rc-bg)">
      <Header />
      <div className="flex-1 flex overflow-hidden">
        <div className="relative self-stretch">
          <aside className="w-64 flex flex-col bg-(--rc-sidebar-bg) transition-all duration-300 overflow-hidden h-full">
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
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative bg-(--rc-editor-bg)">
          <div className="flex-1 min-h-0 overflow-hidden">
            <CodeEditorPanel />
          </div>
          <RoomTerminal />
        </main>
        <TextChat />
      </div>
    </div>
  );
}
