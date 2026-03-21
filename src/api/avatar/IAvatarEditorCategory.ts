import { IPartColor } from '@nitrots/api';
import { IAvatarEditorCategoryPartItem } from './IAvatarEditorCategoryPartItem';

export interface IAvatarEditorCategory
{
    setType: string;
    partItems: IAvatarEditorCategoryPartItem[];
    colorItems: IPartColor[][];
}
