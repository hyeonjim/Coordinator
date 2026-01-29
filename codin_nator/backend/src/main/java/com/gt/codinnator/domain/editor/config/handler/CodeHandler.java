package com.gt.codinnator.domain.editor.config.handler;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.BinaryMessage;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.BinaryWebSocketHandler;

import java.net.URI;
import java.nio.ByteBuffer;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@Component
@Slf4j
@RequiredArgsConstructor
public class CodeHandler extends BinaryWebSocketHandler {

    private final Map<String, Set<WebSocketSession>> roomAttendees = new ConcurrentHashMap<>();
    private final RedisTemplate<String, byte[]> redisTemplate;
    private final ExecutorService executorService = Executors.newCachedThreadPool();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        URI uri = session.getUri();
        String path = uri.getPath();
        String[] segments = path.split("/");

        // 주소 파싱 로직 (안전하게 처리)
        if(segments.length < 5) {
            log.error("잘못된 접속 주소입니다: {}", path);
            session.close();
            return;
        }

        String roomId = segments[3];
        String fileId = segments[4];

        String query = uri.getQuery();
        String userId = (query != null && query.contains("=")) ? query.split("=")[1] : "userA";

        log.info("입장: Room={}, File={}, User={}", roomId, fileId, userId);

        session.getAttributes().put("roomId", roomId);
        session.getAttributes().put("fileId", fileId);
        session.getAttributes().put("userId", userId);

        String roomKey = roomId + ":" + fileId;
        roomAttendees.computeIfAbsent(roomKey, k -> ConcurrentHashMap.newKeySet()).add(session);

        try {
            String redisKey = "code:" + roomId + ":" + fileId;
            List<byte[]> history = redisTemplate.opsForList().range(redisKey, 0, -1);

            if(history != null && !history.isEmpty()) {
                // 한 사람(session)에게 동시에 여러 메시지를 보내면 에러나므로 줄 세우기(Lock)
                synchronized (session) {
                    for(byte[] b : history){
                        if (session.isOpen()) {
                            session.sendMessage(new BinaryMessage(b));
                        }
                    }
                }
            }

        } catch (Exception e) {
        }
    }

    // 텍스트 메시지가 와도 연결 끊지 않음 (안전장치)
    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) {
        log.info("텍스트 메시지 수신됨(무시): {}", message.getPayload());
    }

    @Override
    protected void handleBinaryMessage(WebSocketSession session, BinaryMessage message) throws Exception {
        String roomId = (String) session.getAttributes().get("roomId");
        String fileId = (String) session.getAttributes().get("fileId");
        String roomKey = roomId + ":" + fileId;
        String redisKey = "code:" + roomId + ":" + fileId;

        ByteBuffer payload = message.getPayload();
        byte[] b = new byte[payload.remaining()];
        payload.get(b);

        // 메인 스레드 -> 즉시 실행
        Set<WebSocketSession> people = roomAttendees.get(roomKey);
        if (people != null) {
            BinaryMessage messages = new BinaryMessage(b);
            for (WebSocketSession p : people) {
                if (p.isOpen() && !p.getId().equals(session.getId())) {
                    synchronized (p) {
                        p.sendMessage(messages);
                    }
                }
            }
        }
        // redis 별도 스레드
        executorService.submit(() -> {
            redisTemplate.opsForList().rightPush(redisKey, b);
        });
    }

            // B. 친구들에게 전송 (이것도 백그라운드에서 실행됨)
//            Set<WebSocketSession> people = roomAttendees.get(roomKey);
//            if (people != null) {
//                BinaryMessage broadcastMessage = new BinaryMessage(b); // 봉투 미리 준비
//
//                for (WebSocketSession p : people) {
//                    // 나 빼고, 살아있는 사람만
//                    if (p.isOpen() && !p.getId().equals(session.getId())) {
//
//                        // 동기화 블록 (순서 지키기)
//                        synchronized (p) {
//                            // 🔥 [핵심 수정 2] 락 잡은 뒤에 한 번 더 생존 확인! (더블 체크)
//                            // 줄 서는 동안 죽었을 수도 있으니까 확인해야 에러가 안 남
//                            if (!p.isOpen()) {
//                                continue; // 죽었으면 보내지 마!
//                            }
//                            try {
//                                p.sendMessage(broadcastMessage);
//                            } catch (Exception e) {
//                                // 전송 실패 시 로그만 찍고 넘어감 (시스템 중단 방지)
//                                log.warn("메시지 전송 실패 (User={}): {}", p.getId(), e.getMessage());
//                            }
//                        }
//                    }
//                }
//            }
//        });

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        String roomId = (String) session.getAttributes().get("roomId");
        String fileId = (String) session.getAttributes().get("fileId");
        String roomKey = roomId + ":" + fileId;

        Set<WebSocketSession> sessions = roomAttendees.get(roomKey);

        if(sessions != null) {
            sessions.remove(session);
            if(sessions.isEmpty()){
                roomAttendees.remove(roomKey);
            }
        }
        log.info("퇴장: Room={}, File={}", roomId, fileId);
    }
}