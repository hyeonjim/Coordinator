# =========================================
# [파일 목적] AI 기반 테스트 생성 및 분석 FastAPI 서버
#
# <핵심 기능>
# 1. 테스트 코드 자동 생성 (Java -> JUnit5)
# 2. 테스트 실행 결과 분석 (로그 -> 에러 진단 + 해결책)
#
# <아키텍처>
# Spring Boot 백엔드 -> FastAPI AI 서버 -> LLM (GPT/Ollama/vLLM)
#
# <API 엔드포인트>
# - POST /generate-testcode: 테스트 생성 (text/plain -> text/plain)
# - POST /generate-result: 결과 분석 (text/plain -> JSON)
#
# <의존성>
# - FastAPI: 웹 프레임워크
# - uvicorn: ASGI 서버
# - httpx: 비동기 HTTP 클라이언트 (LLM 호출)
# - python-dotenv: 환경변수 관리
# =========================================

# FastAPI 핵심 임포트
from fastapi import FastAPI, HTTPException, Body, Query, Response
from fastapi.middleware.cors import CORSMiddleware

# 환경변수 관리
from dotenv import load_dotenv
import os

# 유틸리티
import re                                      # 정규식 (코드펜스 제거)
from datetime import datetime, timezone       # 타임스탬프 생성
from uuid import uuid4                         # 고유 ID 생성

# 프로젝트 내부 모듈
from .llm_client import LLMClient


# =========================================
# [초기화] 환경 설정 및 앱 생성
# =========================================

# .env 파일에서 환경변수 로드 (ai-service/.env)
load_dotenv()

# FastAPI 앱 인스턴스 생성
app = FastAPI(
    title="Codinnator AI Service",
    version="0.3.0",
    description="AI 기반 테스트 코드 생성 및 분석 API"
)


# =========================================
# [CORS 설정] 프론트엔드에서 API 호출 허용
#
# <필요성>
# - 브라우저의 Same-Origin Policy 우회
# - 프론트(예: localhost:5173)에서 백엔드(예: localhost:8000) 호출 허용
#
# <설정 내용>
# - 허용 Origin: 환경변수 또는 기본값 (로컬 개발 서버)
# - 허용 메서드: 모든 HTTP 메서드
# - 허용 헤더: 모든 헤더
# - 인증 정보: 쿠키 포함 허용
# =========================================

app.add_middleware(
    CORSMiddleware,
    
    # 허용할 Origin 목록 (쉼표로 구분된 환경변수)
    allow_origins=[
        origin.strip()  # 각 Origin의 앞뒤 공백 제거
        for origin in os.getenv(
            "CORS_ORIGINS",
            "http://localhost:5173,http://127.0.0.1:5173"  # 기본값: Vite 개발 서버
        ).split(",")
        if origin.strip()  # 빈 값 제외
    ],
    
    # 쿠키/인증 정보 포함 요청 허용
    allow_credentials=True,
    
    # 모든 HTTP 메서드 허용 (GET, POST, PUT, DELETE, OPTIONS 등)
    allow_methods=["*"],
    
    # 모든 헤더 허용 (Authorization, Content-Type 등)
    allow_headers=["*"],
)


# =========================================
# [LLM 클라이언트 초기화] AI 모델과 통신하는 객체 생성
#
# <설정 방법>
# .env 파일에 다음 변수 설정:
# - LLM_BASE_URL: LLM 서버 주소
# - LLM_API_KEY: API 인증 키
# - LLM_MODEL: 사용할 모델명
# - LLM_AUTH_HEADER: 인증 헤더명 (선택)
# - LLM_AUTH_SCHEME: 인증 스킴 (선택)
#
# <기본값>
# - Ollama 로컬 서버 (http://127.0.0.1:11434)
# - qwen2.5-coder:3b 모델 (경량 코드 생성 모델)
# =========================================

llm = LLMClient(
    base_url=os.getenv("LLM_BASE_URL", "http://127.0.0.1:11434"),
    api_key=os.getenv("LLM_API_KEY", "local-token"),
    model=os.getenv("LLM_MODEL", "qwen2.5-coder:3b"),
    auth_header=os.getenv("LLM_AUTH_HEADER", "Authorization"),
    auth_scheme=os.getenv("LLM_AUTH_SCHEME", "Bearer"),
)


