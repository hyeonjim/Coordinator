/**
 * useAutoComplete.ts - 코드 에디터 자동완성 상태 관리 훅
 *
 * [이 훅의 역할]
 * - 사용자가 입력 중인 단어를 감지하여 자동완성 후보 목록 생성
 * - 키보드(ArrowUp/Down, Enter/Tab, Escape)로 후보 선택/삽입/닫기
 * - 팝업 위치를 현재 커서 위치 기준으로 계산
 *
 * [Slate 에디터 API]
 * - Editor: Slate 에디터의 핵심 인터페이스 (커서 위치, 노드 조회 등)
 * - Range: 텍스트 선택 영역 (시작점 anchor ~ 끝점 focus)
 * - Range.isCollapsed: 선택 영역이 없고 커서만 있는 상태인지 확인
 * - Transforms: 에디터 내용을 변경하는 유틸리티 (삽입, 삭제, 선택 등)
 * - Text.isText: 노드가 텍스트 노드인지 확인
 *
 * [동작 흐름]
 * 사용자 입력 → handleAutoComplete() 호출 → 현재 단어 추출 →
 * filterAutoComplete()로 후보 필터링 → 팝업 표시 →
 * 키보드/클릭으로 선택 → insertAutoComplete()로 단어 교체
 */
import { useState, useCallback } from "react";
import { Editor, Text, Range, Transforms } from "slate";
import type { AutoCompleteItem, WordInfo } from "@/types/editor";
import {
  filterAutoComplete,
  getCurrentWord,
} from "@/components/room/code-editor/AutoCompletePopup";

export function useAutoComplete(editor: Editor) {
  const [autoCompleteItems, setAutoCompleteItems] = useState<AutoCompleteItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
  const [currentWord, setCurrentWord] = useState<WordInfo>({ word: "", start: 0 });

  // 팝업을 현재 커서 위치 아래에 표시
  const updatePopupPosition = useCallback(() => {
    try {
      const domSelection = window.getSelection();
      if (!domSelection || domSelection.rangeCount === 0) return;

      const range = domSelection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setPopupPosition({ top: rect.bottom + 4, left: rect.left });
    } catch {
      // 위치 계산 실패 시 무시
    }
  }, []);

  // 현재 입력에 따라 자동완성 항목 업데이트
  const handleAutoComplete = useCallback(() => {
    const { selection } = editor;
    if (!selection || !Range.isCollapsed(selection)) {
      setAutoCompleteItems([]);
      return;
    }

    const [node] = Editor.node(editor, selection.focus.path);
    if (!Text.isText(node)) {
      setAutoCompleteItems([]);
      return;
    }

    const wordInfo = getCurrentWord(node.text, selection.focus.offset);
    setCurrentWord(wordInfo);

    if (wordInfo.word.length >= 1) {
      const items = filterAutoComplete(wordInfo.word);
      setAutoCompleteItems(items);
      setSelectedIndex(0);
      updatePopupPosition();
    } else {
      setAutoCompleteItems([]);
    }
  }, [editor, updatePopupPosition]);

  // 선택된 항목으로 현재 단어 교체
  const insertAutoComplete = useCallback(
    (item: AutoCompleteItem) => {
      const { selection } = editor;
      if (!selection) return;

      const insertText = item.insertText || item.label;
      Transforms.select(editor, {
        anchor: { path: selection.focus.path, offset: currentWord.start },
        focus: selection.focus,
      });
      Transforms.delete(editor);
      Transforms.insertText(editor, insertText);
      setAutoCompleteItems([]);
    },
    [editor, currentWord],
  );

  // 자동완성 키보드 이벤트 처리, 이벤트 처리 시 true 반환
  const handleAutoCompleteKeyDown = useCallback(
    (event: React.KeyboardEvent): boolean => {
      if (autoCompleteItems.length === 0) return false;

      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          setSelectedIndex((previous) =>
            previous < autoCompleteItems.length - 1 ? previous + 1 : 0,
          );
          return true;

        case "ArrowUp":
          event.preventDefault();
          setSelectedIndex((previous) =>
            previous > 0 ? previous - 1 : autoCompleteItems.length - 1,
          );
          return true;

        case "Enter":
        case "Tab":
          event.preventDefault();
          if (autoCompleteItems[selectedIndex]) {
            insertAutoComplete(autoCompleteItems[selectedIndex]);
          }
          return true;

        case "Escape":
          event.preventDefault();
          setAutoCompleteItems([]);
          return true;
      }
      return false;
    },
    [autoCompleteItems, selectedIndex, insertAutoComplete],
  );

  return {
    autoCompleteItems,
    selectedIndex,
    popupPosition,
    handleAutoComplete,
    insertAutoComplete,
    handleAutoCompleteKeyDown,
  };
}
