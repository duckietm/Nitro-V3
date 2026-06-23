import { GetSessionDataManager } from '@nitrots/nitro-renderer';
import { FC } from 'react';
import { GetConfigurationValue, isSafeExternalUrl, LocalizeText, ReportType } from '../../../../api';
import { NitroCardContentView, NitroCardHeaderView, NitroCardView } from '../../../../common';
import { useFurnitureExternalImageWidget, useHelp } from '../../../../hooks';
import { CameraWidgetShowPhotoView } from '../../../camera/views/CameraWidgetShowPhotoView';

export const FurnitureExternalImageView: FC<{}> = (props) => {
    const { objectId = -1, currentPhotoIndex = -1, currentPhotos = null, onClose = null } = useFurnitureExternalImageWidget();
    const { report = null } = useHelp();

    if (objectId === -1 || currentPhotoIndex === -1) return null;

    const handleOpenFullPhoto = () => {
        const photoUrl = currentPhotos[currentPhotoIndex].w.replace('_small.png', '.png');
        if (photoUrl && isSafeExternalUrl(photoUrl)) {
            window.open(photoUrl, '_blank', 'noopener,noreferrer');
        }
    };

    return (
        <NitroCardView className="nitro-external-image-widget no-resize" uniqueKey="photo-viewer" theme="primary-slim">
            <NitroCardHeaderView
                headerText={LocalizeText('camera.interface.title')}
                isGalleryPhoto={true}
                onCloseClick={onClose}
                onReportPhoto={() =>
                    report(ReportType.PHOTO, {
                        extraData: currentPhotos[currentPhotoIndex].w,
                        roomId: currentPhotos[currentPhotoIndex].s,
                        reportedUserId: GetSessionDataManager().userId,
                        roomObjectId: Number(currentPhotos[currentPhotoIndex].u)
                    })
                }
            />
            <NitroCardContentView>
                <CameraWidgetShowPhotoView currentIndex={currentPhotoIndex} currentPhotos={currentPhotos} onClick={handleOpenFullPhoto} />
            </NitroCardContentView>
        </NitroCardView>
    );
};
