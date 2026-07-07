import { FC } from 'react';
import { LocalizeText } from '../../../../api';
import { Button, DraggableWindow, LayoutAvatarImageView, NitroCardContentView, NitroCardHeaderView, NitroCardView } from '../../../../common';
import { useFurnitureFriendFurniWidget } from '../../../../hooks';

export const FurnitureFriendFurniView: FC<{}> = (props) => {
    const { objectId = -1, type = 0, stage = 0, partnerConfirmed = false, usernames = [], figures = [], date = null, onClose = null, cancelLock = null, respond = null } = useFurnitureFriendFurniWidget();

    if (objectId === -1) return null;

    if (stage > 0) {
        const lockStage = partnerConfirmed ? 2 : stage;

        return (
            <NitroCardView className="nitro-engraving-lock" theme="primary-slim">
                <NitroCardHeaderView headerText={LocalizeText('friend.furniture.confirm.lock.caption')} onCloseClick={cancelLock ?? onClose} />
                <NitroCardContentView>
                    <h5 className="text-black text-center font-bold	 mt-2 mb-2">{LocalizeText('friend.furniture.confirm.lock.subtitle')}</h5>
                    <div className="flex justify-center mb-2">
                        <div className={`engraving-lock-stage-${lockStage}`}></div>
                    </div>
                    {(stage === 2 || partnerConfirmed) && (
                        <div className="text-small text-black text-center mb-2">{LocalizeText('friend.furniture.confirm.lock.other.locked')}</div>
                    )}
                    <div className="flex gap-1">
                        <Button fullWidth onClick={() => (cancelLock ?? onClose)()}>
                            {LocalizeText('friend.furniture.confirm.lock.button.cancel')}
                        </Button>
                        <Button fullWidth variant="success" onClick={() => respond(true)}>
                            {LocalizeText('friend.furniture.confirm.lock.button.confirm')}
                        </Button>
                    </div>
                </NitroCardContentView>
            </NitroCardView>
        );
    }

    if (usernames.length > 0) {
        return (
            <DraggableWindow handleSelector=".nitro-engraving-lock-view">
                <div className={`nitro-engraving-lock-view engraving-lock-${type}`}>
                    <div className="engraving-lock-close" onClick={onClose} />
                    <div className="flex justify-center">
                        <div className="engraving-lock-avatar">
                            <LayoutAvatarImageView direction={2} figure={figures[0]} />
                        </div>
                        <div className="engraving-lock-avatar">
                            <LayoutAvatarImageView direction={4} figure={figures[1]} />
                        </div>
                    </div>
                    <div className="flex flex-col mt-1 justify-between">
                        <div className="flex flex-col items-center gap-1 justify-center">
                            <div>
                                {type === 0 && LocalizeText('lovelock.engraving.caption')}
                                {type === 3 && LocalizeText('wildwest.engraving.caption')}
                            </div>
                            <div>{date}</div>
                        </div>
                        <div className="flex gap-4 justify-center">
                            <div>{usernames[0]}</div>
                            <div>{usernames[1]}</div>
                        </div>
                    </div>
                </div>
            </DraggableWindow>
        );
    }
};
