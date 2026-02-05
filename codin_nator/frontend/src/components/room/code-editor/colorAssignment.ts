/**
 * 사용자 색상 할당 유틸
 * - 6가지 구분 가능한 색상을 고정 팔레트로 사용합니다.
 * - 사용자 ID를 해시하여 일관된 색상을 반환합니다.
 */
const CHART_COLORS = [
  "#7c3aed",
  "#16a34a",
  "#f97316",
  "#f59e0b",
  "#db2777",
  "#2563eb",
];

export function getUserColor(userId: string): string {
  let hash = 5381;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash << 5) + hash + userId.charCodeAt(i);
    hash = hash >>> 0;
  }
  const index = hash % CHART_COLORS.length;
  return CHART_COLORS[index];
}

export default getUserColor;
