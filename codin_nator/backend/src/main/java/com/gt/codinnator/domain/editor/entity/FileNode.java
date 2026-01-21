package com.gt.codinnator.domain.editor.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@AllArgsConstructor
@NoArgsConstructor
@Table(name="file")
public class File {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column
    private Long fileId;

    @Column(nullable = false)
    private String fileName;

    @Column(nullable = false)
    private String filePath;

    @Column(nullable = false)
    private String type;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private File parentId;

    @OneToMany(mappedBy = "parentId", cascade = CascadeType.ALL)
    private List<File> childList = new ArrayList<>();

    @Column
    private Long roomId;

    @Builder
    public File(String fileName, String filePath, String type, File parentId, Long roomId){
        this.fileName = fileName;
        this.filePath = filePath;
        this.type = type;
        this.parentId = parentId;
        this.roomId = roomId;
    }
}
