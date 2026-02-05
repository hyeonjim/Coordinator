package com.gt.codinnator.domain.editor.config.handler;

import com.gt.codinnator.domain.editor.service.CodeService;
import com.gt.codinnator.domain.git.dto.ChangeFileDto;
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
import java.nio.charset.StandardCharsets;
import java.util.List;
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
    // ✅ NEW: 각 room의 초기 동기화 완료 여부 추적
    private final Map<String, Boolean> roomInitialized = new ConcurrentHashMap<>();
    // ✅ NEW: 세션별 초기 상태 전송 여부 추적
    private final Map<String, Boolean> sessionStateReceived = new ConcurrentHashMap<>();

    private final CodeService codeService;

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
        String sessionKey = roomKey + ":" + session.getId();

        session.getAttributes().put("roomKey", roomKey);
        roomAttendees.computeIfAbsent(roomKey, k -> ConcurrentHashMap.newKeySet()).add(session);

        log.info("Client Connected: RoomKey={}, SessionID={}, 현재 총인원: {}명",
                roomKey, session.getId(), roomAttendees.get(roomKey).size());

        // ✅ CHANGED: 초기화된 방에만 상태 전송 (Yjs 동기화 담당)
        // 백엔드는 마지막 저장 상태만 보관하고,
        // 신규 클라이언트의 상태 초기화는 API 또는 프론트엔드의 seedFromText()에 맡김
        byte[] savedState = roomStates.get(roomKey);
        if (savedState != null && savedState.length > 0) {
            if (!sessionStateReceived.containsKey(sessionKey)) {
                try {
                    synchronized (session) {
                        session.sendMessage(new BinaryMessage(savedState));
                        sessionStateReceived.put(sessionKey, true);
                        log.info("초기 상태 전송: RoomKey={}, SessionID={}", roomKey, session.getId());
                    }
                } catch (IOException e) {
                    log.warn("초기 상태 전송 실패: {}", session.getId());
                }
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

        // ✅ CHANGED: 상태 저장 (Yjs에서 온 모든 변경사항 반영)
        roomStates.put(roomKey, bytes);
        roomInitialized.put(roomKey, true);

        // ✅ CHANGED: 자신을 제외한 다른 클라이언트에게만 전송
        for (WebSocketSession attendee : attendees) {
            // 자신을 제외
            if (attendee.getId().equals(session.getId())) {
                continue;
            }

            if (attendee.isOpen()) {
                try {
                    synchronized (attendee) {
                        log.info("메시지 전송: RoomKey={}, From={}, To={}",
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
        String sessionKey = roomKey + ":" + session.getId();

        if (roomKey == null) return;

        Set<WebSocketSession> attendees = roomAttendees.get(roomKey);
        if (attendees != null) {
            attendees.remove(session);

            log.info("Client Disconnected: RoomKey={}, SessionID={}, 남은 인원: {}명",
                    roomKey, session.getId(), attendees.size());

            // ✅ CHANGED: 모든 사용자가 떠날 때만 저장
            // 이렇게 하면 모든 사용자가 편집을 완료했을 때만 DB에 저장
            if (attendees.isEmpty()) {
                byte[] lastState = roomStates.get(roomKey);
                if (lastState != null && lastState.length > 0) {
                    try {
                        String[] parts = roomKey.split(":");
                        Long roomId = Long.parseLong(parts[0]);
                        Long fileId = Long.parseLong(parts[1]);
                        String content = new String(lastState, StandardCharsets.UTF_8);

                        ChangeFileDto dto = new ChangeFileDto(fileId, content);
                        codeService.saveChangeFiles(roomId, List.of(dto));

                        log.info("파일 자동 저장 완료: RoomKey={}", roomKey);

                        // 메모리 정리
                        roomStates.remove(roomKey);
                        roomAttendees.remove(roomKey);
                        roomInitialized.remove(roomKey);
                    } catch (Exception e) {
                        log.error("자동 저장 중 오류 발생: {}", e.getMessage());
                    }
                }
            }
        }

        // 세션별 상태 정리
        sessionStateReceived.remove(sessionKey);
    }
}