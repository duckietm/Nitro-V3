
import { CreateFlatMessageComposer, HabboClubLevelEnum } from '@nitrots/nitro-renderer';
import { FC, useEffect, useState } from 'react';
import { GetClubMemberLevel, GetConfigurationValue, IRoomModel, LocalizeText, SendMessageComposer } from '../../../api';
import { Button, Flex, Grid, LayoutCurrencyIcon, LayoutGridItem, Text } from '../../../common';
import { useNavigatorData } from '../../../hooks';
import { NitroInput } from '../../../layout';
import { useRoomCreatorStore } from './navigatorRoomCreatorStore';

const MAX_VISITORS_LIST: number[] = Array.from({ length: 10 }, (_, i) => (i + 1) * 10);

export const NavigatorRoomCreatorView: FC = () =>
{
    const [ name, setName ] = useState<string>(null);
    const [ description, setDescription ] = useState<string>(null);
    const [ category, setCategory ] = useState<number>(null);
    const [ visitorsCount, setVisitorsCount ] = useState<number>(MAX_VISITORS_LIST[0]);
    const [ tradesSetting, setTradesSetting ] = useState<number>(0);
    const [ roomModels ] = useState<IRoomModel[]>(() => GetConfigurationValue<IRoomModel[]>('navigator.room.models') ?? []);
    const [ selectedModelName, setSelectedModelName ] = useState<string>(() =>
    {
        const models = GetConfigurationValue<IRoomModel[]>('navigator.room.models');

        return (models && models.length) ? models[0].name : '';
    });
    const isCreating = useRoomCreatorStore(s => s.isCreating);
    const beginCreate = useRoomCreatorStore(s => s.beginCreate);
    const { categories } = useNavigatorData();

    const hcDisabled = GetConfigurationValue<boolean>('hc.disabled', false);

    const getRoomModelImage = (name: string) => GetConfigurationValue<string>('images.url') + `/navigator/models/model_${ name }.png`;

    const selectModel = (model: IRoomModel, index: number) =>
    {
        if(!model || (model.clubLevel > GetClubMemberLevel())) return;

        setSelectedModelName(roomModels[index].name);
    };

    const createRoom = () =>
    {
        if(useRoomCreatorStore.getState().isCreating) return;

        beginCreate();

        SendMessageComposer(new CreateFlatMessageComposer(name, description, 'model_' + selectedModelName, Number(category), Number(visitorsCount), tradesSetting));
    };

    useEffect(() =>
    {
        if(categories && categories.length) setCategory(categories[0].id);
    }, [ categories ]);

    return (
        <div className="flex flex-col overflow-auto">
            <Grid overflow="hidden">
                <div className="flex flex-col gap-1 overflow-auto col-span-6">
                    <div className="flex flex-col gap-1">
                        <Text>{ LocalizeText('navigator.createroom.roomnameinfo') }</Text>
                        <NitroInput maxLength={ 60 } placeholder={ LocalizeText('navigator.createroom.roomnameinfo') } type="text" onChange={ event => setName(event.target.value) } />
                    </div>
                    <div className="flex flex-col grow! gap-1">
                        <Text>{ LocalizeText('navigator.createroom.roomdescinfo') }</Text>
                        <textarea className="grow! form-control form-control-sm w-full" maxLength={ 255 } placeholder={ LocalizeText('navigator.createroom.roomdescinfo') } onChange={ event => setDescription(event.target.value) } />
                    </div>
                    <div className="flex flex-col gap-1">
                        <Text>{ LocalizeText('navigator.category') }</Text>
                        <select className="form-select form-select-sm" onChange={ event => setCategory(Number(event.target.value)) }>
                            { categories && (categories.length > 0) && categories.map(category =>
                            {
                                return <option key={ category.id } value={ category.id }>{ LocalizeText(category.name) }</option>;
                            }) }
                        </select>
                    </div>
                    <div className="flex flex-col gap-1">
                        <Text>{ LocalizeText('navigator.maxvisitors') }</Text>
                        <select className="form-select form-select-sm" onChange={ event => setVisitorsCount(Number(event.target.value)) }>
                            { MAX_VISITORS_LIST.map(value =>
                            {
                                return <option key={ value } value={ value }>{ value }</option>;
                            }) }
                        </select>
                    </div>
                    <div className="flex flex-col gap-1">
                        <Text>{ LocalizeText('navigator.tradesettings') }</Text>
                        <select className="form-select form-select-sm" onChange={ event => setTradesSetting(Number(event.target.value)) }>
                            <option value="0">{ LocalizeText('navigator.roomsettings.trade_not_allowed') }</option>
                            <option value="1">{ LocalizeText('navigator.roomsettings.trade_not_with_Controller') }</option>
                            <option value="2">{ LocalizeText('navigator.roomsettings.trade_allowed') }</option>
                        </select>
                    </div>
                </div>
                <div className="flex flex-col gap-1 overflow-auto col-span-6">
                    {
                        roomModels.map((model, index) =>
                        {
                            return (<LayoutGridItem key={ model.name } fullHeight className="p-1" disabled={ (GetClubMemberLevel() < model.clubLevel) } gap={ 0 } itemActive={ (selectedModelName === model.name) } overflow="unset" onClick={ () => selectModel(model, index) }>
                                <Flex center fullHeight overflow="hidden">
                                    <img alt="" src={ getRoomModelImage(model.name) } />
                                </Flex>
                                <Text bold>{ model.tileSize } { LocalizeText('navigator.createroom.tilesize') }</Text>
                                { !hcDisabled && model.clubLevel > HabboClubLevelEnum.NO_CLUB && <LayoutCurrencyIcon className="top-1 inset-e-1" position="absolute" type="hc" /> }
                            </LayoutGridItem>);
                        })
                    }
                </div>
            </Grid>
            <Button fullWidth disabled={ isCreating || !name || (name.length < 3) } variant={ (isCreating || !name || (name.length < 3)) ? 'danger' : 'success' } onClick={ createRoom }>{ LocalizeText('navigator.createroom.create') }</Button>
        </div>
    );
};