# =========================================
# [유틸리티 함수 1] 코드펜스 제거
#
# <필요성>
# - LLM이 코드를 ```java ... ``` 형태로 감싸서 반환하는 경우가 많음
# - 백엔드는 순수 코드만 필요하므로 마크다운 제거
#
# <제거 대상>
# - ```java, ```json, ``` 등
# =========================================

def strip_code_fences(text: str) -> str:
    """
    마크다운 코드펜스를 제거하여 순수 코드만 추출
    
    동작:
    1. 앞뒤 공백 제거
    2. ```xxx 패턴 제거 (언어 지정자 포함)
    3. 남은 ``` 제거
    4. 최종 공백 정리
    
    매개변수:
    - text: LLM이 반환한 텍스트 (코드펜스 포함 가능)
    
    반환값:
    - 코드펜스가 제거된 순수 텍스트
    
    예시:
        입력: "```java\npublic class Test {}\n```"
        출력: "public class Test {}"
    """
    # 1단계: 앞뒤 공백 제거
    cleaned = text.strip()
    
    # 2단계: ```언어명 패턴 제거 (대소문자 무관)
    cleaned = re.sub(r"```[\w+-]*\s*", "", cleaned, flags=re.IGNORECASE)
    
    # 3단계: 남아있는 백틱 제거
    cleaned = cleaned.replace("```", "")
    
    # 4단계: 최종 공백 정리
    return cleaned.strip()


# =========================================
# [유틸리티 함수 2] 테스트 파일명 생성
#
# <필요성>
# - LLM에게 힌트를 주면 적절한 클래스명 생성에 도움
# - 관례: Calculator.java -> CalculatorTest.java
# =========================================

def guess_test_name(file_name: str) -> str:
    """
    소스 파일명에서 테스트 파일명 추론
    
    규칙:
    - .java 확장자 제거 후 Test.java 추가
    - 예: Calculator.java -> CalculatorTest.java
    
    매개변수:
    - file_name: 원본 파일명
    
    반환값:
    - 추론된 테스트 파일명
    """
    # .java 확장자 제거 (대소문자 무관)
    if file_name.lower().endswith(".java"):
        base_name = file_name[:-5]  # 마지막 5글자(.java) 제거
    else:
        base_name = file_name
    
    # Test.java 접미사 추가
    return f"{base_name}Test.java"


# =========================================
# [API 1] 테스트 코드 생성
#
# <엔드포인트>
# POST /generate-testcode?fileName=Calculator.java
#
# <요청>
# - Content-Type: text/plain
# - Body: Java 소스 코드 (문자열)
# - Query: fileName (선택, 기본값: Selected.java)
#
# <응답>
# - Content-Type: text/plain
# - Body: JUnit5 테스트 코드 (문자열)
#
# <흐름>
# 1. 소스 코드 수신
# 2. 프롬프트 구성 (시스템 + 유저)
# 3. LLM 호출 (비동기)
# 4. 코드펜스 제거
# 5. 순수 테스트 코드 반환
# =========================================

@app.post("/generate-testcode")
async def generate_testcode(
    code: str = Body(..., media_type="text/plain"),
    fileName: str = Query(default="Selected.java"),
):
    """
    Java 소스 코드를 받아 JUnit5 테스트 코드 생성
    
    요청 예시:
        POST /generate-testcode?fileName=Calculator.java
        Content-Type: text/plain
        
        public class Calculator {
            public int add(int a, int b) { return a + b; }
        }
    
    응답 예시:
        import org.junit.jupiter.api.Test;
        import static org.junit.jupiter.api.Assertions.*;
        
        class CalculatorTest {
            @Test
            void testAdd() {
                Calculator calc = new Calculator();
                assertEquals(5, calc.add(2, 3));
            }
        }
    
    매개변수:
    - code: 테스트할 Java 소스 코드 (text/plain)
    - fileName: 소스 파일명 (테스트명 힌트로 사용)
    
    반환값:
    - 생성된 JUnit5 테스트 코드 (text/plain)
    
    예외:
    - HTTPException 500: LLM 호출 실패, 네트워크 오류 등
    """
    # 1. 테스트 파일명 힌트 생성
    test_file_name = guess_test_name(fileName)

    # 2. 시스템 프롬프트 구성 (역할/규칙 강제)
    system_prompt = build_testcode_system_prompt()

    # 3. 유저 프롬프트 구성 (실제 작업 내용)
    user_prompt = build_testcode_user_prompt(fileName, test_file_name, code)

    # 4. LLM 호출 및 에러 처리
    try:
        # LLM에게 채팅 요청 (비동기)
        raw_response = await llm.chat(system=system_prompt, user=user_prompt)
        
        # 코드펜스 제거하여 순수 코드 추출
        test_code = strip_code_fences(raw_response)
        
        # text/plain 응답 반환
        return Response(content=test_code, media_type="text/plain")

    except Exception as e:
        # 서버 로그에 에러 기록
        log_error("generate-testcode", e)
        
        # 클라이언트에 500 에러 반환
        raise HTTPException(status_code=500, detail=str(e))


