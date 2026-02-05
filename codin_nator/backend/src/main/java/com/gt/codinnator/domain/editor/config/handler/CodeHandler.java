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
        String roomKey = roomId+":"+fileId;

        session.getAttributes().put("roomKey", roomKey);
        roomAttendees.computeIfAbsent(roomKey, k -> ConcurrentHashMap.newKeySet()).add(session);

        log.info("Client Connected: RoomKey={}, SessionID={}, 현재 총인원 : {}명", roomKey, session.getId(), roomAttendees.get(roomKey).size());

        // 새 클라이언트에게 기존 상태 전송
        byte[] savedState = roomStates.get(roomKey);
        if (savedState != null && savedState.length > 0 && !session.getAttributes().containsKey("sentState")) {
            try {
                synchronized (session) {
                    session.sendMessage(new BinaryMessage(savedState));
                    session.getAttributes().put("sentState", true); // 상태 전송
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
                        if (attendee.getId().equals(session.getId())) {
                            continue; // 메시지를 보낸 본인에게는 다시 보내지 않음
                        }
                        log.info("메시지 전송: RoomKey={}, FromSessionID={}, ToSessionID={}",
                                roomKey, session.getId(), attendee.getId());

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
        byte[] saveState = roomStates.get(roomKey);

        if(saveState != null){
            String content = new String(saveState);
            log.info("이제까지 작성된 코드 :{}, 길이 : {}", content, saveState.length);
            try{
                synchronized (session) {
                    session.sendMessage(new BinaryMessage(saveState));
                }
            } catch (IOException e) {
                log.error("전송 실패");
                throw new RuntimeException(e);
            }
        }
        log.info("Client Disconnected: RoomKey={}, SessionID={}", roomKey, session.getId());
    }
}