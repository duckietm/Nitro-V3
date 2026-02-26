import { AddLinkEventTracker, AvatarEditorFigureCategory, GetSessionDataManager, ILinkEventTracker, RemoveLinkEventTracker, UserFigureComposer } from '@nitrots/nitro-renderer';
import { FC, useEffect, useState } from 'react';
import { FaDice, FaRedo, FaTrash } from 'react-icons/fa';
import { AvatarEditorAction, LocalizeText, SendMessageComposer } from '../../api';
import { Button, ButtonGroup, NitroCardContentView, NitroCardHeaderView, NitroCardTabsItemView, NitroCardTabsView, NitroCardView } from '../../common';
import { useAvatarEditor } from '../../hooks';
import { AvatarEditorFigurePreviewView } from './AvatarEditorFigurePreviewView';
import { AvatarEditorModelView } from './AvatarEditorModelView';
import { AvatarEditorWardrobeView } from './AvatarEditorWardrobeView';

export const AvatarEditorView: FC<{}> = props =>
{
    const [ isVisible, setIsVisible ] = useState(false);
    const { setIsVisible: setEditorVisibility, avatarModels, activeModelKey, setActiveModelKey, loadAvatarData, getFigureStringWithFace, gender, randomizeCurrentFigure = null, getFigureString = null } = useAvatarEditor();

    const isWardrobeOpen = (activeModelKey === AvatarEditorFigureCategory.WARDROBE);

    const processAction = (action: string) =>
    {
        switch(action)
        {
            case AvatarEditorAction.ACTION_RESET:
                loadAvatarData(GetSessionDataManager().figure, GetSessionDataManager().gender);
                return;
            case AvatarEditorAction.ACTION_CLEAR:
                loadAvatarData(getFigureStringWithFace(0, false), gender);
                return;
            case AvatarEditorAction.ACTION_RANDOMIZE:
                randomizeCurrentFigure();
                return;
            case AvatarEditorAction.ACTION_SAVE:
                SendMessageComposer(new UserFigureComposer(gender, getFigureString));
                setIsVisible(false);
                return;
        }
    };

    useEffect(() =>
    {
        const linkTracker: ILinkEventTracker = {
            linkReceived: (url: string) =>
            {
                const parts = url.split('/');

                if(parts.length < 2) return;

                switch(parts[1])
                {
                    case 'show':
                        setIsVisible(true);
                        return;
                    case 'hide':
                        setIsVisible(false);
                        return;
                    case 'toggle':
                        setIsVisible(prevValue => !prevValue);
                        return;
                }
            },
            eventUrlPrefix: 'avatar-editor/'
        };

        AddLinkEventTracker(linkTracker);

        return () => RemoveLinkEventTracker(linkTracker);
    }, []);

    useEffect(() =>
    {
        setEditorVisibility(isVisible);
    }, [ isVisible, setEditorVisibility ]);

    if(!isVisible) return null;

    return (
        <NitroCardView
            className={ `nitro-avatar-editor ${ isWardrobeOpen ? 'w-[880px]' : 'w-[620px]' } h-[460px]` }
            uniqueKey="avatar-editor">
            <NitroCardHeaderView headerText={ LocalizeText('avatareditor.title') } onCloseClick={ event => setIsVisible(false) } />
            <NitroCardTabsView classNames={ ['avatar-editor-tabs'] }>
                { Object.keys(avatarModels).map(modelKey =>
                {
                    const isActive = (activeModelKey === modelKey);
                    const isWardrobe = (modelKey === AvatarEditorFigureCategory.WARDROBE);

                    return (
                        <NitroCardTabsItemView key={ modelKey } isActive={ isActive } onClick={ event => setActiveModelKey(modelKey) }>
                            <div className={ isWardrobe ? 'tab-wardrobe' : `tab ${ modelKey }` } />
                        </NitroCardTabsItemView>
                    );
                }) }
            </NitroCardTabsView>
            <NitroCardContentView>
                <div className="flex gap-2 overflow-hidden h-full">
                    { /* left: model view or wardrobe */ }
                    <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
                        { (activeModelKey.length > 0 && !isWardrobeOpen) &&
                            <AvatarEditorModelView categories={ avatarModels[activeModelKey] } name={ activeModelKey } /> }
                        { isWardrobeOpen &&
                            <AvatarEditorWardrobeView /> }
                    </div>
                    { /* right: preview + actions */ }
                    <div className="flex flex-col shrink-0 w-[120px] gap-1 overflow-hidden">
                        <AvatarEditorFigurePreviewView />
                        <div className="flex flex-col grow! gap-1">
                            <ButtonGroup className="w-full">
                                <Button variant="secondary" className="flex-1" onClick={ event => processAction(AvatarEditorAction.ACTION_RESET) }>
                                    <FaRedo className="fa-icon" />
                                </Button>
                                <Button variant="secondary" className="flex-1" onClick={ event => processAction(AvatarEditorAction.ACTION_CLEAR) }>
                                    <FaTrash className="fa-icon" />
                                </Button>
                                <Button variant="secondary" className="flex-1" onClick={ event => processAction(AvatarEditorAction.ACTION_RANDOMIZE) }>
                                    <FaDice className="fa-icon" />
                                </Button>
                            </ButtonGroup>
                            <Button className="w-full" variant="success" onClick={ event => processAction(AvatarEditorAction.ACTION_SAVE) }>
                                { LocalizeText('avatareditor.save') }
                            </Button>
                        </div>
                    </div>
                </div>
            </NitroCardContentView>
        </NitroCardView>
    );
};
