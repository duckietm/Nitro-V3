import { FC, useEffect, useMemo, useState } from 'react';
import { LocalizeText, WiredFurniType } from '../../../../api';
import { Text } from '../../../../common';
import { useUserGroups, useWired } from '../../../../hooks';
import { WiredSourcesSelector } from '../WiredSourcesSelector';
import { WiredConditionBaseView } from './WiredConditionBaseView';

const GROUP_CURRENT_ROOM = 0;
const GROUP_SELECTED = 1;

interface WiredConditionActorIsGroupMemberViewProps {
    negative?: boolean;
}

export const WiredConditionActorIsGroupMemberView: FC<WiredConditionActorIsGroupMemberViewProps> = ({ negative = false }) => {
    const { data: groups = [] } = useUserGroups();
    const [userSource, setUserSource] = useState(0);
    const [groupType, setGroupType] = useState(GROUP_CURRENT_ROOM);
    const [selectedGroupId, setSelectedGroupId] = useState(0);
    const [quantifier, setQuantifier] = useState(0);
    const { trigger = null, setIntParams = null } = useWired();

    useEffect(() => {
        if (!trigger) return;

        const params = trigger.intData;

        setUserSource(params.length > 0 ? params[0] : 0);
        setGroupType(params.length > 1 ? params[1] : GROUP_CURRENT_ROOM);
        setSelectedGroupId(params.length > 2 ? params[2] : 0);
        setQuantifier(params.length > 3 && params[3] === 1 ? 1 : 0);
    }, [trigger]);

    useEffect(() => {
        if (groupType !== GROUP_SELECTED || selectedGroupId || !groups.length) return;

        setSelectedGroupId(groups[0].groupId);
    }, [groupType, selectedGroupId, groups]);

    const selectedGroupOptions = useMemo(() => groups.map((group) => ({ value: group.groupId, label: group.groupName })), [groups]);

    const save = () => setIntParams([userSource, groupType, selectedGroupId, quantifier]);

    return (
        <WiredConditionBaseView
            hasSpecialInput={true}
            requiresFurni={WiredFurniType.STUFF_SELECTION_OPTION_NONE}
            save={save}
            footer={<WiredSourcesSelector showUsers={true} userSource={userSource} onChangeUsers={setUserSource} />}
        >
            <div className="flex flex-col gap-2">
                <div className="flex flex-col gap-1">
                    <Text bold>{LocalizeText('wiredfurni.params.quantifier_selection')}</Text>
                    {[0, 1].map((value) => (
                        <label key={value} className="flex items-center gap-1">
                            <input
                                checked={quantifier === value}
                                className="form-check-input"
                                name="conditionGroupQuantifier"
                                type="radio"
                                onChange={() => setQuantifier(value)}
                            />
                            <Text>{LocalizeText(`wiredfurni.params.quantifier.users${negative ? '.neg' : ''}.${value}`)}</Text>
                        </label>
                    ))}
                </div>

                <div className="flex flex-col gap-1">
                    <Text bold>{LocalizeText('wiredfurni.params.groupselection')}</Text>
                    {[GROUP_CURRENT_ROOM, GROUP_SELECTED].map((value) => (
                        <label key={value} className="flex items-center gap-1">
                            <input
                                checked={groupType === value}
                                className="form-check-input"
                                name="conditionGroupType"
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
            </div>
        </WiredConditionBaseView>
    );
};
