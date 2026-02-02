package com.gt.codinnator.domain.ai.controller;

import com.gt.codinnator.domain.ai.service.TestCodeGenerationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/room")
@RequiredArgsConstructor
public class AiFileController {

    private final TestCodeGenerationService testCodeGenerationService;

    // ===================== [테스트 코드 생성 - 신규 API] =====================
    @PostMapping(
            value = "/generate-testcode",
            consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<GenerateTestCodeResponse> generateTestCode(
            @RequestBody GenerateTestCodeRequest request
    ) {
        try {
            System.out.println("[AiFileController] generateTestCode 요청");
            System.out.println("  - roomId: " + request.roomId());
            System.out.println("  - fileName: " + request.fileName());
            System.out.println("  - code 길이: " + 
                    (request.code() == null ? "null" : request.code().length() + " chars"));
            
            String generatedTestCode = testCodeGenerationService.generateTestCode(
                    request.fileName(),
                    request.code()
            );
            
            GenerateTestCodeResponse response = new GenerateTestCodeResponse(
                    request.roomId(),
                    request.fileName(),
                    generatedTestCode
            );
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            e.printStackTrace();
            GenerateTestCodeResponse errorResponse = new GenerateTestCodeResponse(
                    request.roomId(),
                    request.fileName(),
                    "ERROR: " + e.getMessage()
            );
            
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(errorResponse);
        }
    }

    // ===================== [AI 분석 결과 저장 - 신규 추가!] =====================
    @PostMapping(
        value = "/analyze-result",
        consumes = MediaType.APPLICATION_JSON_VALUE,
        produces = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<TestReportResponse> analyzeResult(
        @RequestBody AnalyzeResultRequest request
    ) {
        try {
            System.out.println("[AiFileController] analyzeResult 요청");
            System.out.println("  - roomId: " + request.roomId());
            System.out.println("  - output 길이: " + 
                    (request.output() == null ? "null" : request.output().length() + " chars"));

            // 1. AI 서버에 분석 요청
            TestCodeGenerationService.AiReport aiReport = 
                testCodeGenerationService.generateReport(request.output());

            // 2. 백엔드에서 추가 정보 생성
            Long reportId = System.currentTimeMillis(); // 임시 ID
            String timestamp = java.time.Instant.now().toString();

            // 3. 응답 DTO 생성 (AI 결과 + 백엔드 데이터 결합)
            TestReportResponse response = new TestReportResponse(
                reportId,
                request.roomId(),
                timestamp,
                request.output(),           // stacktrace
                aiReport.display_name(),
                aiReport.error(),
                aiReport.resolution()
            );

            System.out.println("[AiFileController] AI 분석 완료: " + aiReport.display_name());

            // 4. 프론트에 반환
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.err.println("[analyze-result] 에러: " + e.getMessage());
            e.printStackTrace();

            return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(null);
        }
    }

    // ===================== [레거시 API] =====================
    @PostMapping(
            value = "/files/{fileId}/generate-test",
            consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.TEXT_PLAIN_VALUE
    )
    public ResponseEntity<String> generateTest(
            @PathVariable Long fileId,
            @RequestBody GenerateTestBody body
    ) {
        try {
            String generatedTestCode = testCodeGenerationService.generateTest(
                    fileId,
                    body.code()
            );
            
            return ResponseEntity.ok(generatedTestCode);
            
        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("테스트 코드 생성 실패: " + e.getMessage());
        }
    }

    // ===================== [DTOs] =====================
    
    public record GenerateTestCodeRequest(
            Long roomId,
            String fileName,
            String code
    ) {}
    
    public record GenerateTestCodeResponse(
            Long roomId,
            String fileName,
            String testCode
    ) {}
    
    public record GenerateTestBody(String code) {}

    public record AnalyzeResultRequest(
        Long roomId,
        String output
    ) {}

    public record TestReportResponse(
        Long id,
        Long roomId,
        String timestamp,
        String stacktrace,
        String display_name,
        String error,
        String resolution
    ) {}
}