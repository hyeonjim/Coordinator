package com.gt.codinnator.domain.room.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.DynamicInsert;
import java.time.LocalDateTime;

@Entity
@Table(name = "room")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@DynamicInsert // 필드 값이 null일 경우 테이블의 default 값이 적용되도록 설정
public class Room {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "room_id")
    private Long roomId;

    @Column(name = "title", length = 20)
    private String title;

    @Column(name = "room_url", length = 1000)
    private String roomUrl;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "git_token", nullable = false, columnDefinition = "TEXT")
    private String gitToken;

    @Column(name = "is_deleted", length = 1)
    private String isDeleted; // @DynamicInsert에 의해 DB의 'F' 기본값 적용

    @Column(name = "git_url", length = 1000)
    private String gitUrl;

    @Column(name = "branch", length = 100)
    private String branch;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "file_id")
    private Long fileId;

    @Builder
    public Room(String title, String roomUrl, String gitToken, String gitUrl, String branch, Long userId, Long fileId) {
        this.title = title;
        this.roomUrl = roomUrl;
        this.gitToken = gitToken;
        this.gitUrl = gitUrl;
        this.branch = branch;
        this.userId = userId;
        this.fileId = fileId;
    }
}