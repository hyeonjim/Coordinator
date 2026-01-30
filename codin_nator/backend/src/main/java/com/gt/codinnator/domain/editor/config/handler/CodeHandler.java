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

    // 방(Room)별로 접속한 사람들을 관리하는 메모리 저장소
    // Key: "roomId:fileId", Value: 세션 목록
    private final Map<String, Set<WebSocketSession>> roomAttendees = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        // 1. 주소 파싱 (/ws/code/1/10?userId=tester)
        URI uri = session.getUri();
        String path = uri.getPath();
        String[] segments = path.split("/");

//        if (segments.length < 5) {
//            log.error("잘못된 접속 주소입니다: {}", path);
//            session.close();
//            return;
//        }

        String roomId = segments[3];
        String fileId = segments[4];
        String roomKey = roomId + ":" + fileId;

        // 2. 세션 속성에 저장 (나중에 퇴장할 때 쓰려고)
        session.getAttributes().put("roomKey", roomKey);

        // 3. 방에 입장 시키기 (Set에 추가)
        roomAttendees.computeIfAbsent(roomKey, k -> ConcurrentHashMap.newKeySet()).add(session);

        log.info("입장 >> : RoomKey={}, SessionID={}", roomKey, session.getId());
    }

    @Override
    protected void handleBinaryMessage(WebSocketSession session, BinaryMessage message) {
        String roomKey = (String) session.getAttributes().get("roomKey");
        Set<WebSocketSession> attendees = roomAttendees.get(roomKey);

        if (attendees == null) return;

        // 메시지 내용 복사 (ByteBuffer는 한 번 읽으면 사라지므로 복사해서 써야 함)
        ByteBuffer payload = message.getPayload();
        byte[] bytes = new byte[payload.remaining()];
        payload.get(bytes);

        // 🔥 [핵심] 나를 제외한 모든 사람에게 그대로 전달 (Relay)
        for (WebSocketSession attendee : attendees) {
            if (attendee.isOpen() && !attendee.getId().equals(session.getId())) {
                try {
                    // 동기화 블록으로 전송 순서 꼬임 방지
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
        Set<WebSocketSession> attendees = roomAttendees.get(roomKey);

        if (attendees != null) {
            attendees.remove(session);
            // 방에 아무도 없으면 방 자체를 삭제 (메모리 절약)
            if (attendees.isEmpty()) {
                roomAttendees.remove(roomKey);
            }
        }
        log.info("퇴장: RoomKey={}, SessionID={}", roomKey, session.getId());
    }
}