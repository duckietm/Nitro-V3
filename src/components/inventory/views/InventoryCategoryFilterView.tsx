import { Dispatch, FC, SetStateAction, useEffect, useState } from 'react';
import { GroupItem, LocalizeBadgeName, LocalizeText } from '../../../api';
import { NitroInput } from '../../../layout';

const FILTER_EVERYTHING = 'inventory.filter.option.everything';
const FILTER_FLOOR = 'inventory.furni.tab.floor';
const FILTER_WALL = 'inventory.furni.tab.wall';

const TAB_BADGES = 'inventory.badges';
const TAB_FURNITURE = 'inventory.furni';

interface InventoryCategoryFilterViewProps
{
    currentTab: string;
    groupItems: GroupItem[];
    badgeCodes: string[];
    setGroupItems: Dispatch<SetStateAction<GroupItem[]>>;
    setBadgeCodes: Dispatch<SetStateAction<string[]>>;
}

export const InventoryCategoryFilterView: FC<InventoryCategoryFilterViewProps> = props =>
{
    const { currentTab = null, groupItems = [], badgeCodes = [], setGroupItems = null, setBadgeCodes = null } = props;
    const [ filterType, setFilterType ] = useState<string>(FILTER_EVERYTHING);
    const [ searchValue, setSearchValue ] = useState('');

    useEffect(() =>
    {
        if(currentTab !== TAB_BADGES) return;

        const comparison = searchValue.toLocaleLowerCase().replace(' ', '');

        const filteredBadges = badgeCodes.filter(badge => badge.startsWith('ACH_'));
        const numberMap: { [key: string]: number } = {};

        filteredBadges.forEach(badge =>
        {
            const name = badge.split(/[\d]+/)[0];
            const number = Number(badge.replace(name, ''));

            if(numberMap[name] === undefined || number > numberMap[name])
            {
                numberMap[name] = number;
            }
        });

        const deduped = Object.keys(numberMap)
            .map(name => `${ name }${ numberMap[name] }`)
            .concat(badgeCodes.filter(badge => !badge.startsWith('ACH_')));

        const filtered = deduped.filter(badgeCode =>
            LocalizeBadgeName(badgeCode).toLocaleLowerCase().includes(comparison)
        );

        setBadgeCodes(filtered);
    }, [ badgeCodes, currentTab, searchValue, setBadgeCodes ]);

    useEffect(() =>
    {
        if(currentTab !== TAB_FURNITURE) return;

        const comparison = searchValue.toLocaleLowerCase();

        if(filterType === FILTER_EVERYTHING)
        {
            setGroupItems(groupItems.filter(item => item.name.toLocaleLowerCase().includes(comparison)));
            return;
        }

        const filtered = groupItems.filter(item =>
        {
            const isWall = filterType === FILTER_WALL ? item.isWallItem : false;
            const isFloor = filterType === FILTER_FLOOR ? !item.isWallItem : false;
            const matchesSearch = item.name.toLocaleLowerCase().includes(comparison);

            return comparison.length ? (matchesSearch && (isWall || isFloor)) : (isWall || isFloor);
        });

        setGroupItems(filtered);
    }, [ groupItems, setGroupItems, searchValue, filterType, currentTab ]);

    useEffect(() =>
    {
        setFilterType(FILTER_EVERYTHING);
        setSearchValue('');
    }, [ currentTab ]);

    return (
        <div
            className="flex gap-1 rounded p-1 bg-[#C9C9C9] shrink-0"
            style={ { width: currentTab === TAB_BADGES ? '320px' : '100%' } }>
            <div className="relative flex flex-1 items-center">
                <NitroInput
                    className="w-full"
                    placeholder={ LocalizeText('catalog.search') }
                    value={ searchValue }
                    onChange={ event => setSearchValue(event.target.value) } />
                { (searchValue && searchValue.length > 0) &&
                    <i
                        className="icon icon-clear absolute cursor-pointer right-1 top-1"
                        onClick={ () => setSearchValue('') } /> }
            </div>
            { currentTab !== TAB_BADGES &&
                <select
                    className="form-select text-xs rounded px-1 py-0 border border-gray-400 bg-white cursor-pointer"
                    value={ filterType }
                    onChange={ event => setFilterType(event.target.value) }>
                    { [ FILTER_EVERYTHING, FILTER_FLOOR, FILTER_WALL ].map((type, index) =>
                        <option key={ index } value={ type }>{ LocalizeText(type) }</option>
                    ) }
                </select> }
        </div>
    );
};
