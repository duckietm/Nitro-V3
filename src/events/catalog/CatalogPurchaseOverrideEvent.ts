import { NitroEvent } from '@nitrots/events';
import { CatalogWidgetEvent } from './CatalogWidgetEvent';

export class CatalogPurchaseOverrideEvent extends NitroEvent
{
    private _callback: Function;

    constructor(callback: Function)
    {
        super(CatalogWidgetEvent.PURCHASE_OVERRIDE);

        this._callback = callback;
    }

    public get callback(): Function
    {
        return this._callback;
    }
}
