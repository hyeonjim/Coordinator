// src/utils/contributionStore.ts

export type ErrorLog = {
  id: string;
  time: string; // "HH:mm"
  display_name: string;
  error: string;
  stacktrace: string;
  resolution: string;
};

export type StoredLog = ErrorLog & { date: string }; // "YYYY-MM-DD"

export type ContributionData = Record<
  string,
  { count: number; logs: ErrorLog[] }
>;

const KEY = "codinnator_contrib_logs_v1";

/**
 * ✅ 같은 탭에서도 즉시 그래프 갱신되게 하는 커스텀 이벤트
 * - MyPageTab에서 이 이벤트를 listen하면 저장 즉시 리렌더됨
 */
export const CONTRIB_UPDATED_EVENT = "codinnator:contribution-updated" as const;

function nowDateStr(d = new Date()) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function nowTimeStr(d = new Date()) {
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function readAll(): StoredLog[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as StoredLog[]) : [];
  } catch {
    return [];
  }
}

function writeAll(list: StoredLog[]) {
  localStorage.setItem(KEY, JSON.stringify(list));

  // ✅ 같은 탭에서도 즉시 반영되도록 이벤트 발생
  window.dispatchEvent(new CustomEvent(CONTRIB_UPDATED_EVENT));
}

/**
 * ✅ 로그 추가
 * - Room에서 "AI 분석 결과"를 여기로 넣으면 잔디에 찍힘
 */
export function appendContributionLog(input: {
  display_name: string;
  error: string;
  resolution: string;
  stacktrace?: string;
  date?: string;
  time?: string;
}) {
  const list = readAll();

  const log: StoredLog = {
    id: crypto.randomUUID(),
    date: input.date ?? nowDateStr(),
    time: input.time ?? nowTimeStr(),
    display_name: input.display_name,
    error: input.error,
    resolution: input.resolution,
    stacktrace: input.stacktrace ?? "",
  };

  list.push(log);
  writeAll(list);
  // ✅ 추가: 같은 탭에서도 즉시 갱신되게 이벤트 발사
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("codinnator:contribution-updated"));
  }
}

/**
 * ✅ 전체 데이터를 잔디 그래프용 구조로 변환
 * - key: "YYYY-MM-DD"
 * - value: { count, logs[] }
 */
export function getContributionDataAllYears(): ContributionData {
  const list = readAll();

  const map: ContributionData = {};
  for (const item of list) {
    if (!map[item.date]) map[item.date] = { count: 0, logs: [] };
    map[item.date].logs.push(item);
  }

  // count 및 정렬
  Object.keys(map).forEach((date) => {
    map[date].logs.sort((a, b) => b.time.localeCompare(a.time));
    map[date].count = map[date].logs.length;
  });

  return map;
}

/* =======================
 * ✅ (추가) 디버깅/관리 유틸
 * ======================= */

/** 원본 로그 리스트 그대로 가져오기 */
export function getAllContributionLogs(): StoredLog[] {
  return readAll();
}

/** 특정 id 로그 삭제 */
export function removeContributionLog(id: string) {
  const list = readAll();
  const next = list.filter((x) => x.id !== id);
  writeAll(next);
}

/** 전체 로그 초기화 */
export function clearContributionLogs() {
  writeAll([]);
}
