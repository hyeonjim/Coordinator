package com.gt.codinnator.domain.run.controller;

import com.gt.codinnator.domain.run.dto.ProjectUploadRequest;
import com.gt.codinnator.domain.run.service.ProjectExecutionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/room")
@RequiredArgsConstructor
public class WorkerController {

    private final ProjectExecutionService executionService;

    @PostMapping("/{roomId}/code-run")
    public ResponseEntity<String> executeProject(@ModelAttribute ProjectUploadRequest request) {
        try {
            // 프로젝트 실행 및 결과 반환
            String result = executionService.processAndTest(request);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("실행 중 오류 발생: " + e.getMessage());
        }
    }
}