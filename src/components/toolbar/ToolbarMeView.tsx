import { CreateLinkEvent, GetRoomEngine, GetSessionDataManager, RoomObjectCategory } from '@nitrots/nitro-renderer';
import { Dispatch, FC, PropsWithChildren, SetStateAction, useEffect, useRef } from 'react';
import { DispatchUiEvent, GetConfigurationValue, GetRoomSession, GetUserProfile, LocalizeText } from '../../api';
import { LayoutItemCountView } from '../../common';
import { GuideToolEvent } from '../../events';
import { ToolbarItemView } from './ToolbarItemView';

export const ToolbarMeView: FC<PropsWithChildren<{
    useGuideTool: boolean;
    unseenAchievementCount: number;
    setMeExpanded: Dispatch<SetStateAction<boolean>>;
}>> = props =>
{
    const { useGuideTool = false, unseenAchievementCount = 0, children = null } = props;
    const elementRef = useRef<HTMLDivElement>(null);

    useEffect(() =>
    {
        const roomSession = GetRoomSession();

        if(!roomSession) return;

        GetRoomEngine().selectRoomObject(roomSession.roomId, roomSession.ownRoomIndex, RoomObjectCategory.UNIT);
    }, []);

    return (
        <div className="w-fit max-w-[min(calc(100vw-16px),520px)] rounded-[12px] border border-white/8 bg-[rgba(10,10,12,0.58)] px-[10px] py-[7px] shadow-[0_10px_24px_rgba(0,0,0,0.2)]" ref={ elementRef }>
            <div className="flex items-center gap-[8px] overflow-x-auto overflow-y-visible whitespace-nowrap">
                { (GetConfigurationValue('guides.enabled') && useGuideTool) &&
                    <ToolbarItemView icon="me-helper-tool" onClick={ event => DispatchUiEvent(new GuideToolEvent(GuideToolEvent.TOGGLE_GUIDE_TOOL)) } title={ LocalizeText('guide.help.button.label') } /> }
                <ToolbarItemView icon="me-achievements" onClick={ event => CreateLinkEvent('achievements/toggle') } title={ LocalizeText('toolbar.icon.label.achievements') }>
                    { (unseenAchievementCount > 0) &&
                        <LayoutItemCountView count={ unseenAchievementCount } /> }
                </ToolbarItemView>
                <ToolbarItemView icon="me-profile" onClick={ event => GetUserProfile(GetSessionDataManager().userId) } title={ LocalizeText('toolbar.icon.label.memenu') } />
                <ToolbarItemView icon="me-rooms" onClick={ event => CreateLinkEvent('navigator/search/myworld_view') } title={ LocalizeText('navigator.myworlds') } />
                <ToolbarItemView icon="me-clothing" onClick={ event => CreateLinkEvent('avatar-editor/toggle') } title={ LocalizeText('widget.memenu.settings.avatar') } />
                <ToolbarItemView icon="me-settings" onClick={ event => CreateLinkEvent('user-settings/toggle') } title={ LocalizeText('widget.memenu.settings.title') } />
                <ToolbarItemView icon="me-forums" onClick={ event => CreateLinkEvent('groupforum/toggle') } title={ LocalizeText('toolbar.icon.label.forums') } />
                { children }
            </div>
        </div>
    );
};
