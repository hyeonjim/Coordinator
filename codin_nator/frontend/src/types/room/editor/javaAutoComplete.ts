export interface AutoCompleteItem {
  label: string;
  type: "keyword" | "class" | "method" | "snippet";
  insertText?: string;
}