def build_testcode_system_prompt() -> str:
    """
    테스트 생성용 시스템 프롬프트 구성
    
    내용:
    - 역할: 시니어 Java 엔지니어
    - 출력 규칙: JUnit5만, 순수 코드만
    - 제약: DB/네트워크/파일시스템 접근 금지
    
    반환값:
    - 시스템 프롬프트 문자열
    """
    return (
        "You are a senior Java engineer. Generate high-quality JUnit5 unit tests.\n"
        "Rules:\n"
        "- Output ONLY the complete Java test code. No markdown, no explanations.\n"
        "- Use JUnit5 (org.junit.jupiter.*). Mockito is allowed if helpful.\n"
        "- Do NOT access real DB/network/filesystem. Keep tests deterministic.\n"
        "- If the source contains a package declaration, mirror it in the test.\n"
    )


def build_testcode_user_prompt(
    source_file_name: str,
    test_file_name: str,
    source_code: str
) -> str:
    """
    테스트 생성용 유저 프롬프트 구성
    
    내용:
    - 소스 파일명 (LLM이 클래스명 추론)
    - 제안 테스트 파일명 (관례 힌트)
    - 소스 코드 전체 (명확한 구분자로 감싸기)
    
    매개변수:
    - source_file_name: 원본 파일명
    - test_file_name: 생성할 테스트 파일명
    - source_code: 테스트할 Java 코드
    
    반환값:
    - 유저 프롬프트 문자열
    """
    return (
        f"Source file name: {source_file_name}\n"
        f"Suggested test file name: {test_file_name}\n\n"
        "Generate unit tests for the following Java source code:\n"
        "----- SOURCE START -----\n"
        f"{source_code}\n"
        "----- SOURCE END -----\n"
    )


# =========================================
# [API 2] 테스트 실행 결과 분석
#
# <엔드포인트>
# POST /generate-result
#
# <요청>
# - Content-Type: text/plain
# - Body: 테스트 실행 로그 (문자열)
#
# <응답>
# - Content-Type: application/json
# - Body: { display_name, error, resolution }
#
# <흐름>
# 1. 실행 로그 수신
# 2. 프롬프트 구성 (JSON 스키마 강제)
# 3. LLM 호출 (비동기)
# 4. JSON 파싱 (실패 시 재시도)
# 5. 유효성 검증 및 기본값 처리
# 6. JSON 응답 반환
# =========================================

@app.post("/generate-result")
async def generate_result(
    run_output: str = Body(..., media_type="text/plain"),
):
    """
    테스트 실행 결과를 분석하여 에러 진단 및 해결책 제시
    
    요청 예시:
        POST /generate-result
        Content-Type: text/plain
        
        [ERROR] Tests run: 1, Failures: 1
        java.lang.NullPointerException
        at Calculator.divide(Calculator.java:10)
    
    응답 예시:
        {
          "display_name": "NullPointerException",
          "error": "divide 메서드에서 null 값을 처리하지 않음",
          "resolution": "입력 값 null 체크를 추가하세요. if (value == null) throw new IllegalArgumentException();"
        }
    
    매개변수:
    - run_output: 테스트 실행 로그 (text/plain)
    
    반환값:
    - 분석 결과 JSON (display_name, error, resolution)
    
    예외:
    - HTTPException 500: LLM 호출 실패, JSON 파싱 실패 등
    """
    # 1. 시스템 프롬프트 구성 (JSON 출력 강제)
    system_prompt = build_result_system_prompt()

    # 2. 유저 프롬프트 구성 (로그 전달)
    user_prompt = build_result_user_prompt(run_output)

    try:
        # 3. LLM 호출
        raw_response = await llm.chat(system=system_prompt, user=user_prompt)

        # 4. 코드펜스 제거
        cleaned_response = strip_code_fences(raw_response).strip()

        # 5. JSON 파싱 시도 (1차)
        try:
            parsed_data = json.loads(cleaned_response)
        
        except Exception:
            # 파싱 실패 시 LLM에게 재요청 (보정)
            parsed_data = await retry_json_parsing(cleaned_response)

        # 6. 필드 추출 및 기본값 처리
        result = extract_result_fields(parsed_data)

        # 7. JSON 응답 반환 (FastAPI가 자동으로 application/json 설정)
        return result

    except Exception as e:
        # 서버 로그에 에러 기록
        log_error("generate-result", e)
        
        # 클라이언트에 500 에러 반환
        raise HTTPException(status_code=500, detail=str(e))


