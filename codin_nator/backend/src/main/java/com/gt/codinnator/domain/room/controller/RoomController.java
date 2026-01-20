package com.gt.codinnator.domain.room.controller;

import com.gt.codinnator.domain.room.dto.RoomReqDto;
import com.gt.codinnator.domain.room.service.RoomService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/room")
public class RoomController {

    private final RoomService roomService;

    // 방 생성 API
    @PostMapping
    public ResponseEntity<Long> createRoom(@RequestBody RoomReqDto request) {
        Long roomId = roomService.createRoom(request);
        return ResponseEntity.ok(roomId);
    }
}