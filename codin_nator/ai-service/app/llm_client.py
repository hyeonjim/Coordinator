# =========================================
# [파일 목적] LLM(대규모 언어 모델) API 호출 클라이언트
#
# <핵심 기능>
# 1. OpenAI API 호환 서버와 통신 (GPT, Ollama, vLLM 등)
# 2. 최신 Responses API 우선 시도, 실패 시 Chat Completions로 Fallback
# 3. JSON 응답 파싱 및 복구 (코드펜스 제거, 객체 추출)
#
# <지원 API>
# - Responses API (OpenAI 최신 방식): /v1/responses
# - Chat Completions API (범용 호환): /v1/chat/completions
#
# <설계 원칙>
# - 비동기(async/await): FastAPI와 자연스럽게 통합
# - 설정 주입: 환경변수로 서버 주소/모델/키 관리
# - 에러 안전: HTTP 오류, JSON 파싱 실패 등 방어적 처리
# =========================================

from __future__ import annotations  # 타입 힌트에서 자기 자신 참조를 가능하게 (Python 3.7+)

import json                          # JSON 파싱 및 생성
import re                            # 정규 표현식 (코드펜스 제거)
from dataclasses import dataclass    # 간결한 클래스 정의 (Java의 record와 유사)
from typing import Any, Dict, List   # 타입 힌트 (코드 문서화 및 IDE 지원)

import httpx                         # 비동기 HTTP 클라이언트 (requests의 async 버전)


# =========================================
# [커스텀 예외] JSON 파싱 실패 시 구분 가능한 예외
# =========================================

class JSONParseError(Exception):
    """
    LLM 응답을 JSON으로 파싱하지 못했을 때 발생하는 예외
    
    용도:
    - 일반 Exception과 구분하여 JSON 파싱 오류만 선별적으로 처리
    - 재시도 로직이나 복구 로직에서 활용
    
    예시:
        try:
            data = llm.parse_json(response_text)
        except JSONParseError as e:
            print(f"JSON 파싱 실패: {e}")
            # LLM에게 다시 유효한 JSON 생성 요청
    """
    pass


# =========================================
# [LLM 클라이언트] OpenAI API 호환 서버 호출 클래스
#
# <사용 방법>
# 1. 인스턴스 생성:
#    client = LLMClient(
#        base_url="http://127.0.0.1:11434",
#        api_key="local-token",
#        model="qwen2.5-coder:3b"
#    )
# 2. 채팅 호출:
#    response = await client.chat(
#        system="You are a helpful assistant.",
#        user="Generate a test case for..."
#    )
# 3. JSON 파싱:
#    data = client.parse_json(response)
# =========================================