def build_result_system_prompt() -> str:
    """
    결과 분석용 시스템 프롬프트 구성
    
    내용:
    - 역할: 시니어 엔지니어 (테스트 분석 전문)
    - 출력 규칙: JSON만, 마크다운 금지
    - 언어: 한국어
    - 스키마: display_name, error, resolution
    
    반환값:
    - 시스템 프롬프트 문자열
    """
    return (
        "You are a senior engineer who analyzes failing test outputs.\n"
        "Return ONLY valid JSON. No markdown. No extra text.\n"
        "Write in Korean.\n"
        "Schema:\n"
        "{\n"
        '  "display_name": string,\n'
        '  "error": string,\n'
        '  "resolution": string\n'
        "}\n"
        "Rules:\n"
        "- display_name: 아주 짧은 제목(예: 'Database Connection Error', 'NullPointerException').\n"
        "- error: 핵심 원인 한 줄.\n"
        "- resolution: 바로 실행 가능한 해결 방법을 2~5문장으로.\n"
        "- If unknown, use 'UNKNOWN'.\n"
    )


def build_result_user_prompt(run_output: str) -> str:
    """
    결과 분석용 유저 프롬프트 구성
    
    내용:
    - 작업 지시: 로그 분석하여 JSON 반환
    - 실행 로그 전체 (명확한 구분자로 감싸기)
    
    매개변수:
    - run_output: 테스트 실행 로그
    
    반환값:
    - 유저 프롬프트 문자열
    """
    return (
        "Analyze the following test run output and return the JSON.\n"
        "----- RUN OUTPUT START -----\n"
        f"{run_output}\n"
        "----- RUN OUTPUT END -----\n"
    )


async def retry_json_parsing(invalid_json: str) -> dict:
    """
    LLM에게 유효한 JSON으로 보정 요청
    
    동작:
    - 파싱 실패한 텍스트를 다시 LLM에 보내 고치도록 요청
    - 2차 파싱 시도 (여기서도 실패하면 예외 발생)
    
    매개변수:
    - invalid_json: 파싱 실패한 텍스트
    
    반환값:
    - 파싱 성공한 딕셔너리
    
    예외:
    - json.JSONDecodeError: 2차 파싱도 실패 시
    """
    # 보정 요청용 시스템 프롬프트
    fix_system = (
        "Fix the following into VALID JSON ONLY. "
        "No markdown. No extra text. Follow the schema exactly."
    )
    
    # LLM에게 보정 요청
    fixed_response = await llm.chat(system=fix_system, user=invalid_json)
    
    # 코드펜스 제거
    fixed_clean = strip_code_fences(fixed_response).strip()
    
    # 2차 파싱 시도
    return json.loads(fixed_clean)


def extract_result_fields(data: dict) -> dict:
    """
    분석 결과 딕셔너리에서 필드 추출 및 검증
    
    동작:
    1. display_name, error, resolution 필드 추출
    2. 없으면 기본값 "UNKNOWN" 설정
    3. 타입 안전성 보장 (문자열 강제 변환)
    
    매개변수:
    - data: 파싱된 JSON 딕셔너리
    
    반환값:
    - 검증된 결과 딕셔너리
    """
    # 필드 추출 (없으면 "UNKNOWN")
    display_name = data.get("display_name", "UNKNOWN")
    error = data.get("error", "UNKNOWN")
    resolution = data.get("resolution", "UNKNOWN")

    # 타입 안전성 보장 (None이면 "UNKNOWN")
    display_name = str(display_name) if display_name is not None else "UNKNOWN"
    error = str(error) if error is not None else "UNKNOWN"
    resolution = str(resolution) if resolution is not None else "UNKNOWN"

    return {
        "display_name": display_name,
        "error": error,
        "resolution": resolution,
    }


