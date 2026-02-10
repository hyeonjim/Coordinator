/**
 * Java 자동완성 데이터 및 유틸리티
 * - 키워드, 내장 클래스, 메서드 등을 정의
 * - 입력에 따라 매칭되는 항목을 필터링
 */

// Java 자동완성 항목 타입
export interface AutoCompleteItem {
  label: string;      // 표시될 텍스트 (예: "public")
  type: "keyword" | "class" | "method" | "snippet";  // 종류
  insertText?: string; // 실제 삽입될 텍스트 (없으면 label 사용)
}

// Java 키워드 목록
const JAVA_KEYWORDS: AutoCompleteItem[] = [
  // 접근 제어자
  { label: "public", type: "keyword" },
  { label: "private", type: "keyword" },
  { label: "protected", type: "keyword" },

  // 클래스/인터페이스 관련
  { label: "class", type: "keyword" },
  { label: "interface", type: "keyword" },
  { label: "extends", type: "keyword" },
  { label: "implements", type: "keyword" },
  { label: "abstract", type: "keyword" },

  // 제어문
  { label: "if", type: "keyword" },
  { label: "else", type: "keyword" },
  { label: "for", type: "keyword" },
  { label: "while", type: "keyword" },
  { label: "do", type: "keyword" },
  { label: "switch", type: "keyword" },
  { label: "case", type: "keyword" },
  { label: "default", type: "keyword" },
  { label: "break", type: "keyword" },
  { label: "continue", type: "keyword" },
  { label: "return", type: "keyword" },

  // 예외 처리
  { label: "try", type: "keyword" },
  { label: "catch", type: "keyword" },
  { label: "finally", type: "keyword" },
  { label: "throw", type: "keyword" },
  { label: "throws", type: "keyword" },

  // 기타 키워드
  { label: "new", type: "keyword" },
  { label: "this", type: "keyword" },
  { label: "super", type: "keyword" },
  { label: "static", type: "keyword" },
  { label: "final", type: "keyword" },
  { label: "void", type: "keyword" },
  { label: "null", type: "keyword" },
  { label: "true", type: "keyword" },
  { label: "false", type: "keyword" },
  { label: "import", type: "keyword" },
  { label: "package", type: "keyword" },
  { label: "instanceof", type: "keyword" },
];

// Java 기본 타입
const JAVA_TYPES: AutoCompleteItem[] = [
  { label: "int", type: "keyword" },
  { label: "long", type: "keyword" },
  { label: "short", type: "keyword" },
  { label: "byte", type: "keyword" },
  { label: "float", type: "keyword" },
  { label: "double", type: "keyword" },
  { label: "boolean", type: "keyword" },
  { label: "char", type: "keyword" },
];

// Java 내장 클래스
const JAVA_CLASSES: AutoCompleteItem[] = [
  // 기본 래퍼 클래스
  { label: "String", type: "class" },
  { label: "Integer", type: "class" },
  { label: "Long", type: "class" },
  { label: "Double", type: "class" },
  { label: "Boolean", type: "class" },
  { label: "Character", type: "class" },
  { label: "Object", type: "class" },

  // 컬렉션
  { label: "ArrayList", type: "class" },
  { label: "LinkedList", type: "class" },
  { label: "HashMap", type: "class" },
  { label: "HashSet", type: "class" },
  { label: "TreeMap", type: "class" },
  { label: "TreeSet", type: "class" },
  { label: "List", type: "class" },
  { label: "Map", type: "class" },
  { label: "Set", type: "class" },

  // 입출력
  { label: "Scanner", type: "class" },
  { label: "BufferedReader", type: "class" },
  { label: "BufferedWriter", type: "class" },
  { label: "FileReader", type: "class" },
  { label: "FileWriter", type: "class" },

  // 유틸리티
  { label: "Arrays", type: "class" },
  { label: "Collections", type: "class" },
  { label: "Math", type: "class" },
  { label: "System", type: "class" },

  // 예외
  { label: "Exception", type: "class" },
  { label: "RuntimeException", type: "class" },
  { label: "NullPointerException", type: "class" },
  { label: "IOException", type: "class" },
];

// 자주 사용하는 메서드/스니펫
const JAVA_METHODS: AutoCompleteItem[] = [
  // 출력
  { label: "println", type: "method", insertText: "System.out.println();" },
  { label: "print", type: "method", insertText: "System.out.print();" },
  { label: "printf", type: "method", insertText: "System.out.printf();" },

  // main 메서드
  { label: "main", type: "snippet", insertText: "public static void main(String[] args) {\n    \n}" },
  { label: "psvm", type: "snippet", insertText: "public static void main(String[] args) {\n    \n}" },

  // 자주 쓰는 메서드
  { label: "toString", type: "method" },
  { label: "equals", type: "method" },
  { label: "hashCode", type: "method" },
  { label: "length", type: "method" },
  { label: "size", type: "method" },
  { label: "get", type: "method" },
  { label: "set", type: "method" },
  { label: "add", type: "method" },
  { label: "remove", type: "method" },
  { label: "contains", type: "method" },
  { label: "isEmpty", type: "method" },
];

// 전체 자동완성 항목
export const ALL_ITEMS: AutoCompleteItem[] = [
  ...JAVA_KEYWORDS,
  ...JAVA_TYPES,
  ...JAVA_CLASSES,
  ...JAVA_METHODS,
];

// 자동완성 필터링 함수
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

// 현재 입력 중인 단어 추출
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
