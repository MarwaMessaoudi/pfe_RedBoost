import { Category } from './category.model';
import { Folder as IFolder } from './folder.model';

export interface CategoryWithFolders {
  category: Category;
  folders: IFolder[];
}