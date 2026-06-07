import { GetRenderer, GetTicker, NitroLogger, NitroTicker, RoomPreviewer, TextureUtils } from '@nitrots/nitro-renderer';
import { FC, MouseEvent, useEffect, useRef } from 'react';

export const LayoutRoomPreviewerView: FC<{
    roomPreviewer: RoomPreviewer;
    height?: number;
}> = props =>
{
    const { roomPreviewer = null, height = 0 } = props;
    const elementRef = useRef<HTMLDivElement>(null);
    // Counter that disables further renders once Pixi throws in this
    // previewer too many times in a row. The Pixi v8 null-texture bug
    // (see src/pixiPatch.ts) is mostly absorbed at the prototype level,
    // but any stray throw still cascades every animation frame. Allow
    // a small number of consecutive failures so a transient bad frame
    // self-recovers; permanently disable only if the previewer is truly
    // wedged, which is what produces the "disabling further renders"
    // log the user sees.
    const renderFailuresRef = useRef(0);
    const MAX_RENDER_FAILURES = 6;

    const onClick = (event: MouseEvent<HTMLDivElement>) =>
    {
        if(!roomPreviewer) return;

        if(event.shiftKey) roomPreviewer.changeRoomObjectDirection();
        else roomPreviewer.changeRoomObjectState();
    };

    useEffect(() =>
    {
        if(!elementRef) return;

        renderFailuresRef.current = 0;

        const width = elementRef.current.parentElement.clientWidth;
        const texture = TextureUtils.createRenderTexture(width, height);

        const noteFailure = (label: string, error: unknown) =>
        {
            renderFailuresRef.current += 1;

            if(renderFailuresRef.current >= MAX_RENDER_FAILURES)
            {
                NitroLogger.error(`LayoutRoomPreviewerView ${ label } failed ${ renderFailuresRef.current } times; disabling further renders for this preview`, error);
            }
        };

        const paintToDOM = () =>
        {
            if(renderFailuresRef.current >= MAX_RENDER_FAILURES) return;
            if(!roomPreviewer || !elementRef.current) return;

            const renderingCanvas = roomPreviewer.getRenderingCanvas();

            if(!renderingCanvas) return;

            try
            {
                GetRenderer().render({
                    target: texture,
                    container: renderingCanvas.master,
                    clear: true
                });

                const canvas = GetRenderer().texture.generateCanvas(texture);
                const base64 = canvas.toDataURL('image/png');

                canvas.width = 0;
                canvas.height = 0;

                elementRef.current.style.backgroundImage = `url(${ base64 })`;
                // A successful paint is the signal we've recovered from
                // a transient bad frame; reset the failure counter.
                renderFailuresRef.current = 0;
            }
            catch(error)
            {
                noteFailure('paint', error);
            }
        };

        const update = (ticker: NitroTicker) =>
        {
            if(renderFailuresRef.current >= MAX_RENDER_FAILURES) return;
            if(!roomPreviewer || !elementRef.current) return;

            try
            {
                roomPreviewer.updatePreviewRoomView();
            }
            catch(error)
            {
                noteFailure('update', error);
                return;
            }

            const renderingCanvas = roomPreviewer.getRenderingCanvas();

            if(renderingCanvas && renderingCanvas.canvasUpdated)
            {
                paintToDOM();
            }
        };

        GetTicker().add(update);

        const resizeObserver = new ResizeObserver(() =>
        {
            if(!roomPreviewer || !elementRef.current) return;

            const width = elementRef.current.parentElement.offsetWidth;

            roomPreviewer.modifyRoomCanvas(width, height);

            paintToDOM();
        });

        roomPreviewer.getRoomCanvas(width, height);

        resizeObserver.observe(elementRef.current);

        return () =>
        {
            GetTicker().remove(update);

            resizeObserver.disconnect();

            texture.destroy(true);
        };
    }, [ roomPreviewer, elementRef, height ]);

    return (
        <div
            ref={ elementRef }
            className="relative w-full rounded-md shadow-room-previewer"
            style={ {
                height,
                minHeight: height,
                maxHeight: height
            } }
            onClick={ onClick } />
    );
};
