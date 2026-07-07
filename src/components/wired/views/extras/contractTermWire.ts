export const CONTRACT_DIR_PAY = 0;
export const CONTRACT_DIR_RECEIVE = 1;

export const CONTRACT_KIND_CURRENCY = 0;
export const CONTRACT_KIND_FURNI = 1;

export const CONTRACT_STRIDE_V2 = 5;
export const CONTRACT_STRIDE_V1 = 3;

export interface ContractTermRow {
    direction: number;
    kind: number;
    currencyType: number;
    wallItem: boolean;
    baseItemId: number;
    amount: number;
}

const detectStride = (data: number[], count: number): number =>
    (data.length >= 1 + count * CONTRACT_STRIDE_V2 ? CONTRACT_STRIDE_V2 : CONTRACT_STRIDE_V1);

export const parseContractTerms = (intData: number[] = [], stringData = ''): ContractTermRow[] => {
    const data = intData ?? [];
    const count = data.length > 0 ? Math.max(0, data[0]) : 0;
    if (count <= 0) return [];

    const stride = detectStride(data, count);
    const posters = new Map<number, string>();

    if (stringData) {
        for (const part of stringData.split(',')) {
            const eq = part.indexOf('=');
            if (eq <= 0) continue;
            const index = parseInt(part.slice(0, eq), 10);
            if (!Number.isNaN(index)) posters.set(index, part.slice(eq + 1));
        }
    }

    const rows: ContractTermRow[] = [];
    for (let i = 0; i < count; i++) {
        const base = 1 + i * stride;
        if (base + stride - 1 >= data.length) break;

        const direction = data[base];
        if (stride === CONTRACT_STRIDE_V1) {
            rows.push({
                direction,
                kind: CONTRACT_KIND_CURRENCY,
                currencyType: data[base + 1],
                wallItem: false,
                baseItemId: 0,
                amount: Math.max(0, data[base + 2]),
            });
            continue;
        }

        const kind = data[base + 1];
        const amount = Math.max(0, data[base + 4]);
        if (kind === CONTRACT_KIND_FURNI) {
            rows.push({
                direction,
                kind,
                currencyType: 0,
                wallItem: data[base + 2] !== 0,
                baseItemId: Math.max(0, data[base + 3]),
                amount,
            });
        } else {
            rows.push({
                direction,
                kind: CONTRACT_KIND_CURRENCY,
                currencyType: data[base + 2],
                wallItem: false,
                baseItemId: 0,
                amount,
            });
        }
    }

    return rows;
};

export const serializeContractTerms = (rows: ContractTermRow[]): { intParams: number[]; stringParam: string } => {
    const valid = rows.filter((row) => row.amount > 0).slice(0, 8);
    const intParams: number[] = [valid.length];

    for (const row of valid) {
        intParams.push(row.direction, row.kind);
        if (row.kind === CONTRACT_KIND_FURNI) {
            intParams.push(row.wallItem ? 1 : 0, Math.max(0, row.baseItemId), Math.max(0, row.amount));
        } else {
            intParams.push(row.currencyType, 0, Math.max(0, row.amount));
        }
    }

    const posterParts: string[] = [];
    valid.forEach((row, index) => {
        if (row.kind === CONTRACT_KIND_FURNI && row.wallItem) {
            posterParts.push(`${index}=`);
        }
    });

    return { intParams, stringParam: posterParts.join(',') };
};

export const CURRENCY_OPTIONS: { value: number; label: string }[] = [
    { value: -1, label: 'Credits' },
    { value: 0, label: 'Duckets' },
    { value: 5, label: 'Diamonds' },
];
