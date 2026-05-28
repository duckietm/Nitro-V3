import { IWheelAdminPrize, IWheelAdminPrizeEdit } from '@nitrots/nitro-renderer';
import { FC, useEffect, useState } from 'react';
import { LocalizeText } from '../../api';
import { Column, Flex, Text } from '../../common';
import { useFortuneWheel } from '../../hooks';
import { NitroCard } from '../../layout';

interface EditRow
{
    id: number;
    category: string;
    num: number;
    weight: number;
    label: string;
}

interface CategoryDef
{
    key: string;
    labelKey: string;
}

const CATEGORIES: CategoryDef[] = [
    { key: 'item',     labelKey: 'rarevalues.editor.cat.item' },
    { key: 'diamanti', labelKey: 'achievements.activitypoint.5' },
    { key: 'duckets',  labelKey: 'achievements.activitypoint.0' },
    { key: 'crediti',  labelKey: 'credits' },
    { key: 'giri',     labelKey: 'rarevalues.editor.cat.spin' },
    { key: 'nulla',    labelKey: 'rarevalues.editor.cat.nothing' }
];

const prizeToCategory = (prize: IWheelAdminPrize): string =>
{
    switch(prize.type)
    {
        case 'item':    return 'item';
        case 'points':  return (prize.pointsType === 5) ? 'diamanti' : 'duckets';
        case 'credits': return 'crediti';
        case 'spin':    return 'giri';
        default:        return 'nulla';
    }
};

const prizeToNum = (prize: IWheelAdminPrize): number =>
    (prize.type === 'item') ? (parseInt(prize.value) || 0) : prize.amount;

const rowToEdit = (row: EditRow): IWheelAdminPrizeEdit =>
{
    const base = { id: row.id, weight: row.weight, label: row.label };

    switch(row.category)
    {
        case 'item':     return { ...base, type: 'item',    value: String(row.num), amount: 1,       pointsType: 0 };
        case 'diamanti': return { ...base, type: 'points',  value: '',              amount: row.num, pointsType: 5 };
        case 'duckets':  return { ...base, type: 'points',  value: '',              amount: row.num, pointsType: 0 };
        case 'crediti':  return { ...base, type: 'credits', value: '',              amount: row.num, pointsType: 0 };
        case 'giri':     return { ...base, type: 'spin',    value: '',              amount: row.num, pointsType: 0 };
        default:         return { ...base, type: 'nothing', value: '',              amount: 0,       pointsType: 0 };
    }
};

interface FortuneWheelSettingsViewProps
{
    onClose: () => void;
}

export const FortuneWheelSettingsView: FC<FortuneWheelSettingsViewProps> = ({ onClose }) =>
{
    const { adminPrizes = [], loadAdminPrizes = null, saveAdminPrizes = null } = useFortuneWheel();
    const [ editRows, setEditRows ] = useState<EditRow[]>([]);

    useEffect(() =>
    {
        if(loadAdminPrizes) loadAdminPrizes();
    }, [ loadAdminPrizes ]);

    useEffect(() =>
    {
        setEditRows(adminPrizes.map(prize => ({
            id: prize.id,
            category: prizeToCategory(prize),
            num: prizeToNum(prize),
            weight: prize.weight,
            label: prize.label
        })));
    }, [ adminPrizes ]);

    const updateRow = (id: number, patch: Partial<EditRow>) =>
        setEditRows(prev => prev.map(row => (row.id === id) ? { ...row, ...patch } : row));

    return (
        <NitroCard className="w-[480px] h-[520px]" uniqueKey="fortune-wheel-settings">
            <NitroCard.Header
                headerText={ LocalizeText('wheel.settings.title') }
                onCloseClick={ onClose } />
            <NitroCard.Content>
                <Column gap={ 1 } className="h-full p-1">
                    <Flex gap={ 1 } className="px-1 text-[11px] font-bold text-black/60">
                        <span className="w-28">{ LocalizeText('rarevalues.editor.type') }</span>
                        <span className="w-16">{ LocalizeText('rarevalues.editor.value') }</span>
                        <span className="w-12">{ LocalizeText('rarevalues.editor.weight') }</span>
                        <span className="grow">{ LocalizeText('rarevalues.editor.label') }</span>
                    </Flex>
                    <Column gap={ 1 } overflow="auto" className="grow">
                        { editRows.map(row => (
                            <Flex key={ row.id } alignItems="center" gap={ 1 } className="border-b border-black/10 pb-1">
                                <select
                                    value={ row.category }
                                    onChange={ event => updateRow(row.id, { category: event.target.value }) }
                                    className="w-28 rounded border border-black/20 bg-white px-1 py-0.5 text-sm text-[#1f2d34]">
                                    { CATEGORIES.map(cat => (
                                        <option key={ cat.key } value={ cat.key }>{ LocalizeText(cat.labelKey) }</option>
                                    )) }
                                </select>
                                <input
                                    type="number"
                                    value={ row.num }
                                    disabled={ row.category === 'nulla' }
                                    onChange={ event => updateRow(row.id, { num: parseInt(event.target.value) || 0 }) }
                                    className="w-16 rounded border border-black/20 bg-white px-1 py-0.5 text-sm text-[#1f2d34] disabled:opacity-40" />
                                <input
                                    type="number"
                                    value={ row.weight }
                                    onChange={ event => updateRow(row.id, { weight: parseInt(event.target.value) || 0 }) }
                                    className="w-12 rounded border border-black/20 bg-white px-1 py-0.5 text-sm text-[#1f2d34]" />
                                <input
                                    type="text"
                                    value={ row.label }
                                    onChange={ event => updateRow(row.id, { label: event.target.value }) }
                                    className="min-w-0 grow rounded border border-black/20 bg-white px-1 py-0.5 text-sm text-[#1f2d34]" />
                            </Flex>
                        )) }
                        { !editRows.length &&
                            <Text small className="text-black/50">{ LocalizeText('wheel.settings.empty') }</Text> }
                    </Column>
                    <button
                        type="button"
                        disabled={ !editRows.length }
                        onClick={ () => saveAdminPrizes?.(editRows.map(rowToEdit)) }
                        className="cursor-pointer rounded bg-[#3a7bb5] px-4 py-2 font-bold text-white hover:bg-[#336ea3] disabled:cursor-default disabled:opacity-40">
                        { LocalizeText('rarevalues.editor.save') }
                    </button>
                </Column>
            </NitroCard.Content>
        </NitroCard>
    );
};
