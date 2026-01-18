package com.gt.codinnator.domain.textchat.controller;

import com.gt.codinnator.domain.textchat.dto.TextChatMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class TextChatController {

    private final SimpMessageSendingOperations messagingTemplate;
//    private final ChatService chatService; // DB 저장을 위한 서비스

    @MessageMapping("/chat/message") // 클라이언트가 /pub/chat/message로 보낼 때
    public void message(TextChatMessage message) {
        if (TextChatMessage.MessageType.ENTER.equals(message.getType())) {
            message.setMessage(message.getSender() + "님이 입장하셨습니다.");
        }

        // 1. 해당 방을 구독 중인 유저들에게 메시지 전송 (/sub/chat/room/{roomId})
        messagingTemplate.convertAndSend("/sub/chat/room/" + message.getRoomId(), message);

        // 2. DB에 메시지 저장 (TALK 타입일 때만)
        if (TextChatMessage.MessageType.TALK.equals(message.getType())) {
//            chatService.saveMessage(message);
        }
    }
}