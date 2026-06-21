export interface IPrefixItem {
    id: number;
    displayName?: string;
    text: string;
    color: string;
    icon: string;
    effect: string;
    font?: string;
    active: boolean;
    isCustom?: boolean;
    points?: number;
    pointsType?: number;
    catalogPrefixId?: number;
}
