import { FC, useEffect, useMemo, useState } from 'react';
import { LocalizeText } from '../../../../api';
import { Text } from '../../../../common';
import { useUserGroups, useWired } from '../../../../hooks';
import { WiredSelectorBaseView } from './WiredSelectorBaseView';

const GROUP_CURRENT_ROOM = 0;
const GROUP_SELECTED = 1;

export const WiredSelectorUsersGroupView: FC<{}> = () => {
    const { data: groups = [] } = useUserGroups();
    const [groupType, setGroupType] = useState(GROUP_CURRENT_ROOM);
    const [selectedGroupId, setSelectedGroupId] = useState(0);
    const [filterExisting, setFilterExisting] = useState(false);
    const [invert, setInvert] = useState(false);
    const { trigger = null, setIntParams = null } = useWired();

    useEffect(() => {
        if (!trigger) return;

        const params = trigger.intData;

        setGroupType(params.length > 0 ? params[0] : GROUP_CURRENT_ROOM);
        setSelectedGroupId(params.length > 1 ? params[1] : 0);
        setFilterExisting(params.length > 2 ? params[2] === 1 : false);
        setInvert(params.length > 3 ? params[3] === 1 : false);
    }, [trigger]);

    useEffect(() => {
        if (groupType !== GROUP_SELECTED || selectedGroupId || !groups.length) return;

        setSelectedGroupId(groups[0].groupId);
    }, [groupType, selectedGroupId, groups]);

    const selectedGroupOptions = useMemo(() => groups.map((group) => ({ value: group.groupId, label: group.groupName })), [groups]);

    const save = () => setIntParams([groupType, selectedGroupId, filterExisting ? 1 : 0, invert ? 1 : 0]);

    return (
        <WiredSelectorBaseView hasSpecialInput={true} requiresFurni={0} save={save} hideDelay={true} cardStyle={{ width: 400 }}>
            <div className="flex flex-col gap-2">
                <div className="flex flex-col gap-1">
                    <Text bold>{LocalizeText('wiredfurni.params.groupselection')}</Text>
                    {[GROUP_CURRENT_ROOM, GROUP_SELECTED].map((value) => (
                        <label key={value} className="flex items-center gap-1">
                            <input
                                checked={groupType === value}
                                className="form-check-input"
                                name="usersGroupSelectorType"
                                type="radio"
                                onChange={() => setGroupType(value)}
                            />
                            <Text>{LocalizeText(`wiredfurni.params.grouptype.${value}`)}</Text>
                        </label>
                    ))}
                </div>

                {groupType === GROUP_SELECTED && (
                    <select
                        className="form-select form-select-sm"
                        value={selectedGroupId}
                        onChange={(event) => setSelectedGroupId(parseInt(event.target.value))}
                    >
                        {!selectedGroupOptions.length && <option value={0}>-</option>}
                        {selectedGroupOptions.map((group) => (
                            <option key={group.value} value={group.value}>
                                {group.label}
                            </option>
                        ))}
                    </select>
                )}

                <hr className="m-0 bg-dark" />

                <Text bold>{LocalizeText('wiredfurni.params.selector_options_selector')}</Text>

                <label className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        className="form-check-input"
                        checked={filterExisting}
                        onChange={(event) => setFilterExisting(event.target.checked)}
                    />
                    <Text small>{LocalizeText('wiredfurni.params.selector_option.0')}</Text>
                </label>

                <label className="flex items-center gap-2">
                    <input type="checkbox" className="form-check-input" checked={invert} onChange={(event) => setInvert(event.target.checked)} />
                    <Text small>{LocalizeText('wiredfurni.params.selector_option.1')}</Text>
                </label>
            </div>
        </WiredSelectorBaseView>
    );
};
