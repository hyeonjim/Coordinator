// src/slate.d.ts
import { BaseEditor } from "slate";
import { ReactEditor } from "slate-react";

export type ParagraphElement = {
  type: "paragraph";
  children: CustomText[];
};

export type CustomText = {
  text: string;
  tokenType?: string;
};

declare module "slate" {
  interface CustomTypes {
    Editor: BaseEditor & ReactEditor;
    Element: ParagraphElement;
    Text: CustomText;
  }
}
