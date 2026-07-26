import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { LibraryBook } from "../data/library";

const BOOK_DIRECTORY = `${FileSystem.documentDirectory}nour-books/`;

async function ensureDirectory() {
  const info = await FileSystem.getInfoAsync(BOOK_DIRECTORY);
  if (!info.exists)
    await FileSystem.makeDirectoryAsync(BOOK_DIRECTORY, {
      intermediates: true,
    });
}

export async function downloadBook(
  book: LibraryBook,
  onProgress?: (value: number) => void,
) {
  if (!book.downloadUrl)
    throw new Error("هذا الكتاب متاح للقراءة من المصدر فقط");
  await ensureDirectory();
  const destination = `${BOOK_DIRECTORY}${book.id}.pdf`;
  const existing = await FileSystem.getInfoAsync(destination);
  if (!existing.exists) {
    const task = FileSystem.createDownloadResumable(
      book.downloadUrl,
      destination,
      {},
      ({ totalBytesWritten, totalBytesExpectedToWrite }) =>
        onProgress?.(
          totalBytesExpectedToWrite > 0
            ? totalBytesWritten / totalBytesExpectedToWrite
            : 0,
        ),
    );
    const result = await task.downloadAsync();
    if (!result?.uri) throw new Error("لم يكتمل تنزيل الكتاب");
  }
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(destination, {
      mimeType: "application/pdf",
      dialogTitle: `فتح ${book.title}`,
      UTI: "com.adobe.pdf",
    });
  }
  return destination;
}
