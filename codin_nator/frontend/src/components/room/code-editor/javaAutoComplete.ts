/**
 * Java 자동완성 데이터 및 유틸리티
 * - 키워드, 내장 클래스, 메서드 등을 정의
 * - 입력에 따라 매칭되는 항목을 필터링
 */

// ===========================
// Java 자동완성 항목 타입
// ===========================
export interface AutoCompleteItem {
  label: string;      // 표시될 텍스트 (예: "public")
  type: "keyword" | "class" | "method" | "snippet";  // 종류
  detail?: string;    // 추가 설명 (예: "접근 제어자")
  insertText?: string; // 실제 삽입될 텍스트 (없으면 label 사용)
}

// ===========================
// Java 키워드 목록
// ===========================
const JAVA_KEYWORDS: AutoCompleteItem[] = [
  // 접근 제어자
  { label: "public", type: "keyword", detail: "접근 제어자" },
  { label: "private", type: "keyword", detail: "접근 제어자" },
  { label: "protected", type: "keyword", detail: "접근 제어자" },

  // 클래스/인터페이스 관련
  { label: "class", type: "keyword", detail: "클래스 선언" },
  { label: "interface", type: "keyword", detail: "인터페이스 선언" },
  { label: "extends", type: "keyword", detail: "상속" },
  { label: "implements", type: "keyword", detail: "인터페이스 구현" },
  { label: "abstract", type: "keyword", detail: "추상 클래스/메서드" },

  // 제어문
  { label: "if", type: "keyword", detail: "조건문" },
  { label: "else", type: "keyword", detail: "조건문" },
  { label: "for", type: "keyword", detail: "반복문" },
  { label: "while", type: "keyword", detail: "반복문" },
  { label: "do", type: "keyword", detail: "반복문" },
  { label: "switch", type: "keyword", detail: "스위치문" },
  { label: "case", type: "keyword", detail: "스위치 케이스" },
  { label: "default", type: "keyword", detail: "기본값" },
  { label: "break", type: "keyword", detail: "반복 중단" },
  { label: "continue", type: "keyword", detail: "다음 반복으로" },
  { label: "return", type: "keyword", detail: "반환" },

  // 예외 처리
  { label: "try", type: "keyword", detail: "예외 처리" },
  { label: "catch", type: "keyword", detail: "예외 처리" },
  { label: "finally", type: "keyword", detail: "예외 처리" },
  { label: "throw", type: "keyword", detail: "예외 던지기" },
  { label: "throws", type: "keyword", detail: "예외 선언" },

  // 기타 키워드
  { label: "new", type: "keyword", detail: "객체 생성" },
  { label: "this", type: "keyword", detail: "현재 객체 참조" },
  { label: "super", type: "keyword", detail: "부모 클래스 참조" },
  { label: "static", type: "keyword", detail: "정적 멤버" },
  { label: "final", type: "keyword", detail: "상수/불변" },
  { label: "void", type: "keyword", detail: "반환값 없음" },
  { label: "null", type: "keyword", detail: "널 값" },
  { label: "true", type: "keyword", detail: "불리언 참" },
  { label: "false", type: "keyword", detail: "불리언 거짓" },
  { label: "import", type: "keyword", detail: "패키지 가져오기" },
  { label: "package", type: "keyword", detail: "패키지 선언" },
  { label: "instanceof", type: "keyword", detail: "타입 검사" },
];

// ===========================
// Java 기본 타입
// ===========================
const JAVA_TYPES: AutoCompleteItem[] = [
  { label: "int", type: "keyword", detail: "정수형 (32bit)" },
  { label: "long", type: "keyword", detail: "정수형 (64bit)" },
  { label: "short", type: "keyword", detail: "정수형 (16bit)" },
  { label: "byte", type: "keyword", detail: "정수형 (8bit)" },
  { label: "float", type: "keyword", detail: "실수형 (32bit)" },
  { label: "double", type: "keyword", detail: "실수형 (64bit)" },
  { label: "boolean", type: "keyword", detail: "불리언" },
  { label: "char", type: "keyword", detail: "문자형" },
];

// ===========================
// Java 내장 클래스
// ===========================
const JAVA_CLASSES: AutoCompleteItem[] = [
  // 기본 래퍼 클래스
  { label: "String", type: "class", detail: "문자열 클래스" },
  { label: "Integer", type: "class", detail: "int 래퍼 클래스" },
  { label: "Long", type: "class", detail: "long 래퍼 클래스" },
  { label: "Double", type: "class", detail: "double 래퍼 클래스" },
  { label: "Boolean", type: "class", detail: "boolean 래퍼 클래스" },
  { label: "Character", type: "class", detail: "char 래퍼 클래스" },
  { label: "Object", type: "class", detail: "모든 클래스의 부모" },

  // 컬렉션
  { label: "ArrayList", type: "class", detail: "동적 배열" },
  { label: "LinkedList", type: "class", detail: "연결 리스트" },
  { label: "HashMap", type: "class", detail: "해시맵" },
  { label: "HashSet", type: "class", detail: "해시셋" },
  { label: "TreeMap", type: "class", detail: "정렬된 맵" },
  { label: "TreeSet", type: "class", detail: "정렬된 셋" },
  { label: "List", type: "class", detail: "리스트 인터페이스" },
  { label: "Map", type: "class", detail: "맵 인터페이스" },
  { label: "Set", type: "class", detail: "셋 인터페이스" },

  // 입출력
  { label: "Scanner", type: "class", detail: "입력 클래스" },
  { label: "BufferedReader", type: "class", detail: "버퍼 입력" },
  { label: "BufferedWriter", type: "class", detail: "버퍼 출력" },
  { label: "FileReader", type: "class", detail: "파일 읽기" },
  { label: "FileWriter", type: "class", detail: "파일 쓰기" },

  // 유틸리티
  { label: "Arrays", type: "class", detail: "배열 유틸리티" },
  { label: "Collections", type: "class", detail: "컬렉션 유틸리티" },
  { label: "Math", type: "class", detail: "수학 유틸리티" },
  { label: "System", type: "class", detail: "시스템 클래스" },

  // 예외
  { label: "Exception", type: "class", detail: "예외 클래스" },
  { label: "RuntimeException", type: "class", detail: "런타임 예외" },
  { label: "NullPointerException", type: "class", detail: "널 포인터 예외" },
  { label: "IOException", type: "class", detail: "입출력 예외" },
];

