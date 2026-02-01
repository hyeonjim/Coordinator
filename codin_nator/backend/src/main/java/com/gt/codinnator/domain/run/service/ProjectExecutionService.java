package com.gt.codinnator.domain.run.service;

import com.gt.codinnator.domain.run.dto.ProjectUploadRequest;
import com.gt.codinnator.domain.run.dto.TestResultDto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.FileInputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

@Service
@RequiredArgsConstructor
public class ProjectExecutionService {

    private final GradleTestRunner gradleTestRunner;

    public String processAndTest(ProjectUploadRequest request) throws Exception {
        // 1. 작업용 유니크한 임시 디렉토리 생성 (UUID 활용)
        Path rootBase = Paths.get(System.getProperty("java.io.tmpdir"), "codinnator");
        Path workDir = rootBase.resolve(UUID.randomUUID().toString());
        Files.createDirectories(workDir);

        // 2. 받은 Zip 파일을 임시 폴더에 저장
        Path zipPath = workDir.resolve("project.zip");
        request.getProjectZip().transferTo(zipPath);

        // 3. 압축 해제
        unzip(zipPath, workDir);

        // 4. [변경] 프론트가 이미 Zip에 테스트를 넣었으므로 saveTestCode는 필요 없음!
        // 대신 실행할 테스트 클래스 이름을 프론트와 약속하거나 request에서 가져옵니다.
        String testClassName = "GeneratedTest"; // 프론트와 약속된 이름 혹은 request.getTestClassName()

        // 5. [활성화] Gradle 실행 로직 호출
        // 이전에 만든 GradleTestRunner를 호출하도록 연결합니다.
        TestResultDto result = gradleTestRunner.runTest(workDir, testClassName);

        // 결과를 사람이 읽기 좋은 문자열이나 JSON으로 반환
        return String.format("테스트 결과: %s, 메시지: %s",
                result.isSuccess() ? "성공" : "실패",
                result.getMessage());
    }

    private void unzip(Path zipFilePath, Path destDir) throws IOException {
        try (ZipInputStream zis = new ZipInputStream(new FileInputStream(zipFilePath.toFile()))) {
            ZipEntry entry;
            while ((entry = zis.getNextEntry()) != null) {
                Path newPath = destDir.resolve(entry.getName());
                if (entry.isDirectory()) {
                    Files.createDirectories(newPath);
                } else {
                    Files.createDirectories(newPath.getParent());
                    Files.copy(zis, newPath, StandardCopyOption.REPLACE_EXISTING);
                }
                zis.closeEntry();
            }
        }
    }

    private void saveTestCode(Path workDir, String packageName, String code) throws IOException {
        String path = "src/test/java/" + packageName.replace(".", "/");
        Path testDir = workDir.resolve(path);
        Files.createDirectories(testDir);
        Files.writeString(testDir.resolve("GeneratedTest.java"), code);
    }
}