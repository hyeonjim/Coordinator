package com.gt.codinnator.domain.room.service;

import com.gt.codinnator.domain.room.dto.RoomReqDto;
import com.gt.codinnator.domain.room.entity.ParticipantEntity;
import com.gt.codinnator.domain.room.entity.RoomEntity;
import com.gt.codinnator.domain.room.repository.ParticipantRepository;
import com.gt.codinnator.domain.room.repository.RoomRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class RoomService {

    private final RoomRepository roomRepository;
    private final ParticipantRepository participantRepository;

    @Transactional
    public Long createRoom(RoomReqDto request) {
        // 1. Room 엔티티 생성 및 저장
        RoomEntity room = RoomEntity.builder()
                .title(request.getName())
                .userId(request.getUserId()) // 방장 ID 저장
                .fileId(request.getFileId())
                .gitToken(request.getGitToken())
                .roomUrl(UUID.randomUUID().toString()) // 고유한 방 주소 생성
                .createdAt(LocalDateTime.now())
                .isDeleted("F")
                .build();

        RoomEntity savedRoom = roomRepository.save(room);

        // 2. 방장을 Participant(참여자) 테이블에 등록
        ParticipantEntity participant = ParticipantEntity.builder()
                .roomId(savedRoom.getRoomId())
                .userId(request.getUserId())
                .build();

        participantRepository.save(participant);

        return savedRoom.getRoomId();
    }
}