// ===========================
// 자주 사용하는 메서드/스니펫
// ===========================
const JAVA_METHODS: AutoCompleteItem[] = [
  // 출력
  { label: "println", type: "method", detail: "줄바꿈 출력", insertText: "System.out.println();" },
  { label: "print", type: "method", detail: "출력", insertText: "System.out.print();" },
  { label: "printf", type: "method", detail: "포맷 출력", insertText: "System.out.printf();" },

  // main 메서드
  { label: "main", type: "snippet", detail: "메인 메서드", insertText: "public static void main(String[] args) {\n    \n}" },
  { label: "psvm", type: "snippet", detail: "메인 메서드 (단축)", insertText: "public static void main(String[] args) {\n    \n}" },

  // 자주 쓰는 메서드
  { label: "toString", type: "method", detail: "문자열 변환" },
  { label: "equals", type: "method", detail: "동등 비교" },
  { label: "hashCode", type: "method", detail: "해시코드" },
  { label: "length", type: "method", detail: "길이" },
  { label: "size", type: "method", detail: "크기" },
  { label: "get", type: "method", detail: "값 가져오기" },
  { label: "set", type: "method", detail: "값 설정" },
  { label: "add", type: "method", detail: "추가" },
  { label: "remove", type: "method", detail: "제거" },
  { label: "contains", type: "method", detail: "포함 여부" },
  { label: "isEmpty", type: "method", detail: "비어있는지 확인" },
];

// ===========================
// 전체 자동완성 항목
// ===========================
export const ALL_ITEMS: AutoCompleteItem[] = [
  ...JAVA_KEYWORDS,
  ...JAVA_TYPES,
  ...JAVA_CLASSES,
  ...JAVA_METHODS,
];

// ===========================
// 자동완성 필터링 함수
// ===========================
/**
 * 입력된 접두사로 시작하는 항목들을 필터링
 * @param prefix - 사용자가 입력한 문자열 (예: "pr")
 * @param maxResults - 최대 결과 개수 (기본 10개)
 * @returns 매칭되는 자동완성 항목 배열
 *
 * 예시:
 * - "p" → public, private, protected, print, println, ...
 * - "pr" → private, protected, print, println, printf, ...
 * - "pri" → private, print, println, printf
 */
export function filterAutoComplete(
  prefix: string,
  maxResults: number = 10
): AutoCompleteItem[] {
  // 빈 문자열이면 빈 배열 반환
  if (!prefix || prefix.length === 0) {
    return [];
  }

  // 소문자로 변환해서 비교 (대소문자 무시)
  const lowerPrefix = prefix.toLowerCase();

  // 접두사로 시작하는 항목 필터링
  const matches = ALL_ITEMS.filter((item) =>
    item.label.toLowerCase().startsWith(lowerPrefix)
  );

  // 정렬: 정확히 일치 → 키워드 → 클래스 → 메서드 순
  matches.sort((a, b) => {
    // 정확히 일치하면 최상단
    const aExact = a.label.toLowerCase() === lowerPrefix;
    const bExact = b.label.toLowerCase() === lowerPrefix;
    if (aExact && !bExact) return -1;
    if (!aExact && bExact) return 1;

    // 타입 우선순위
    const typeOrder = { keyword: 0, class: 1, method: 2, snippet: 3 };
    const aOrder = typeOrder[a.type];
    const bOrder = typeOrder[b.type];
    if (aOrder !== bOrder) return aOrder - bOrder;

    // 알파벳 순
    return a.label.localeCompare(b.label);
  });

  // 최대 개수만큼 반환
  return matches.slice(0, maxResults);
}

// ===========================
// 현재 입력 중인 단어 추출
// ===========================
/**
 * 커서 위치에서 현재 입력 중인 단어를 추출
 * @param text - 전체 텍스트
 * @param cursorOffset - 커서 위치 (0부터 시작)
 * @returns { word: 현재 단어, start: 시작 위치 }
 *
 * 예시:
 * - "public vo|id" (|가 커서) → { word: "vo", start: 7 }
 * - "System.out.prin|" → { word: "prin", start: 11 }
 */
export function getCurrentWord(
  text: string,
  cursorOffset: number
): { word: string; start: number } {
  // 커서 앞의 텍스트
  const beforeCursor = text.slice(0, cursorOffset);

  // 단어 경계 찾기 (공백, 점, 괄호 등)
  const match = beforeCursor.match(/[a-zA-Z_][a-zA-Z0-9_]*$/);

  if (match) {
    return {
      word: match[0],
      start: cursorOffset - match[0].length,
    };
  }

  return { word: "", start: cursorOffset };
}
