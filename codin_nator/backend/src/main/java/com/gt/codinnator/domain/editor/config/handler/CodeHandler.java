package com.gt.codinnator.domain.editor.config.handler;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.BinaryMessage;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.BinaryWebSocketHandler;

import java.io.IOException;
import java.net.URI;
import java.nio.ByteBuffer;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Component
@Slf4j
@RequiredArgsConstructor
public class CodeHandler extends BinaryWebSocketHandler {

    // Key: "roomId:fileId"
    private final Map<String, Set<WebSocketSession>> roomAttendees = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        URI uri = session.getUri();
        String path = uri.getPath(); // 예: /ws/code/1/10
        String[] segments = path.split("/");

        // [수정] 방어 코드 주석 해제 (안전장치)
        // segments: ["", "ws", "code", "1", "10"] -> 최소 5개여야 함
        if (segments.length < 5) {
            log.error("잘못된 접속 주소입니다: {}", path);
            session.close();
            return;
        }

        String roomId = segments[3];
        String fileId = segments[4];
        String roomKey = roomId + ":" + fileId;

        session.getAttributes().put("roomKey", roomKey);

        roomAttendees.computeIfAbsent(roomKey, k -> ConcurrentHashMap.newKeySet()).add(session);

        log.info("Client Connected: RoomKey={}, SessionID={}", roomKey, session.getId());
    }

    @Override
    protected void handleBinaryMessage(WebSocketSession session, BinaryMessage message) {
        String roomKey = (String) session.getAttributes().get("roomKey");
        Set<WebSocketSession> attendees = roomAttendees.get(roomKey);

        if (attendees == null) return;

        ByteBuffer payload = message.getPayload();
        byte[] bytes = new byte[payload.remaining()];
        payload.get(bytes);

        // 나를 제외한 모든 사람에게 바이너리 데이터 릴레이
        for (WebSocketSession attendee : attendees) {
            if (attendee.isOpen() && !attendee.getId().equals(session.getId())) {
                try {
                    synchronized (attendee) {
                        attendee.sendMessage(new BinaryMessage(bytes));
                    }
                } catch (IOException e) {
                    log.warn("메시지 전송 실패: {}", attendee.getId());
                }
            }
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        String roomKey = (String) session.getAttributes().get("roomKey");
        if (roomKey != null) {
            Set<WebSocketSession> attendees = roomAttendees.get(roomKey);
            if (attendees != null) {
                attendees.remove(session);
                if (attendees.isEmpty()) {
                    roomAttendees.remove(roomKey);
                }
            }
        }
        log.info("Client Disconnected: RoomKey={}, SessionID={}", roomKey, session.getId());
    }
}