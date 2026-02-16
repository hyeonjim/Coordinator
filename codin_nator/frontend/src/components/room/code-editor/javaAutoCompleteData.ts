/**
 * javaAutoCompleteData - Java 자동완성 데이터 정의
 *
 * [데이터 구조]
 * - AutoCompleteItem: { label, type, insertText? } 형태의 타입
 * - type: "keyword" | "class" | "method" | "snippet"으로 분류
 * - insertText: 선택 시 삽입할 텍스트 (없으면 label 사용)
 *
 * [TypeScript 기초 - 타입 안전성]
 * - AutoCompleteItem[] 타입으로 배열의 각 요소 타입을 보장
 * - 잘못된 필드명이나 타입을 사용하면 컴파일 시점에 에러 발생
 *
 * [설계 패턴 - 데이터 분리]
 * - UI 컴포넌트(AutoCompletePopup)와 데이터를 별도 파일로 분리
 * - 데이터 수정 시 컴포넌트 코드를 건드리지 않아도 됨
 */
import type { AutoCompleteItem } from "@/types/editor";

// Java 키워드 (public, class, if, for 등)
const JAVA_KEYWORDS: AutoCompleteItem[] = [
  { label: "public", type: "keyword" },
  { label: "private", type: "keyword" },
  { label: "protected", type: "keyword" },
  { label: "class", type: "keyword" },
  { label: "interface", type: "keyword" },
  { label: "extends", type: "keyword" },
  { label: "implements", type: "keyword" },
  { label: "abstract", type: "keyword" },
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
  { label: "try", type: "keyword" },
  { label: "catch", type: "keyword" },
  { label: "finally", type: "keyword" },
  { label: "throw", type: "keyword" },
  { label: "throws", type: "keyword" },
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
  { label: "int", type: "keyword" },
  { label: "long", type: "keyword" },
  { label: "short", type: "keyword" },
  { label: "byte", type: "keyword" },
  { label: "float", type: "keyword" },
  { label: "double", type: "keyword" },
  { label: "boolean", type: "keyword" },
  { label: "char", type: "keyword" },
];

// Java 내장 클래스 (String, ArrayList, HashMap 등)
const JAVA_CLASSES: AutoCompleteItem[] = [
  { label: "String", type: "class" },
  { label: "Integer", type: "class" },
  { label: "Long", type: "class" },
  { label: "Double", type: "class" },
  { label: "Boolean", type: "class" },
  { label: "Character", type: "class" },
  { label: "Object", type: "class" },
  { label: "ArrayList", type: "class" },
  { label: "LinkedList", type: "class" },
  { label: "HashMap", type: "class" },
  { label: "HashSet", type: "class" },
  { label: "TreeMap", type: "class" },
  { label: "TreeSet", type: "class" },
  { label: "List", type: "class" },
  { label: "Map", type: "class" },
  { label: "Set", type: "class" },
  { label: "Scanner", type: "class" },
  { label: "BufferedReader", type: "class" },
  { label: "BufferedWriter", type: "class" },
  { label: "FileReader", type: "class" },
  { label: "FileWriter", type: "class" },
  { label: "Arrays", type: "class" },
  { label: "Collections", type: "class" },
  { label: "Math", type: "class" },
  { label: "System", type: "class" },
  { label: "Exception", type: "class" },
  { label: "RuntimeException", type: "class" },
  { label: "NullPointerException", type: "class" },
  { label: "IOException", type: "class" },
];

// 메서드와 스니펫 (println, main 등 - insertText가 있으면 해당 텍스트로 대체 삽입)
const JAVA_METHODS: AutoCompleteItem[] = [
  { label: "println", type: "method", insertText: "System.out.println();" },
  { label: "print", type: "method", insertText: "System.out.print();" },
  { label: "printf", type: "method", insertText: "System.out.printf();" },
  { label: "main", type: "snippet", insertText: "public static void main(String[] args) {\n    \n}" },
  { label: "psvm", type: "snippet", insertText: "public static void main(String[] args) {\n    \n}" },
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

// 전체 자동완성 항목: 스프레드 연산자(...)로 세 배열을 하나로 합침
export const ALL_JAVA_ITEMS: AutoCompleteItem[] = [
  ...JAVA_KEYWORDS,
  ...JAVA_CLASSES,
  ...JAVA_METHODS,
];
