import { MemoryStorageFile } from '@blazity/nest-file-fastify';
import { randomUUID } from 'crypto';
import { mkdir, unlink, writeFile } from 'fs/promises';
import { join } from 'path';
import { MIME_EXT_MAP } from '../consts/mimeTypes';

/**
 * Delete previous file from disk if it exists. This is used when replacing the logo or favicon to ensure we don't leave orphaned files consuming storage.
 * @param relativePath
 * @returns None
 */
export const deleteOldFile = async (
  relativePath: string | null,
): Promise<void> => {
  if (!relativePath) return;

  try {
    const absolutePath = join(process.cwd(), relativePath);
    await unlink(absolutePath);
  } catch {
    // File may have already been deleted or never existed — safe to ignore
  }
};

/**
 * Save a new file to disk and return its URL. The file is saved in the specified folder (e.g., 'logos' or 'favicons') with a unique UUID filename to prevent collisions.
 * @param file
 * @param folder
 * @returns String URL of the saved file (e.g., /uploads/logos/uuid.jpg)
 */
export const saveFile = async (
  file: MemoryStorageFile,
  folder: string,
): Promise<string> => {
  const uploadDir = join(process.cwd(), 'uploads', folder);
  await mkdir(uploadDir, { recursive: true });

  const ext = MIME_EXT_MAP[file.mimetype] ?? '';
  const filename = `${randomUUID()}${ext}`;
  const filepath = join(uploadDir, filename);

  await writeFile(filepath, file.buffer);
  return `/uploads/${folder}/${filename}`;
};

/**
 * Replace an existing file with a new one. This function first deletes the old file from disk (if it exists) and then saves the new file, returning its URL.
 * @param file
 * @param folder
 * @param oldRelativePath
 * @returns String URL of the saved file (e.g., /uploads/logos/uuid.jpg)
 */
export const replaceFile = async (
  file: MemoryStorageFile,
  folder: string,
  oldRelativePath: string | null,
): Promise<string> => {
  await deleteOldFile(oldRelativePath);
  return saveFile(file, folder);
};
