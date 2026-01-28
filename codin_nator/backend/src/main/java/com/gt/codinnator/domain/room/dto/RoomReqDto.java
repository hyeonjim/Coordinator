package com.gt.codinnator.domain.room.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class RoomReqDto {
    private String name;     // 방 이름
    private Long userId;     // 방장 ID
    private Long fileId;     // 관련 파일 ID (보내주신 설계 반영)
    private String gitToken; // 깃 토큰
}