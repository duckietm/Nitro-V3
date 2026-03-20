import { ConditionDefinition, GetRoomEngine, GetSessionDataManager, OpenMessageComposer, RoomObjectCategory, RoomObjectVariable, Triggerable, TriggerDefinition, UpdateActionMessageComposer, UpdateConditionMessageComposer, UpdateTriggerMessageComposer, WiredActionDefinition, WiredFurniActionEvent, WiredFurniConditionEvent, WiredFurniTriggerEvent, WiredOpenEvent, WiredSaveSuccessEvent, WiredValidationErrorEvent } from '@nitrots/nitro-renderer';
import { useEffect, useState } from 'react';
import { useBetween } from 'use-between';
import { GetRoomSession, IsOwnerOfFloorFurniture, LocalizeText, SendMessageComposer, WiredFurniType, WiredSelectionVisualizer } from '../../api';
import { useMessageEvent } from '../events';
import { useNotification } from '../notification';

const useWiredState = () =>
{
    const [ trigger, setTrigger ] = useState<Triggerable>(null);
    const [ intParams, setIntParams ] = useState<number[]>([]);
    const [ stringParam, setStringParam ] = useState<string>('');
    const [ furniIds, setFurniIds ] = useState<number[]>([]);
    const [ actionDelay, setActionDelay ] = useState<number>(0);
    const [ allowsFurni, setAllowsFurni ] = useState<number>(WiredFurniType.STUFF_SELECTION_OPTION_NONE);
    const [ selectByType, setSelectByType ] = useState<boolean>(false);
    const [ neighborhoodTiles, setNeighborhoodTiles ] = useState<{ x: number; y: number }[] | null>(null);
    const [ neighborhoodInvert, setNeighborhoodInvert ] = useState<boolean>(false);
    const [ allowedInteractionTypes, setAllowedInteractionTypes ] = useState<string[] | null>(null);
    const { showConfirm = null, simpleAlert = null } = useNotification();

    const saveWired = () =>
    {
        const save = (trigger: Triggerable) =>
        {
            if(!trigger) return;

            if(trigger instanceof WiredActionDefinition)
            {
                SendMessageComposer(new UpdateActionMessageComposer(trigger.id, intParams, stringParam, furniIds, actionDelay, trigger.stuffTypeSelectionCode));
            }

            else if(trigger instanceof TriggerDefinition)
            {
                SendMessageComposer(new UpdateTriggerMessageComposer(trigger.id, intParams, stringParam, furniIds, trigger.stuffTypeSelectionCode));
            }

            else if(trigger instanceof ConditionDefinition)
            {
                SendMessageComposer(new UpdateConditionMessageComposer(trigger.id, intParams, stringParam, furniIds, trigger.stuffTypeSelectionCode));
            }
        };

        if(!IsOwnerOfFloorFurniture(trigger.id))
        {
            showConfirm(LocalizeText('wiredfurni.nonowner.change.confirm.body'), () =>
            {
                save(trigger);
            }, null, null, null, LocalizeText('wiredfurni.nonowner.change.confirm.title'));
        }
        else
        {
            save(trigger);
        }
    };

    const selectObjectForWired = (objectId: number, category: number) =>
    {
        if(!trigger || !allowsFurni) return;

        if(objectId <= 0) return;

        const getInteractionTypeName = (furniData: any): string =>
        {
            if(!furniData) return null;

            const rawValue = (furniData as any).interactionType
                ?? (furniData as any).interactionTypeName
                ?? (furniData as any).interactionTypeId;

            if(rawValue === undefined || rawValue === null) return null;
            if(typeof rawValue !== 'string') return null;

            return rawValue.toLowerCase();
        };

        const isAllowedInteraction = (furniData: any): boolean =>
        {
            if(!allowedInteractionTypes || !allowedInteractionTypes.length) return true;

            const interactionType = getInteractionTypeName(furniData);
            if(!interactionType) return true;

            return allowedInteractionTypes.some(type => (type && type.toLowerCase() === interactionType));
        };

        if(selectByType && category === RoomObjectCategory.FLOOR)
        {
            const roomId = GetRoomSession().roomId;
            const clickedObject = GetRoomEngine().getRoomObject(roomId, objectId, RoomObjectCategory.FLOOR);

            if(!clickedObject) return;

            const typeId = clickedObject.model.getValue<number>(RoomObjectVariable.FURNITURE_TYPE_ID);
            const sourceFurniData = GetSessionDataManager().getFloorItemData(typeId);

            if(!sourceFurniData) return;
            if(!isAllowedInteraction(sourceFurniData))
            {
                setFurniIds(prevValue =>
                {
                    if(!prevValue.includes(objectId)) return prevValue;

                    const remaining = prevValue.filter(id => id !== objectId);

                    WiredSelectionVisualizer.hide(objectId);

                    return remaining;
                });

                return;
            }

            const matchFurniLine = sourceFurniData.furniLine;
            const matchName = sourceFurniData.name;

            const isSameGroup = (id: number): boolean =>
            {
                const obj = GetRoomEngine().getRoomObject(roomId, id, RoomObjectCategory.FLOOR);
                if(!obj) return false;

                const tId = obj.model.getValue<number>(RoomObjectVariable.FURNITURE_TYPE_ID);
                const fd = GetSessionDataManager().getFloorItemData(tId);
                if(!fd) return false;

                if(!isAllowedInteraction(fd)) return false;

                const furniLineMatch = matchFurniLine && matchFurniLine.length > 0 && fd.furniLine === matchFurniLine;
                return furniLineMatch || fd.name === matchName;
            };

            setFurniIds(prevValue =>
            {
                // ── Click on already-selected furni: deselect the whole group ──
                if(prevValue.includes(objectId))
                {
                    const toRemove = prevValue.filter(id => isSameGroup(id));
                    const remaining = prevValue.filter(id => !toRemove.includes(id));

                    WiredSelectionVisualizer.clearSelectionShaderFromFurni(toRemove);

                    return remaining;
                }

                // ── Select a new group ──────────────────────────────────────
                const allFloorObjects = GetRoomEngine().getRoomObjects(roomId, RoomObjectCategory.FLOOR);
                const newIds = [ ...prevValue ];
                const limit = trigger.maximumItemSelectionCount;

                for(const obj of allFloorObjects)
                {
                    if(newIds.length >= limit) break;
                    if(obj.id < 0) continue;

                    const tId = obj.model.getValue<number>(RoomObjectVariable.FURNITURE_TYPE_ID);
                    const fd = GetSessionDataManager().getFloorItemData(tId);
                    if(!fd) continue;
                    if(!isAllowedInteraction(fd)) continue;

                    const furniLineMatch = matchFurniLine && matchFurniLine.length > 0 && fd.furniLine === matchFurniLine;
                    const matches = furniLineMatch || fd.name === matchName;

                    if(matches && !newIds.includes(obj.id)) newIds.push(obj.id);
                }

                const addedIds = newIds.filter(id => !prevValue.includes(id));
                if(addedIds.length) WiredSelectionVisualizer.applySelectionShaderToFurni(addedIds);

                return newIds;
            });

            return;
        }

        if(category === RoomObjectCategory.FLOOR && allowedInteractionTypes && allowedInteractionTypes.length)
        {
            const roomId = GetRoomSession().roomId;
            const clickedObject = GetRoomEngine().getRoomObject(roomId, objectId, RoomObjectCategory.FLOOR);

            if(!clickedObject) return;

            const typeId = clickedObject.model.getValue<number>(RoomObjectVariable.FURNITURE_TYPE_ID);
            const sourceFurniData = GetSessionDataManager().getFloorItemData(typeId);

            if(!sourceFurniData) return;
            if(!isAllowedInteraction(sourceFurniData))
            {
                setFurniIds(prevValue =>
                {
                    if(!prevValue.includes(objectId)) return prevValue;

                    const remaining = prevValue.filter(id => id !== objectId);

                    WiredSelectionVisualizer.hide(objectId);

                    return remaining;
                });

                return;
            }
        }

        setFurniIds(prevValue =>
        {
            const newFurniIds = [ ...prevValue ];

            const index = prevValue.indexOf(objectId);

            if(index >= 0)
            {
                newFurniIds.splice(index, 1);

                WiredSelectionVisualizer.hide(objectId);
            }

            else if(newFurniIds.length < trigger.maximumItemSelectionCount)
            {
                newFurniIds.push(objectId);

                WiredSelectionVisualizer.show(objectId);
            }

            return newFurniIds;
        });
    };

    useMessageEvent<WiredOpenEvent>(WiredOpenEvent, event =>
    {
        const parser = event.getParser();

        SendMessageComposer(new OpenMessageComposer(parser.stuffId));
    });

    useMessageEvent<WiredSaveSuccessEvent>(WiredSaveSuccessEvent, event =>
    {
        const parser = event.getParser();

        WiredSelectionVisualizer.clearAllSelectionShaders();
        setTrigger(null);
    });

    useMessageEvent<WiredValidationErrorEvent>(WiredValidationErrorEvent, event =>
    {
        const parser = event.getParser();

        if(parser.info && parser.info.length)
        {
            simpleAlert(parser.info, null, null, null, LocalizeText('wiredfurni.title'));
        }
    });

    useMessageEvent<WiredFurniActionEvent>(WiredFurniActionEvent, event =>
    {
        const parser = event.getParser();

        setTrigger(parser.definition);
    });

    useMessageEvent<WiredFurniConditionEvent>(WiredFurniConditionEvent, event =>
    {
        const parser = event.getParser();

        setTrigger(parser.definition);
    });

    useMessageEvent<WiredFurniTriggerEvent>(WiredFurniTriggerEvent, event =>
    {
        const parser = event.getParser();

        setTrigger(parser.definition);
    });

    useEffect(() =>
    {
        if(!trigger) return;

        return () =>
        {
            WiredSelectionVisualizer.clearAllSelectionShaders();
            setIntParams([]);
            setStringParam('');
            setActionDelay(0);
            setFurniIds(prevValue =>
            {
                if(prevValue && prevValue.length) WiredSelectionVisualizer.clearSelectionShaderFromFurni(prevValue);

                return [];
            });
            setAllowsFurni(WiredFurniType.STUFF_SELECTION_OPTION_NONE);
            setSelectByType(false);
            setNeighborhoodTiles(null);
            setNeighborhoodInvert(false);
            setAllowedInteractionTypes(null);
        };
    }, [ trigger ]);

    return { trigger, setTrigger, intParams, setIntParams, stringParam, setStringParam, furniIds, setFurniIds, actionDelay, setActionDelay, setAllowsFurni, saveWired, selectObjectForWired, setSelectByType, setNeighborhoodTiles, setNeighborhoodInvert, setAllowedInteractionTypes };
};

export const useWired = () => useBetween(useWiredState);
