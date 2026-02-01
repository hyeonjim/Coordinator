package com.gt.codinnator.domain.run.service;

import com.gt.codinnator.domain.run.dto.TestResultDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.w3c.dom.Document;
import org.w3c.dom.Node;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.concurrent.TimeUnit;

@Service
@Slf4j
public class GradleTestRunner {

    public TestResultDto runTest(Path projectPath, String testClassName) {
        try {
            // OS 확인
            boolean isWindows = System.getProperty("os.name").toLowerCase().startsWith("windows");

            // 1. 윈도우와 리눅스에 따른 명령어 분기
            ProcessBuilder pb;
            if (isWindows) {
                // 윈도우: cmd /c gradlew.bat test ...
                pb = new ProcessBuilder(
                        "cmd.exe", "/c", "gradlew.bat", "test", "--tests", testClassName
                );
            } else {
                // 리눅스/맥: ./gradlew test ...
                pb = new ProcessBuilder(
                        "./gradlew", "test", "--tests", testClassName
                );
            }

            pb.directory(projectPath.toFile()); // 작업 디렉토리를 프로젝트 폴더로 설정
            pb.redirectErrorStream(true); // 에러 로그를 표준 출력과 합침

            // 2. 실행 및 프로세스 종료 대기 (타임아웃 1분 설정)
            Process process = pb.start();
            boolean finished = process.waitFor(1, TimeUnit.MINUTES);

            if (!finished) {
                process.destroyForcibly();
                return new TestResultDto(false, "테스트 실행 시간 초과 (Timeout)");
            }

            // 3. 결과 XML 리포트 파싱
            // 보통 build/test-results/test/ 폴더 안에 생깁니다.
            Path reportPath = projectPath.resolve("build/test-results/test");
            return parseJUnitXml(reportPath);

        } catch (Exception e) {
            log.error("테스트 실행 실패", e);
            return new TestResultDto(false, "시스템 오류: " + e.getMessage());
        }
    }

    private TestResultDto parseJUnitXml(Path reportDirPath) {
        try {
            // 해당 폴더의 첫 번째 XML 파일 읽기
            File reportFile = Files.list(reportDirPath)
                    .filter(p -> p.toString().endsWith(".xml"))
                    .map(Path::toFile)
                    .findFirst()
                    .orElseThrow(() -> new IOException("리포트 파일을 찾을 수 없습니다."));

            // XML 파싱 (간단하게 요약본만 추출)
            DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
            DocumentBuilder builder = factory.newDocumentBuilder();
            Document doc = builder.parse(reportFile);

            Node testSuite = doc.getElementsByTagName("testsuite").item(0);
            int failures = Integer.parseInt(testSuite.getAttributes().getNamedItem("failures").getNodeValue());
            int errors = Integer.parseInt(testSuite.getAttributes().getNamedItem("errors").getNodeValue());

            boolean isSuccess = (failures == 0 && errors == 0);
            String message = isSuccess ? "모든 테스트 통과!" : "테스트 실패: " + failures + "건의 오류 발생";

            // 실패 상세 내용이 필요하면 <failure> 태그의 텍스트를 긁어오면 됩니다.
            return new TestResultDto(isSuccess, message);

        } catch (Exception e) {
            return new TestResultDto(false, "리포트 분석 중 오류: " + e.getMessage());
        }
    }
}