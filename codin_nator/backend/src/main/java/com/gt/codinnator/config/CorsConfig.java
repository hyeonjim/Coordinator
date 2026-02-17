// =========================================
// [파일 목적] Spring Boot CORS(Cross-Origin Resource Sharing) 설정
// - 브라우저에서 다른 출처(포트/도메인)의 API를 호출할 수 있도록 허용
// - 개발 환경에서 프론트엔드(5173)와 백엔드(8080/8081) 간 통신 활성화
// - OAuth2/JWT 인증 지원을 위한 credentials 허용
// =========================================

package com.gt.codinnator.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;


/**
 * CORS 정책 설정 클래스
 *
 * <p>목적:
 * - 웹 브라우저의 보안 정책(Same-Origin Policy)을 제어
 * - 프론트엔드 개발 서버에서 백엔드 API 호출을 허용
 * - OAuth2/JWT 인증을 위한 쿠키/토큰 전송 허용
 *
 * <p>작동 방식:
 * - Spring Boot가 시작될 때 이 설정을 자동으로 적용
 * - 모든 엔드포인트(/**)에 대해 CORS 허용 정책 적용
 *
 * <p>주의사항:
 * - 운영 환경 배포 시 allowedOrigins를 실제 프론트 도메인으로 변경 필수
 * - 보안상 와일드카드(*) 사용은 개발 환경에서만 권장
 */
@Configuration
public class CorsConfig {

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/**")
                        .allowedOrigins(
                            "http://localhost:5173",           // 로컬 개발 환경
                            "http://127.0.0.1:5173",
                            "https://dolefully-nativistic-claudia.ngrok-free.dev"  // ngrok 프론트엔드
                        )
                        .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                        .allowedHeaders("*")
                        .allowCredentials(true)
                        .maxAge(3600);
            }
        };
    }
}


// =========================================
// [변경 내역]
// 
// ✅ 2025-01-31: OAuth2/JWT 인증 지원을 위한 설정 추가
//    - allowCredentials(true) 활성화
//    - maxAge(3600) 추가
//    - 배포 환경 주소 추가
//    - PATCH 메서드 추가
// 
// =========================================


// =========================================
// [추가 개선 제안 TODO]
// 
// 1. 환경별 설정 분리
//    - application-dev.yml: 개발 환경 CORS 설정
//    - application-prod.yml: 운영 환경 CORS 설정
//    - @Value 어노테이션으로 동적 주입
// 
// 예시:
// @Value("${cors.allowed-origins}")
// private String[] allowedOrigins;
// 
// .allowedOrigins(allowedOrigins)
// 
// 2. 보안 강화
//    - allowedOrigins를 환경변수에서 읽어오기
//    - 운영 환경에서는 특정 도메인만 허용
//    - allowCredentials(true) 사용 시 allowedOrigins에 "*" 금지
//      (현재는 구체적인 도메인만 지정하므로 안전함)
// 
// 3. 로깅 추가
//    - CORS 요청 실패 시 디버깅 정보 기록
//    - 허용되지 않은 Origin 접근 시도 모니터링
//    - Spring Security와 함께 사용 시 CORS 필터 순서 확인
// 
// =========================================
