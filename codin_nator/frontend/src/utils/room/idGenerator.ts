/**
 * 랜덤 ID 생성 유틸리티 함수
 * @param prefix - ID 접두사 (기본값: "id")
 * @returns 생성된 랜덤 ID
 */
export function generateId(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}
