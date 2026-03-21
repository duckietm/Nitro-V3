import { IFigurePartSet } from '@nitrots/api';

export interface IAvatarEditorCategoryPartItem
{
    id?: number;
    partSet?: IFigurePartSet;
    usesColor?: boolean;
    maxPaletteCount?: number;
    isClear?: boolean;
}
