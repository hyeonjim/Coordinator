package com.gt.codinnator.domain.editor.dto;

import com.gt.codinnator.domain.editor.entity.FileNode;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.stream.Collectors;

@Getter
@NoArgsConstructor
public class FileResponseDto {
    private Long fileId;
    private String name;
    private String type; // FILE 또는 DIR
    private List<FileResponseDto> children; // ★ 핵심: 자식도 DTO 리스트여야 함

    public static FileResponseDto from(FileNode entity) {
        FileResponseDto dto = new FileResponseDto();
        dto.fileId = entity.getFileId();
        dto.name = entity.getFileName(); // Entity의 필드명(fileName)
        dto.type = entity.getType();

        dto.children = entity.getChildList().stream()
                .map(FileResponseDto::from)
                .collect(Collectors.toList());

        return dto;
    }
}