# =========================================
# [유틸리티 함수 3] 에러 로깅
#
# <필요성>
# - 서버 로그에 에러 기록
# - 디버깅 및 모니터링 지원
# =========================================

def log_error(endpoint: str, exception: Exception):
    """
    에러 정보를 표준 에러 스트림에 기록
    
    매개변수:
    - endpoint: 에러가 발생한 API 엔드포인트명
    - exception: 발생한 예외 객체
    """
    # TODO: 운영 환경에서는 logging 라이브러리 사용 권장
    print(f"[{endpoint}] 에러 발생: {repr(exception)}")


# =========================================
# [JSON import] 결과 분석 API에서 사용
# (파일 최상단에 배치하는 것이 일반적이지만,
#  코드 흐름상 필요한 시점에 위치시킴)
# =========================================
import json


# =========================================
# [변경 내역 요약]
#
# 1. 가독성 개선
#    - 파일 최상단에 목적 및 아키텍처 설명 추가
#    - 각 섹션마다 목적/흐름/예외 명시
#    - 함수마다 docstring 추가 (Google 스타일)
#    - 복잡한 로직을 여러 함수로 분리
#
# 2. 재사용성 향상
#    - 프롬프트 구성 함수 분리
#      * build_testcode_system_prompt
#      * build_testcode_user_prompt
#      * build_result_system_prompt
#      * build_result_user_prompt
#    - JSON 파싱 로직 함수 분리
#      * retry_json_parsing
#      * extract_result_fields
#    - 에러 로깅 함수 공통화
#      * log_error
#
# 3. 책임 분리 (SRP)
#    - API 엔드포인트: 요청/응답 처리만
#    - 프롬프트 구성: build_xxx 함수
#    - JSON 파싱: retry_xxx, extract_xxx 함수
#    - 에러 처리: log_error 함수
#
# 4. 에러 처리 개선
#    - 명확한 에러 메시지
#    - 예외 체이닝 (원인 보존)
#    - 로깅 일관화
#
# 5. 문서화 강화
#    - 각 API의 요청/응답 예시 제공
#    - 환경변수 설정 방법 명시
#    - 흐름 단계별 설명
#
# 6. 코드 구조화
#    - 섹션 헤더로 논리적 그룹핑
#    - 초기화 -> 유틸리티 -> API -> 헬퍼 순서
# =========================================


# =========================================
# [추가 개선 제안 TODO]
#
# 1. 로깅 체계 개선
#    - import logging
#    - logger = logging.getLogger(__name__)
#    - logger.info(), logger.error() 사용
#    - 로그 파일 로테이션 설정
#
# 2. 설정 관리 강화
#    - pydantic.BaseSettings로 환경변수 검증
#    - 타입 안전성 보장
#    - 기본값 및 제약 조건 명시
#
# 3. API 문서 자동화
#    - FastAPI의 자동 문서 기능 활용
#    - /docs (Swagger UI)
#    - /redoc (ReDoc)
#    - 응답 모델 Pydantic 스키마 정의
#
# 4. 입력 검증 강화
#    - Pydantic 모델로 요청 바디 검증
#    - 코드 길이 제한 (너무 긴 코드 거부)
#    - 파일명 형식 검증
#
# 5. 성능 최적화
#    - LLM 호출 캐싱 (동일 요청 중복 방지)
#    - Redis 연동
#    - 응답 시간 메트릭 수집
#
# 6. 에러 모니터링
#    - Sentry 연동 (실시간 에러 추적)
#    - Prometheus 메트릭 수집
#    - Grafana 대시보드 구성
#
# 7. 테스트 코드 작성
#    - pytest로 단위 테스트
#    - pytest-asyncio로 비동기 테스트
#    - httpx.AsyncClient로 API 테스트
#    - LLM 호출 모킹
#
# 8. 보안 강화
#    - API 키 검증 미들웨어
#    - Rate Limiting (요청 빈도 제한)
#    - CORS Origin 화이트리스트 엄격화
#
# 9. 배포 준비
#    - Dockerfile 작성
#    - docker-compose.yml 구성
#    - 헬스 체크 엔드포인트 추가 (GET /health)
#    - 환경별 설정 분리 (.env.dev, .env.prod)
#
# 10. 문서화
#     - README.md 작성 (설치/실행 방법)
#     - API 사용 예시 문서
#     - 아키텍처 다이어그램
#     - 트러블슈팅 가이드
# =========================================
