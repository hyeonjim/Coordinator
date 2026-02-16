/**
 * 랜덤 ID 생성 유틸리티 (idGenerator.ts)
 *
 * [역할]
 * - 클라이언트 측에서 고유한 임시 ID를 생성
 * - WebRTC 세션, 임시 파일 식별 등 서버 ID가 필요 없는 곳에서 사용
 *
 * [핵심 개념: Math.random()]
 * - 0 이상 1 미만의 난수(소수)를 생성 (예: 0.7281938...)
 * - 암호학적으로 안전하지 않으므로 보안 토큰 생성에는 부적합
 *   (보안이 필요하면 crypto.getRandomValues() 사용)
 *
 * [핵심 개념: toString(36)]
 * - 숫자를 36진법 문자열로 변환 (0-9 + a-z = 36글자)
 * - 예: (0.7281).toString(36) → "0.q5f..."
 * - .slice(2, 10)으로 "0." 부분을 제거하고 8글자만 추출
 *
 * [핵심 개념: 템플릿 리터럴]
 * - 백틱(`)으로 감싼 문자열에서 ${변수}로 값을 삽입
 * - 예: `user_q5f2k8m1` → prefix가 "user"이고 랜덤 부분이 "q5f2k8m1"
 *
 * [기본 매개변수 (Default Parameter)]
 * - prefix = "id": 인자를 전달하지 않으면 "id"가 기본값으로 사용됨
 * - generateId() → "id_q5f2k8m1"
 * - generateId("user") → "user_q5f2k8m1"
 */

/**
 * 접두사가 붙은 랜덤 ID를 생성
 *
 * @param prefix - ID 접두사 (기본값: "id")
 * @returns `${prefix}_${랜덤8글자}` 형식의 문자열 (예: "user_q5f2k8m1")
 */
export function generateId(prefix = "id"): string {
  // Math.random(): 난수 생성 (예: 0.728193847...)
  // .toString(36): 36진법 문자열로 변환 (예: "0.q5f2k8m1xb")
  // .slice(2, 10): 인덱스 2~9까지 8글자 추출 (예: "q5f2k8m1")
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}
