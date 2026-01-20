package com.gt.codinnator.domain.room.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
public class RoomEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long roomId;

    private String title;
    private String roomUrl;
    private LocalDateTime createdAt;
    private String gitToken;
    private String isDeleted;
    private String gitUrl;
    private String branch;

    // MSA를 위해 ID값만 저장
    private Long userId; // 또는 ownerId (Service 코드와 이름을 맞춰야 함)
    private Long fileId;
}