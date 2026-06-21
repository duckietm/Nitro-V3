import { FC, useEffect, useState } from 'react';
import { LocalizeText, WiredFurniType } from '../../../../api';
import { Text } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredSourcesSelector } from '../WiredSourcesSelector';
import { WiredConditionBaseView } from './WiredConditionBaseView';

const teamIds: number[] = [1, 2, 3, 4];

interface WiredConditionActorIsTeamMemberViewProps {
    negative?: boolean;
}

export const WiredConditionActorIsTeamMemberView: FC<WiredConditionActorIsTeamMemberViewProps> = ({ negative = false }) => {
    const [selectedTeam, setSelectedTeam] = useState(-1);
    const [quantifier, setQuantifier] = useState(1);
    const { trigger = null, setIntParams = null } = useWired();
    const [userSource, setUserSource] = useState<number>(() => {
        if (trigger?.intData?.length > 1) return trigger.intData[1];
        return 0;
    });

    const save = () => setIntParams([selectedTeam, userSource, quantifier]);

    useEffect(() => {
        setSelectedTeam(trigger.intData.length > 0 ? trigger.intData[0] : 0);
        setUserSource(trigger.intData.length > 1 ? trigger.intData[1] : 0);
        setQuantifier(trigger.intData.length > 2 ? (trigger.intData[2] === 1 ? 1 : 0) : 1);
    }, [trigger]);

    return (
        <WiredConditionBaseView
            hasSpecialInput={true}
            requiresFurni={WiredFurniType.STUFF_SELECTION_OPTION_NONE}
            save={save}
            footer={<WiredSourcesSelector showUsers={true} userSource={userSource} onChangeUsers={setUserSource} />}
        >
            <div className="flex flex-col gap-1">
                <Text bold>{LocalizeText('wiredfurni.params.quantifier_selection')}</Text>
                {[0, 1].map((value) => (
                    <label key={value} className="flex items-center gap-1">
                        <input
                            checked={quantifier === value}
                            className="form-check-input"
                            name="teamMemberQuantifier"
                            type="radio"
                            onChange={() => setQuantifier(value)}
                        />
                        <Text>{LocalizeText(`wiredfurni.params.quantifier.users${negative ? '.neg' : ''}.${value}`)}</Text>
                    </label>
                ))}
            </div>
            <div className="flex flex-col gap-1">
                <Text bold>{LocalizeText('wiredfurni.params.team')}</Text>
                {teamIds.map((value) => {
                    return (
                        <div key={value} className="items-center gap-1">
                            <input
                                checked={selectedTeam === value}
                                className="form-check-input"
                                id={`selectedTeam${value}`}
                                name="selectedTeam"
                                type="radio"
                                onChange={(event) => setSelectedTeam(value)}
                            />
                            <Text>{LocalizeText(`wiredfurni.params.team.${value}`)}</Text>
                        </div>
                    );
                })}
            </div>
        </WiredConditionBaseView>
    );
};
