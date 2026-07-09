import { AddLinkEventTracker, AvatarEditorFigureCategory, AvatarFigurePartType, GetSessionDataManager, ILinkEventTracker, RemoveLinkEventTracker, SetClothingChangeDataMessageComposer, UserFigureComposer } from '@nitrots/nitro-renderer';
import { FC, useEffect, useState } from 'react';
import { FaDice, FaRedo, FaTrash } from 'react-icons/fa';
import { AvatarEditorAction, LocalizeText, SendMessageComposer } from '../../api';
import { Button, ButtonGroup, NitroCardContentView, NitroCardHeaderView, NitroCardTabsItemView, NitroCardTabsView, NitroCardView } from '../../common';
import { useAvatarEditor } from '../../hooks';
import { AvatarEditorFigurePreviewView } from './AvatarEditorFigurePreviewView';
import { AvatarEditorModelView } from './AvatarEditorModelView';
import { AvatarEditorNftView } from './AvatarEditorNftView';
import { AvatarEditorPetView } from './AvatarEditorPetView';
import { AvatarEditorWardrobeView } from './AvatarEditorWardrobeView';

export const AvatarEditorView: FC<{}> = (props) => {
    const [isVisible, setIsVisible] = useState(false);
    const {
        setIsVisible: setEditorVisibility,
        clothingChangeData = null,
        setClothingChangeData = null,
        avatarModels,
        activeModelKey,
        setActiveModelKey,
        loadAvatarData,
        getFigureStringWithFace,
        gender,
        randomizeCurrentFigure = null,
        getFigureString = null
    } = useAvatarEditor();

    const isWardrobeOpen = activeModelKey === AvatarEditorFigureCategory.WARDROBE;
    const isPetsOpen = activeModelKey === AvatarEditorFigureCategory.PETS;
    const isNftOpen = activeModelKey === AvatarEditorFigureCategory.NFT;

    const processAction = (action: string) => {
        switch (action) {
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
                if (clothingChangeData) {
                    SendMessageComposer(new SetClothingChangeDataMessageComposer(clothingChangeData.objectId, gender, getFigureString));
                } else {
                    SendMessageComposer(new UserFigureComposer(gender, getFigureString));
                }
                setIsVisible(false);
                return;
        }
    };

    useEffect(() => {
        const linkTracker: ILinkEventTracker = {
            linkReceived: (url: string) => {
                const parts = url.split('/');

                if (parts.length < 2) return;

                switch (parts[1]) {
                    case 'show':
                        if (parts[2] && parts[3] && (parts[2] === AvatarFigurePartType.MALE || parts[2] === AvatarFigurePartType.FEMALE)) {
                            setClothingChangeData({ objectId: Number(parts[3]), gender: parts[2] });
                        } else {
                            setClothingChangeData(null);
                        }
                        setIsVisible(true);
                        return;
                    case 'hide':
                        setClothingChangeData(null);
                        setIsVisible(false);
                        return;
                    case 'toggle':
                        setClothingChangeData(null);
                        setIsVisible((prevValue) => !prevValue);
                        return;
                }
            },
            eventUrlPrefix: 'avatar-editor/'
        };

        AddLinkEventTracker(linkTracker);

        return () => RemoveLinkEventTracker(linkTracker);
    }, [setClothingChangeData]);

    useEffect(() => {
        setEditorVisibility(isVisible);

        if (!isVisible) setClothingChangeData(null);
    }, [isVisible, setEditorVisibility, setClothingChangeData]);

    if (!isVisible) return null;

    return (
        <NitroCardView className={`nitro-avatar-editor ${isWardrobeOpen ? 'w-[880px]' : 'w-[600px]'} h-[460px]`} isResizable={false} uniqueKey="avatar-editor">
            <NitroCardHeaderView
                headerText={LocalizeText(clothingChangeData ? 'widget.furni.clothingchange.editor.title' : 'avatareditor.title')}
                onCloseClick={(event) => setIsVisible(false)}
            />
            <NitroCardTabsView classNames={['avatar-editor-tabs']}>
                {Object.keys(avatarModels).map((modelKey) => {
                    const isActive = activeModelKey === modelKey;
                    const isWardrobe = modelKey === AvatarEditorFigureCategory.WARDROBE;
                    const isPets = modelKey === AvatarEditorFigureCategory.PETS;
                    const isNft = modelKey === AvatarEditorFigureCategory.NFT;
                    const isMisc = modelKey === AvatarEditorFigureCategory.MISC;

                    let tabClass = `tab ${modelKey}`;
                    if (isWardrobe) tabClass = 'tab-wardrobe';
                    else if (isPets) tabClass = 'tab-pets';
                    else if (isNft) tabClass = 'tab-nft';
                    else if (isMisc) tabClass = 'tab-misc';

                    return (
                        <NitroCardTabsItemView key={modelKey} isActive={isActive} onClick={(event) => setActiveModelKey(modelKey)}>
                            <div className={tabClass} />
                        </NitroCardTabsItemView>
                    );
                })}
            </NitroCardTabsView>
            <NitroCardContentView>
                <div className="flex gap-2 overflow-hidden h-full">
                    <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
                        {activeModelKey.length > 0 && !isWardrobeOpen && !isPetsOpen && !isNftOpen && (
                            <AvatarEditorModelView categories={avatarModels[activeModelKey]} name={activeModelKey} />
                        )}
                        {isWardrobeOpen && <AvatarEditorWardrobeView />}
                        {isPetsOpen && <AvatarEditorPetView categories={avatarModels[activeModelKey]} />}
                        {isNftOpen && <AvatarEditorNftView categories={avatarModels[activeModelKey]} />}
                    </div>
                    <div className="flex flex-col shrink-0 w-[120px] gap-1 overflow-hidden">
                        <AvatarEditorFigurePreviewView />
                        <div className="flex flex-col grow! gap-1">
                            {!clothingChangeData && (
                                <ButtonGroup className="w-full">
                                    <Button variant="secondary" className="flex-1" onClick={(event) => processAction(AvatarEditorAction.ACTION_RESET)}>
                                        <FaRedo className="fa-icon" />
                                    </Button>
                                    <Button variant="secondary" className="flex-1" onClick={(event) => processAction(AvatarEditorAction.ACTION_CLEAR)}>
                                        <FaTrash className="fa-icon" />
                                    </Button>
                                    <Button variant="secondary" className="flex-1" onClick={(event) => processAction(AvatarEditorAction.ACTION_RANDOMIZE)}>
                                        <FaDice className="fa-icon" />
                                    </Button>
                                </ButtonGroup>
                            )}
                            <Button className="w-full" variant="success" onClick={(event) => processAction(AvatarEditorAction.ACTION_SAVE)}>
                                {LocalizeText('avatareditor.save')}
                            </Button>
                        </div>
                    </div>
                </div>
            </NitroCardContentView>
        </NitroCardView>
    );
};
