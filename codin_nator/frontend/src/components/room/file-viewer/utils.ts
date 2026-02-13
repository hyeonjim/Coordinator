import type {
  LocalFileSystemEntry,
  LocalFileSystemFileEntry,
  LocalFileSystemDirectoryEntry,
  LocalFileSystemDirectoryReader,
} from "@/types/room/file/types";

interface DragDropFileNode {
  name: string;
  type: "file" | "folder";
  children?: DragDropFileNode[];
  fileEntry?: LocalFileSystemFileEntry;
}

export async function getFileTree(
  items: DataTransferItemList,
): Promise<DragDropFileNode[]> {
  const entries: DragDropFileNode[] = [];

  for (let i = 0; i < items.length; i++) {
    const entry = items[i].webkitGetAsEntry?.() as LocalFileSystemEntry | null;
    if (entry) {
      entries.push(await scanEntry(entry));
    }
  }

  return entries;
}

async function scanEntry(entry: LocalFileSystemEntry): Promise<DragDropFileNode> {
  if (entry.isFile) {
    return {
      name: entry.name,
      type: "file",
      fileEntry: entry as LocalFileSystemFileEntry,
    };
  }

  if (entry.isDirectory) {
    const directoryEntry = entry as LocalFileSystemDirectoryEntry;
    const reader = directoryEntry.createReader();
    const entries = await readAllEntries(reader);
    const children = await Promise.all(entries.map(scanEntry));

    return {
      name: entry.name,
      type: "folder",
      children,
    };
  }

  return { name: "unknown", type: "file" };
}

async function readAllEntries(
  reader: LocalFileSystemDirectoryReader,
): Promise<LocalFileSystemEntry[]> {
  const entries: LocalFileSystemEntry[] = [];

  const readBatch = (): Promise<void> =>
    new Promise((resolve, reject) => {
      reader.readEntries(
        (results) => {
          if (results.length === 0) {
            resolve();
          } else {
            entries.push(...(results as LocalFileSystemEntry[]));
            readBatch().then(resolve).catch(reject);
          }
        },
        reject,
      );
    });

  await readBatch();
  return entries;
}

export function readFileContent(fileEntry: LocalFileSystemFileEntry): Promise<string> {
  return new Promise((resolve, reject) => {
    fileEntry.file(
      (file: File) => {
        const reader = new FileReader();
        reader.onloadend = (event) => resolve((event.target?.result as string) ?? "");
        reader.onerror = () => reject(new Error("File read error"));
        reader.readAsText(file);
      },
      reject,
    );
  });
}
