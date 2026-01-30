package com.gt.codinnator.domain.editor.service;

import com.gt.codinnator.domain.editor.dto.FileResponseDto;
import com.gt.codinnator.domain.editor.entity.FileNode;
import com.gt.codinnator.domain.editor.repository.FileRepository;
import org.springframework.stereotype.Service;


import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.charset.Charset;
import java.nio.charset.MalformedInputException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.stream.Collectors;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

@Service
@RequiredArgsConstructor
public class FileService {
    private final FileRepository fileRepository;
    // 변경가능성 있음
    private final String BASE_DIR = System.getProperty("user.home") + "/codinnator/uploads/";

    // 파일 전체 조회
    public List<FileResponseDto> getFileTree(Long roomId) {
        List<FileNode> rootNodes = fileRepository.findAllByRoomIdAndParentIdIsNull(roomId);

        // Entity -> DTO 변환
        return rootNodes.stream()
                .map(FileResponseDto::from)
                .collect(Collectors.toList());
    }

    // 파일 상세 조회
    public String getFileContent(Long roomId, Long fileId) throws IOException {

        FileNode node = fileRepository.findById(fileId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 파일입니다."));

        if(!node.getRoomId().equals(roomId)) {
            throw new IllegalArgumentException("존재하지 않는 방");
        }
        Path path = Paths.get(node.getFilePath());

        try {
            // 1. 국룰 UTF-8 시도
            return Files.readString(path, StandardCharsets.UTF_8);
        } catch (MalformedInputException e1) {
            try {
                // 2. 실패시 한국 윈도우 국룰 MS949 시도 (EUC-KR보다 더 많은 한글 지원)
                return Files.readString(path, Charset.forName("MS949"));
            } catch (MalformedInputException e2) {
                // 3. 정 안되면 깨지더라도 읽기는 한다 (ISO-8859-1)
                return Files.readString(path, StandardCharsets.ISO_8859_1);
            }
        }
    }

//    @Transactional
//    public void uploadProject(List<MultipartFile> zipFile, Long roomId) throws IOException {
//        String savePath = BASE_DIR + roomId;
//        File rootDir = new File(savePath);
//        if (!rootDir.exists()) rootDir.mkdirs();
//
//        unzipFile(zipFile, rootDir);
//
//        File[] files = rootDir.listFiles();
//        if (files != null) {
//            for (File file : files) {
//                // 루트 폴더는 parent가 null
//                saveDirectory(file, null, roomId);
//            }
//        }
//    }
@Transactional
public void uploadProject(List<MultipartFile> files, Long roomId) throws IOException {
    Path root = Paths.get(BASE_DIR, String.valueOf(roomId));
    Files.createDirectories(root);

    for (MultipartFile mf : files) {
        if (mf.isEmpty()) continue;

        String original = mf.getOriginalFilename();
        if (original == null || original.isBlank()) continue;

        // 1. 경로 표준화
        String rel = original.replace("\\", "/");

        // [선택 사항] 만약 "MyProject" 폴더 껍데기 없이 내용물만 쫙 풀고 싶다면?
        // (보통 IDE는 껍데기 폴더가 있는 걸 선호하므로, 지금처럼 주석 처리해두는 게 맞습니다)
        // rel = rel.contains("/") ? rel.substring(rel.indexOf('/') + 1) : rel;

        // 2. 보안: 상위 경로 탈출 차단 (필수)
        Path target = root.resolve(rel).normalize();
        if (!target.startsWith(root)) {
            throw new IOException("Security Error: Invalid path " + rel);
        }

        // 3. 필터링 로직 수정
        String name = target.getFileName().toString();

        // [수정] .git은 물리적으로 저장해야 서버에서 Git 기능을 쓸 수 있습니다!
        // 여기서 막으면 안 됩니다. (주석 처리 혹은 삭제)
        // if (rel.startsWith(".git/") || rel.contains("/.git/")) continue;

        // 불필요한 바이너리/설정 파일은 저장 안 함
        if (name.endsWith(".class")) continue;
        if (rel.startsWith(".idea/") || rel.contains("/.idea/")) continue;
        if (rel.startsWith("build/") || rel.contains("/build/")) continue;
        if (rel.startsWith("out/") || rel.contains("/out/")) continue;
        if (rel.startsWith(".gradle/") || rel.contains("/.gradle/")) continue;
        // Mac 사용자가 올릴 경우 생기는 쓰레기 파일 차단
        if (name.equals(".DS_Store") || rel.contains("__MACOSX")) continue;

        // 4. 물리적 저장
        Files.createDirectories(target.getParent());
        mf.transferTo(target.toFile());
    }

    // 5. DB 동기화
    // (여기서 호출되는 saveDirectory 메서드 내부에서 .git 폴더를 DB에 안 넣게 필터링하면 됩니다)
    File rootDir = root.toFile();
    File[] top = rootDir.listFiles();
    if (top != null) {
        // 기존 DB 데이터가 꼬이지 않게 해당 방의 파일 정보를 리셋하거나, 중복 체크 로직 필요
        // fileRepository.deleteByRoomId(roomId); // 필요시 초기화
        for (File f : top) {
            saveDirectory(f, null, roomId);
        }
    }
}


    private void saveDirectory(File currentFile, FileNode parentNode, Long roomId) {
        // [추가된 필터링 로직]
        // 1. 숨김 파일(.git 등) 무시
        if (currentFile.isHidden()) return;

        // 2. 컴파일된 바이너리 파일(.class) 무시 -> 이거 때문에 외계어가 뜬 겁니다!
        if (currentFile.getName().endsWith(".class")) return;

        // 3. 빌드 결과물 폴더(bin, build, out, .gradle) 통째로 무시 (선택사항이지만 강력 추천)
        if (currentFile.isDirectory()) {
            String name = currentFile.getName();
            if (name.equals("bin") || name.equals("build") || name.equals("out") || name.equals(".gradle") || name.equals(".idea")) {
                return;
            }
        }

        FileNode myNode = FileNode.builder()
                .fileName(currentFile.getName())
                .filePath(currentFile.getAbsolutePath())
                .type(currentFile.isDirectory() ? "DIR" : "FILE")
                .roomId(roomId)
                .parentId(parentNode)
                .build();
         // delete(roomId)
        fileRepository.save(myNode); //insert


        if (currentFile.isDirectory()) {
            File[] children = currentFile.listFiles();
            if (children != null) {
                for (File child : children) {
                    saveDirectory(child, myNode, roomId);
                }
            }
        }
    }

    // [유틸] 압축 해제 로직
    private void unzipFile(MultipartFile zipFile, File destDir) throws IOException {
        byte[] buffer = new byte[1024];

        try (ZipInputStream zis = new ZipInputStream(zipFile.getInputStream(), Charset.forName("MS949"))) {
            ZipEntry zipEntry = zis.getNextEntry();
            while (zipEntry != null) {
                File newFile = new File(destDir, zipEntry.getName());

                // [보안 추가] 압축 파일 내 '..' 경로를 이용한 해킹 방지 (Zip Slip 취약점 해결)
//                if (!newFile.getCanonicalPath().startsWith(destDir.getCanonicalPath() + File.separator)) {
//                    throw new IOException("Zip Entry is outside of the target dir: " + zipEntry.getName());
//                }
                if (zipEntry.isDirectory()) {
                    newFile.mkdirs();
                } else {
                    new File(newFile.getParent()).mkdirs();
                    try (FileOutputStream fos = new FileOutputStream(newFile)) {
                        int len;
                        while ((len = zis.read(buffer)) > 0) {
                            fos.write(buffer, 0, len);
                        }
                    }
                }
                zipEntry = zis.getNextEntry();
            }
        }
    }
}