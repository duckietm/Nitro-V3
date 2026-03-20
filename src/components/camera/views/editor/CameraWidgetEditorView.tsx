import { GetRoomCameraWidgetManager, IRoomCameraWidgetEffect, IRoomCameraWidgetSelectedEffect, NitroLogger, NitroTexture, RoomCameraWidgetSelectedEffect } from '@nitrots/nitro-renderer';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FaSave, FaSearchMinus, FaSearchPlus, FaTrash } from 'react-icons/fa';
import { CameraEditorTabs, CameraPicture, CameraPictureThumbnail, LocalizeText } from '../../../../api';
import { Button, Column, Flex, Grid, NitroCardContentView, NitroCardHeaderView, NitroCardTabsItemView, NitroCardTabsView, NitroCardView, Slider, Text } from '../../../../common';
import { CameraWidgetEffectListView } from './effect-list';

export interface CameraWidgetEditorViewProps {
    picture: CameraPicture;
    availableEffects: IRoomCameraWidgetEffect[];
    myLevel: number;
    onClose: () => void;
    onCancel: () => void;
    onCheckout: (pictureUrl: string) => void;
}

const TABS: string[] = [ CameraEditorTabs.COLORMATRIX, CameraEditorTabs.COMPOSITE ];

export const CameraWidgetEditorView: FC<CameraWidgetEditorViewProps> = props => {
    const { picture = null, availableEffects = null, myLevel = 1, onClose = null, onCancel = null, onCheckout = null } = props;
    const [ currentTab, setCurrentTab ] = useState(TABS[0]);
    const [ selectedEffectName, setSelectedEffectName ] = useState<string>(null);
    const [ selectedEffects, setSelectedEffects ] = useState<IRoomCameraWidgetSelectedEffect[]>([]);
    const [ effectsThumbnails, setEffectsThumbnails ] = useState<CameraPictureThumbnail[]>([]);
    const [ isZoomed, setIsZoomed ] = useState(false);
    const [ currentPictureUrl, setCurrentPictureUrl ] = useState<string>(picture?.imageUrl ?? '');
    const [ stableTexture, setStableTexture ] = useState<NitroTexture>(null);
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout>>(null);
    const requestIdRef = useRef<number>(0);

    useEffect(() =>
    {
        const img = new Image();
        img.onload = () => setStableTexture(NitroTexture.from(img));
        img.src = picture.imageUrl;
    }, [ picture ]);

    const getColorMatrixEffects = useMemo(() => {
        return availableEffects.filter(effect => effect.colorMatrix);
    }, [ availableEffects ]);

    const getCompositeEffects = useMemo(() => {
        return availableEffects.filter(effect => effect.texture);
    }, [ availableEffects ]);

    const getEffectList = useCallback(() => {
        return currentTab === CameraEditorTabs.COLORMATRIX ? getColorMatrixEffects : getCompositeEffects;
    }, [ currentTab, getColorMatrixEffects, getCompositeEffects ]);

    const getSelectedEffectIndex = useCallback((name: string) => {
        if (!name || !name.length || !selectedEffects || !selectedEffects.length) return -1;
        return selectedEffects.findIndex(effect => effect.effect.name === name);
    }, [ selectedEffects ]);

    const getCurrentEffectIndex = useMemo(() => {
        return getSelectedEffectIndex(selectedEffectName);
    }, [ selectedEffectName, getSelectedEffectIndex ]);

    const getCurrentEffect = useMemo(() => {
        if (!selectedEffectName) return null;
        return selectedEffects[getCurrentEffectIndex] || null;
    }, [ selectedEffectName, getCurrentEffectIndex, selectedEffects ]);

    const setSelectedEffectAlpha = useCallback((alpha: number) => {
        const index = getCurrentEffectIndex;
        if (index === -1) return;

        setSelectedEffects(prevValue => {
            const clone = [ ...prevValue ];
            const currentEffect = clone[index];
            clone[index] = new RoomCameraWidgetSelectedEffect(currentEffect.effect, alpha);
            return clone;
        });
    }, [ getCurrentEffectIndex ]);

    const processAction = useCallback((type: string, effectName: string = null) => {
        switch (type) {
            case 'close':
                onClose();
                return;
            case 'cancel':
                onCancel();
                return;
            case 'checkout':
                onCheckout(currentPictureUrl);
                return;
            case 'change_tab':
                setCurrentTab(String(effectName));
                return;
            case 'select_effect': {
                const existingIndex = getSelectedEffectIndex(effectName);
                if (existingIndex >= 0) return;

                const effect = availableEffects.find(effect => effect.name === effectName);
                if (!effect) return;

                setSelectedEffects(prevValue => [ ...prevValue, new RoomCameraWidgetSelectedEffect(effect, 1) ]);
                setSelectedEffectName(effect.name);
                return;
            }
            case 'remove_effect': {
                const existingIndex = getSelectedEffectIndex(effectName);
                if (existingIndex === -1) return;

                setSelectedEffects(prevValue => {
                    const clone = [ ...prevValue ];
                    clone.splice(existingIndex, 1);
                    return clone;
                });

                if (selectedEffectName === effectName) setSelectedEffectName(null);
                return;
            }
            case 'clear_effects':
                onCancel();
                return;
            case 'download': {
                if(!currentPictureUrl) return;

                const parts = currentPictureUrl.split(',');
                const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/png';
                const binary = atob(parts[1]);
                const bytes = new Uint8Array(binary.length);
                for(let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
                const blob = new Blob([ bytes ], { type: mime });
                const blobUrl = URL.createObjectURL(blob);

                const w = window.open('', '_blank');
                if(w)
                {
                    w.document.title = 'camera_photo.png';
                    w.document.body.style.margin = '0';
                    w.document.body.innerHTML = `<img src="${ blobUrl }" style="max-width:100%"/>`;
                }

                return;
            }
            case 'zoom':
                setIsZoomed(prev => !prev);
                return;
        }
    }, [ availableEffects, selectedEffectName, currentPictureUrl, getSelectedEffectIndex, onCancel, onCheckout, onClose ]);

    useEffect(() => {
        if(!stableTexture) return;

        const processThumbnails = async () => {
            const renderedEffects = await Promise.all(
                availableEffects.map(effect =>
                    GetRoomCameraWidgetManager().applyEffects(stableTexture, [ new RoomCameraWidgetSelectedEffect(effect, 1) ], false)
                )
            );
            setEffectsThumbnails(renderedEffects.map((image, index) => new CameraPictureThumbnail(availableEffects[index].name, image.src)));
        };
        processThumbnails();
    }, [ stableTexture, availableEffects ]);

    useEffect(() => {
        if(!stableTexture) return;

        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

        debounceTimerRef.current = setTimeout(() => {
            const id = ++requestIdRef.current;

            GetRoomCameraWidgetManager()
                .applyEffects(stableTexture, selectedEffects, false)
                .then(imageElement => {
                    if (id !== requestIdRef.current) return;
                    setCurrentPictureUrl(imageElement.src);
                })
                .catch(error => NitroLogger.error('Failed to apply effects to picture', error));
        }, 50);

        return () => {
            if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        };
    }, [ stableTexture, selectedEffects ]);

    return (
        <NitroCardView className="w-[600px] h-[500px]">
            <NitroCardHeaderView headerText={ LocalizeText('camera.editor.button.text') } onCloseClick={ event => processAction('close') } />
            <NitroCardTabsView>
                { TABS.map(tab => (
                    <NitroCardTabsItemView key={ tab } isActive={ currentTab === tab } onClick={ event => processAction('change_tab', tab) }>
                        <i className={ 'nitro-icon icon-camera-' + tab }></i>
                    </NitroCardTabsItemView>
                )) }
            </NitroCardTabsView>
            <NitroCardContentView>
                <Grid>
                    <Column overflow="hidden" size={ 5 }>
                        <CameraWidgetEffectListView
                            myLevel={ myLevel }
                            selectedEffects={ selectedEffects }
                            effects={ getEffectList() }
                            thumbnails={ effectsThumbnails }
                            processAction={ processAction }
                        />
                    </Column>
                    <Column justifyContent="between" overflow="hidden" size={ 7 }>
                        <Column center>
                            <div className="w-[325px] h-[325px] overflow-hidden">
                                { currentPictureUrl && <img
                                    alt=""
                                    src={ currentPictureUrl }
                                    className="w-[325px] h-[325px] [image-rendering:pixelated]"
                                    style={ isZoomed ? { transform: 'scale(2)', transformOrigin: 'center' } : undefined }
                                /> }
                            </div>
                            { selectedEffectName && (
                                <Column center fullWidth gap={ 1 }>
                                    <Text>{ LocalizeText('camera.effect.name.' + selectedEffectName) }</Text>
                                    <Slider
                                        min={ 0 }
                                        max={ 100 }
                                        step={ 1 }
                                        value={ Math.round(getCurrentEffect.strength * 100) }
                                        onChange={ event => setSelectedEffectAlpha(event / 100) }
                                        renderThumb={ ({ key, ...props }, state) => <div key={ key } { ...props }>{ state.valueNow }</div> }
                                    />
                                </Column>
                            ) }
                        </Column>
                        <div className="flex justify-between">
                            <div className="relative inline-flex align-middle">
                                <Button onClick={ event => processAction('clear_effects') }>
                                    <FaTrash className="fa-icon" />
                                </Button>
                                <Button onClick={ event => processAction('download') }>
                                    <FaSave className="fa-icon" />
                                </Button>
                                <Button onClick={ event => processAction('zoom') }>
                                    { isZoomed ? <FaSearchMinus className="fa-icon" /> : <FaSearchPlus className="fa-icon" /> }
                                </Button>
                            </div>
                            <div className="flex gap-1">
                                <Button onClick={ event => processAction('cancel') }>
                                    { LocalizeText('generic.cancel') }
                                </Button>
                                <Button onClick={ event => processAction('checkout') }>
                                    { LocalizeText('camera.preview.button.text') }
                                </Button>
                            </div>
                        </div>
                    </Column>
                </Grid>
            </NitroCardContentView>
        </NitroCardView>
    );
};