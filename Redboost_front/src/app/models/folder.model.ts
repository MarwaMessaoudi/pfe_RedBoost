export interface Folder {
  id?: number;
  folderName: string;
  categoryId: number; // Ensure this field is included
  folderPath?: string;
  files?: any[];
}