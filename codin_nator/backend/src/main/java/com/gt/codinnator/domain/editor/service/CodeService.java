// java
package com.gt.codinnator.domain.editor.service;

import com.gt.codinnator.domain.editor.dto.FileRequestDto;
import com.gt.codinnator.domain.editor.entity.FileNode;
import com.gt.codinnator.domain.editor.repository.FileRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.io.BufferedWriter;
import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class CodeService {
    private final FileRepository fileRepository;

    // 하드디스크에 변경 파일 저장
    public void saveChangeFiles(Long roomId, Map<String, String> changedFiles) throws IOException {
        for (Map.Entry<String, String> m : changedFiles.entrySet()) {
            Long fileId = Long.parseLong(m.getKey());
            String content = m.getValue();

            // DB에서 파일 정보 조회
            FileNode fileNode = fileRepository.findById(fileId)
                    .orElseThrow(() -> new IllegalArgumentException("파일을 찾을 수 없습니다: " + fileId));

            if (!fileNode.getRoomId().equals(roomId)) {
                throw new IllegalArgumentException("잘못된 방 접근: " + roomId);
            }

            Path filePath = Paths.get(fileNode.getFilePath());
            Files.writeString(filePath, content, StandardCharsets.UTF_8);
        }
    }
    public void newFile(Long roomId, FileRequestDto requestDto) throws IOException {
        FileNode parent = null;
        if (requestDto.getParentId() != null) {
            parent = fileRepository.findById(requestDto.getParentId())
                    .orElseThrow(() -> new IllegalArgumentException(
                            "부모 폴더를 찾을 수 없습니다: " + requestDto.getParentId()));

            // 부모가 실제로 폴더(DIR)인지 확인
            if (!"DIR".equals(parent.getType())) {
                throw new IllegalArgumentException(
                        "파일(FILE) 안에는 자식을 추가할 수 없습니다");
            }
        }

        String newFilePath;
        if (parent != null) {
            // 부모가 있으면: /부모경로/새파일명
            newFilePath = parent.getFilePath() + File.separator + requestDto.getFileName();
        } else {
            // 부모가 없으면(루트): /codinnator/uploads/{roomId}/새파일명
            String basePath = System.getProperty("user.home")
                    + File.separator + "codinnator"
                    + File.separator + "uploads"
                    + File.separator + roomId;
            newFilePath = basePath + File.separator + requestDto.getFileName();
        }

        Path newPath = Paths.get(newFilePath);

        if ("DIR".equals(requestDto.getType())) {
            // 폴더 생성
            Files.createDirectories(newPath);
        } else {
            // 파일 생성
            Files.createDirectories(newPath.getParent());  // 부모 디렉토리 먼저 생성
            Files.createFile(newPath);

            // 초기 내용 저장
            if (requestDto.getContent() != null && !requestDto.getContent().isEmpty()) {
                Files.writeString(newPath, requestDto.getContent(), StandardCharsets.UTF_8);
            }
        }

        FileNode newNode = FileNode.builder()
                .fileName(requestDto.getFileName())
                .filePath(newFilePath)
                .type(requestDto.getType())
                .roomId(roomId)
                .parentId(parent)
                .build();

        FileNode saved = fileRepository.save(newNode);
    }

    public void deleteFile(Long roomId, Long fileId) throws IOException {
        FileNode fileNode = fileRepository.findById(fileId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "파일을 찾을 수 없습니다: " + fileId));

        if (!fileNode.getRoomId().equals(roomId)) {
            throw new IllegalArgumentException(
                    "잘못된 방 접근: " + roomId);
        }

        Path path = Paths.get(fileNode.getFilePath());

        if ("DIR".equals(fileNode.getType())) {
            // 폴더이면: 재귀적으로 내부 모든 파일/폴더 삭제
            deleteDirectory(path.toFile());
        } else {
            // 파일이면: 파일만 삭제
            Files.deleteIfExists(path);
        }

        fileRepository.delete(fileNode);
    }

    private void deleteDirectory(File dir) {
        if (dir.isDirectory()) {
            File[] files = dir.listFiles();
            if (files != null) {
                // 재귀 호출로 자식들부터 삭제
                for (File file : files) {
                    deleteDirectory(file);
                }
            }
        }
        // 최종적으로 자신 삭제
        dir.delete();
    }
}
