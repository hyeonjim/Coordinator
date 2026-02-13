import { useState, useCallback } from "react";
import { Editor, Text, Range, Transforms } from "slate";
import type { AutoCompleteItem, WordInfo } from "@/types/room/editor/types";
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