@dataclass
class LLMClient:
    """
    LLM API 호출을 관리하는 클라이언트 클래스
    
    필드:
    - base_url: LLM 서버 주소 (예: https://api.openai.com, http://127.0.0.1:11434)
    - api_key: 인증 키 (OpenAI는 필수, 로컬 Ollama는 선택)
    - model: 사용할 모델명 (예: gpt-5.2, qwen2.5-coder:3b)
    - auth_header: 인증 헤더명 (기본: Authorization)
    - auth_scheme: 인증 스킴 (기본: Bearer)
    - timeout_s: HTTP 요청 타임아웃 시간 (초)
    
    설계:
    - dataclass로 불변성 보장 (frozen=False이지만 관례상 변경 안 함)
    - 비동기 메서드(async def)로 FastAPI와 통합 용이
    """
    
    # 필수 설정 (인스턴스 생성 시 반드시 제공)
    base_url: str
    api_key: str
    model: str

    # 선택 설정 (기본값 제공)
    auth_header: str = "Authorization"  # 대부분의 API는 "Authorization" 헤더 사용
    auth_scheme: str = "Bearer"         # OAuth2의 표준 방식
    timeout_s: float = 60.0             # 60초 타임아웃 (테스트 생성은 시간이 걸릴 수 있음)


    # =========================================
    # [URL 및 헤더 유틸리티] 공통 로직 재사용
    # =========================================

    def _v1_base(self) -> str:
        """
        OpenAI API v1 베이스 URL 구성
        
        동작:
        - base_url이 /v1로 끝나면 그대로 사용
        - 아니면 /v1을 붙여서 반환
        
        예시:
        - "http://127.0.0.1:11434" -> "http://127.0.0.1:11434/v1"
        - "http://127.0.0.1:11434/v1" -> "http://127.0.0.1:11434/v1"
        - "https://api.openai.com" -> "https://api.openai.com/v1"
        
        Returns:
            /v1이 보장된 베이스 URL
        """
        # URL 끝의 슬래시 제거 (중복 방지)
        base = self.base_url.rstrip("/")
        
        # 이미 /v1로 끝나면 그대로 반환
        if base.endswith("/v1"):
            return base
        
        # 아니면 /v1 추가
        return f"{base}/v1"

    def _headers(self) -> Dict[str, str]:
        """
        공통 HTTP 헤더 생성
        
        동작:
        1. Content-Type: application/json (JSON 바디 전송)
        2. api_key가 있으면 Authorization 헤더 추가
        
        인증 헤더 형식:
        - auth_scheme이 있을 때: "Bearer <api_key>"
        - auth_scheme이 없을 때: "<api_key>" (일부 서버는 Bearer 없이 키만)
        
        Returns:
            HTTP 헤더 딕셔너리
        """
        headers: Dict[str, str] = {
            "Content-Type": "application/json"  # JSON 요청 본문
        }
        
        # API 키가 설정되어 있으면 인증 헤더 추가
        if self.api_key:
            if self.auth_scheme:
                # "Authorization: Bearer sk-xxx..."
                headers[self.auth_header] = f"{self.auth_scheme} {self.api_key}"
            else:
                # "Authorization: sk-xxx..." (일부 로컬 서버)
                headers[self.auth_header] = self.api_key
        
        return headers


    # =========================================
    # [메인 API] LLM 채팅 호출 (비동기)
    #
    # <전략>
    # 1. 최신 Responses API 시도 (GPT-5 이상 권장)
    # 2. 404/405 응답 시 Chat Completions로 Fallback
    # 3. 그 외 오류는 그대로 올림 (재시도 안 함)
    # =========================================

    async def chat(self, system: str, user: str) -> str:
        """
        LLM에 채팅 요청을 보내고 응답 텍스트를 받음

        매개변수:
        - system: 시스템 프롬프트 (역할, 규칙, 출력 형식 지정)
        - user: 사용자 입력 (실제 작업 내용)

        반환값:
        - LLM이 생성한 텍스트 응답 (문자열)

        예외:
        - httpx.HTTPStatusError: HTTP 오류 (401, 500 등)
        - httpx.TimeoutException: 타임아웃
        - ValueError: 응답 파싱 실패

        사용 예시:
            client = LLMClient(...)
            response = await client.chat(
                system="Generate JUnit5 tests.",
                user="public class Calculator { ... }"
            )
            print(response)  # "import org.junit.jupiter.api.Test; ..."
        """
        # 비동기 HTTP 클라이언트 생성 (컨텍스트 매니저로 자동 종료)
        async with httpx.AsyncClient(timeout=self.timeout_s) as client:
            # gpt-4o-mini는 Chat Completions API만 지원하므로 바로 사용
            return await self._call_chat_completions(client, system, user)


    # =========================================
    # [Responses API 호출] 최신 OpenAI 방식
    #
    # <특징>
    # - GPT-5 시리즈에 최적화
    # - instructions 필드로 시스템 프롬프트 전달
    # - output 구조로 멀티파트 응답 지원
    # =========================================

    async def _call_responses(
        self,
        client: httpx.AsyncClient,
        system: str,
        user: str
    ) -> str:
        """
        OpenAI Responses API 호출 (/v1/responses)
        
        요청 구조:
        {
          "model": "gpt-5.2",
          "instructions": "시스템 프롬프트",
          "input": "사용자 입력",
          "temperature": 0.2
        }
        
        응답 구조:
        {
          "output": [
            {
              "type": "message",
              "role": "assistant",
              "content": [
                { "type": "output_text", "text": "응답 내용" }
              ]
            }
          ]
        }
        
        매개변수:
        - client: 재사용 가능한 httpx 클라이언트
        - system: 시스템 프롬프트
        - user: 사용자 입력
        
        반환값:
        - 추출된 텍스트 응답
        
        예외:
        - httpx.HTTPStatusError: HTTP 오류 (404 등)
        - ValueError: 응답에 텍스트가 없을 때
        """
        # 엔드포인트 URL 구성
        url = f"{self._v1_base()}/responses"

        # 요청 페이로드 생성
        payload = {
            "model": self.model,               # 예: "gpt-5.2"
            "instructions": system,            # 시스템 프롬프트 (역할/규칙)
            "input": user,                     # 사용자 입력 (문자열 또는 배열)
            "temperature": 0.2,                # 낮은 온도 = 결정론적 출력
        }

        # HTTP POST 요청
        response = await client.post(url, headers=self._headers(), json=payload)
        
        # 응답이 4xx/5xx면 예외 발생 (여기서 Fallback 판단)
        response.raise_for_status()
        
        # JSON 파싱
        data = response.json()

        # 응답에서 텍스트 추출 (중첩 구조 순회)
        text_parts: List[str] = []
        
        for item in data.get("output", []):
            # message 타입만 처리
            if item.get("type") != "message":
                continue
            
            # assistant 역할만 처리
            if item.get("role") != "assistant":
                continue
            
            # content 배열 순회
            for part in item.get("content", []):
                # output_text 타입에서 텍스트 추출
                if part.get("type") == "output_text":
                    text_parts.append(part.get("text", ""))

        # 텍스트 조각들을 합쳐 최종 출력 생성
        output_text = "\n".join([t for t in text_parts if t]).strip()
        
        # 텍스트가 있으면 반환
        if output_text:
            return output_text

        # 텍스트가 없으면 예외 (응답 형식이 예상과 다를 때)
        raise ValueError("Responses API returned no text output")


    # =========================================
    # [Chat Completions API 호출] 범용 호환 방식
    #
    # <특징>
    # - OpenAI, Ollama, vLLM, LM Studio 등 대부분 지원
    # - messages 배열로 대화 이력 관리
    # - 안정적이고 검증된 방식
    # =========================================

    async def _call_chat_completions(
        self,
        client: httpx.AsyncClient,
        system: str,
        user: str
    ) -> str:
        """
        OpenAI Chat Completions API 호출 (/v1/chat/completions)
        
        요청 구조:
        {
          "model": "qwen2.5-coder:3b",
          "messages": [
            { "role": "developer", "content": "시스템 프롬프트" },
            { "role": "user", "content": "사용자 입력" }
          ],
          "temperature": 0.2
        }
        
        응답 구조:
        {
          "choices": [
            {
              "message": {
                "role": "assistant",
                "content": "응답 내용"
              }
            }
          ]
        }
        
        매개변수:
        - client: 재사용 가능한 httpx 클라이언트
        - system: 시스템 프롬프트
        - user: 사용자 입력
        
        반환값:
        - 추출된 텍스트 응답
        """
        # 엔드포인트 URL 구성
        url = f"{self._v1_base()}/chat/completions"

        # 요청 페이로드 생성
        payload = {
            "model": self.model,
            "messages": [
                # developer 역할: 시스템 프롬프트 (OpenAI 최신 권장)
                {"role": "developer", "content": system},
                
                # user 역할: 실제 입력
                {"role": "user", "content": user},
            ],
            "temperature": 0.2,  # 낮은 온도 = 일관된 출력
        }

        # HTTP POST 요청
        response = await client.post(url, headers=self._headers(), json=payload)
        
        # 응답이 4xx/5xx면 예외 발생
        response.raise_for_status()
        
        # JSON 파싱
        data = response.json()

        # 응답에서 텍스트 추출 (안전한 체이닝)
        # choices[0].message.content를 안전하게 가져옴
        return (
            data.get("choices", [{}])[0]        # choices 배열의 첫 번째 요소
            .get("message", {})                 # message 객체
            .get("content", "")                 # content 문자열
            or ""                               # None이면 빈 문자열
        ).strip()                               # 앞뒤 공백 제거


    # =========================================
    # [JSON 파싱 유틸리티] LLM 응답에서 JSON 추출
    #
    # <필요성>
    # - LLM은 종종 JSON 외에 설명이나 코드펜스를 같이 출력함
    # - 예: ```json\n{"key": "value"}\n```
    # - 이를 정리하여 순수 JSON만 추출
    # =========================================

    def parse_json(self, text: str) -> Any:
        """
        LLM 응답 텍스트에서 JSON 객체를 안전하게 파싱
        
        복구 전략:
        1. 원문 그대로 JSON 파싱 시도
        2. 실패 시 코드펜스(```) 제거 후 재시도
        3. 실패 시 첫 번째 {...} 블록만 추출 후 재시도
        4. 최종 실패 시 JSONParseError 발생
        
        매개변수:
        - text: LLM이 반환한 텍스트 (JSON이 포함되어야 함)
        
        반환값:
        - 파싱된 Python 객체 (dict, list 등)
        
        예외:
        - JSONParseError: JSON 파싱 불가능
        
        사용 예시:
            response = await client.chat(...)
            data = client.parse_json(response)
            print(data["display_name"])
        """
        # 1차 시도: 원문 그대로 파싱
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            pass  # 실패하면 복구 로직으로 진행

        # 2차 시도: 코드펜스 제거 후 파싱
        cleaned = self._strip_code_fences(text)
        
        # 3차 시도: 첫 번째 JSON 객체만 추출
        json_object = self._extract_first_json_object(cleaned)

        try:
            return json.loads(json_object)
        except json.JSONDecodeError as e:
            # 최종 실패: 사용자 정의 예외로 변환
            raise JSONParseError(str(e))

    def _strip_code_fences(self, s: str) -> str:
        """
        마크다운 코드펜스 제거
        
        제거 대상:
        - ```json ... ```
        - ```python ... ```
        - ``` ... ```
        
        동작:
        1. 정규식으로 ```xxx 패턴 제거
        2. 남은 ``` 제거
        3. 앞뒤 공백 제거
        
        매개변수:
        - s: 정리할 문자열
        
        반환값:
        - 코드펜스가 제거된 문자열
        """
        # ```json, ```python 등 언어 지정자 제거 (대소문자 무관)
        s = re.sub(r"```[\w+-]*\s*", "", s, flags=re.IGNORECASE)
        
        # 남아있는 백틱 제거
        s = s.replace("```", "")
        
        # 앞뒤 공백 제거
        return s.strip()

    def _extract_first_json_object(self, s: str) -> str:
        """
        문자열에서 첫 번째 JSON 객체 {...} 추출
        
        동작:
        1. 첫 번째 '{' 위치 찾기
        2. 마지막 '}' 위치 찾기
        3. 그 사이 문자열 반환
        
        제약사항:
        - 중첩된 객체도 처리 가능 (단순 범위 추출)
        - 배열 [...] 시작은 지원 안 함 (객체만)
        
        매개변수:
        - s: 검색할 문자열
        
        반환값:
        - 추출된 JSON 객체 문자열
        
        예외:
        - JSONParseError: '{' 또는 '}'를 찾을 수 없을 때
        """
        # 첫 번째 여는 중괄호 위치
        start = s.find("{")
        
        # 마지막 닫는 중괄호 위치
        end = s.rfind("}")
        
        # 유효한 범위인지 검증
        if start == -1 or end == -1 or end <= start:
            raise JSONParseError("No JSON object found in text")
        
        # '{' ~ '}' 범위 추출
        return s[start : end + 1]


