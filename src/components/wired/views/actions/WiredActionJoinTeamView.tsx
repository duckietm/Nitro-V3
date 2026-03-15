import { FC, useEffect, useState } from 'react';
import { LocalizeText, WiredFurniType } from '../../../../api';
import { Text } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredActionBaseView } from './WiredActionBaseView';
import { WiredSourcesSelector } from '../WiredSourcesSelector';

export const WiredActionJoinTeamView: FC<{}> = props =>
{
    const [ selectedTeam, setSelectedTeam ] = useState(-1);
    const { trigger = null, setIntParams = null } = useWired();
    const [ userSource, setUserSource ] = useState<number>(() =>
    {
        if(trigger?.intData?.length > 1) return trigger.intData[1];
        return 0;
    });

    const save = () => setIntParams([ selectedTeam, userSource ]);

    useEffect(() =>
    {
        setSelectedTeam((trigger.intData.length > 0) ? trigger.intData[0] : 0);
        setUserSource((trigger.intData.length > 1) ? trigger.intData[1] : 0);
    }, [ trigger ]);

    return (
        <WiredActionBaseView
            hasSpecialInput={ true }
            requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_NONE }
            save={ save }
            footer={ <WiredSourcesSelector showUsers={ true } userSource={ userSource } onChangeUsers={ setUserSource } /> }>
            <div className="flex flex-col gap-1">
                <Text bold>{ LocalizeText('wiredfurni.params.team') }</Text>
                { [ 1, 2, 3, 4 ].map(team =>
                {
                    return (
                        <div key={ team } className="flex gap-1">
                            <input checked={ (selectedTeam === team) } className="form-check-input" id={ `selectedTeam${ team }` } name="selectedTeam" type="radio" onChange={ event => setSelectedTeam(team) } />
                            <Text>{ LocalizeText(`wiredfurni.params.team.${ team }`) }</Text>
                        </div>
                    );
                }) }
            </div>
        </WiredActionBaseView>
    );
};
