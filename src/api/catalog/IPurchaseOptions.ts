import { IObjectData } from '@nitrots/api';

export interface IPurchaseOptions
{
    quantity?: number;
    extraData?: string;
    extraParamRequired?: boolean;
    previewStuffData?: IObjectData;
}