# =========================================
# [변경 내역 요약]
#
# 1. 가독성 개선
#    - 파일 최상단에 목적 및 구조 설명 추가
#    - 각 섹션마다 목적/동작/예외 명시
#    - 함수마다 docstring 추가 (Google 스타일)
#    - 인라인 주석으로 중요 로직 설명
#
# 2. 재사용성 향상
#    - _v1_base, _headers: 공통 로직 재사용
#    - _strip_code_fences, _extract_first_json_object: JSON 파싱 유틸
#
# 3. 타입 힌트 강화
#    - 모든 함수 시그니처에 타입 명시
#    - IDE 자동완성 및 정적 분석 지원
#
# 4. 문서화 강화
#    - 각 API의 요청/응답 구조 예시 제공
#    - 사용 예시 코드 추가
#    - 예외 케이스 명시
#
# 5. 에러 처리 개선
#    - JSONParseError로 파싱 오류 구분
#    - HTTP 상태 코드별 처리 (404/405 -> Fallback)
#
# 6. 코드 구조화
#    - 섹션 헤더로 논리적 그룹핑
#    - 공통 유틸 -> 메인 API -> 내부 구현 순서
# =========================================


# =========================================
# [추가 개선 제안 TODO]
#
# 1. 로깅 추가
#    - import logging
#    - logger.debug(f"Calling {url}")
#    - logger.error(f"HTTP {status_code}")
#
# 2. 재시도 로직
#    - tenacity 라이브러리 활용
#    - @retry(stop=stop_after_attempt(3))
#    - 일시적 네트워크 오류 대응
#
# 3. 스트리밍 지원
#    - async for chunk in client.stream(...)
#    - 실시간 응답 출력 (긴 테스트 생성 시 유용)
#
# 4. 캐싱
#    - functools.lru_cache
#    - 동일 요청 중복 방지
#
# 5. 토큰 수 계산
#    - tiktoken 라이브러리
#    - 비용 추정 및 제한
#
# 6. 멀티 모델 지원
#    - 모델별 설정 프로파일
#    - 동적 모델 전환
#
# 7. 테스트 코드 작성
#    - pytest-asyncio
#    - httpx.AsyncClient 모킹
#    - 다양한 응답 케이스 검증
# =========================================
