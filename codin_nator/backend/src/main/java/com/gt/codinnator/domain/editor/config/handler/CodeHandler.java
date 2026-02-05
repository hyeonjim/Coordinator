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

    private final Map<String, Set<WebSocketSession>> roomAttendees = new ConcurrentHashMap<>();
    // 각 room의 마지막 상태 저장
    private final Map<String, byte[]> roomStates = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        URI uri = session.getUri();

        String path = uri.getPath();
        String[] segments = path.split("/");

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

        log.info("Client Connected: RoomKey={}, SessionID={}, 현재 총인원 : {}명", roomKey, session.getId(), roomAttendees.get(roomKey).size());

        // 새 클라이언트에게 기존 상태 전송
        byte[] savedState = roomStates.get(roomKey);
        if (savedState != null && savedState.length > 0) {
            try {
                synchronized (session) {
                    session.sendMessage(new BinaryMessage(savedState));
                }
            } catch (IOException e) {
                log.warn("기존 상태 전송 실패: {}", session.getId());
            }
        }
    }

    @Override
    protected void handleBinaryMessage(WebSocketSession session, BinaryMessage message) {
        String roomKey = (String) session.getAttributes().get("roomKey");
        Set<WebSocketSession> attendees = roomAttendees.get(roomKey);

        if (attendees == null || roomKey == null) return;

        ByteBuffer payload = message.getPayload();
        byte[] bytes = new byte[payload.remaining()];
        payload.get(bytes);

        // 상태 저장
        roomStates.put(roomKey, bytes);

        // 모든 클라이언트에게 브로드캐스트
        for (WebSocketSession attendee : attendees) {
            if (attendee.isOpen()) {
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
                    roomStates.remove(roomKey);  // 방이 비면 상태도 삭제
                }
            }
        }
        log.info("Client Disconnected: RoomKey={}, SessionID={}", roomKey, session.getId());
    }
}