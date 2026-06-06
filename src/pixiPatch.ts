/**
 * Runtime patches for pixi.js v8 batcher edge cases.
 *
 * Pixi v8 (through 8.19 at least) has a long-running family of crashes
 * where `getAdjustedBlendModeBlend(blendMode, textureSource)` is invoked
 * with a `null` textureSource and throws on `null.alphaMode` or
 * `null.uid`. We've seen it from at least four call sites:
 *   - Batcher.break()  (FilterPipe, StencilMaskPipe, AlphaMaskPipe)
 *   - Batcher.checkAndUpdateTexture() (SpritePipe.validateRenderable)
 *
 * The trigger varies, but the symptom is always the same: a single bad
 * frame inside the catalog room previewer (or anywhere RoomSpriteCanvas
 * drives Pixi) tanks the whole render loop with an endless cascade of
 * requestAnimationFrame errors.
 *
 * We removed the two custom filters we owned (BlackToAlphaFilter,
 * PlaneMaskFilter) earlier, but several call sites are inside Pixi
 * itself or inside renderer-side mask setup that we can't sensibly
 * delete (RoomSpriteCanvas pins a Sprite mask on the master display to
 * clip the room to the canvas).
 *
 * Patch every known throwing entry point so that when it throws because
 * of a null textureSource we treat the frame as a no-op instead of
 * propagating the exception. The visible cost is a missed batch this
 * tick - the next tick re-renders cleanly. Without this patch the
 * LayoutRoomPreviewerView safety latch fires permanently on the first
 * affected offer.
 *
 * Importing this module has the side effect of installing the patch
 * exactly once, idempotent across HMR reloads.
 */
import * as PIXI from 'pixi.js';

type AnyFn = (...args: unknown[]) => unknown;

interface MethodHost {
    [key: string]: unknown;
}

declare global {
    interface Window {
        __nitroPixiBatcherPatched__?: boolean;
    }
}

const NULL_TEXTURE_MARKERS = /alphaMode|reading 'uid'|reading 'destroyed'|reading 'source'/;

const isNullTextureCrash = (err: unknown): boolean =>
{
    if(!(err instanceof TypeError)) return false;
    return NULL_TEXTURE_MARKERS.test(err.message ?? '');
};

const guardMethod = (proto: MethodHost, methodName: string, label: string): boolean =>
{
    const original = proto[methodName];
    if(typeof original !== 'function') return false;
    if((original as { __nitroGuarded__?: boolean }).__nitroGuarded__) return false;

    const guarded = function(this: unknown, ...args: unknown[])
    {
        try
        {
            return (original as AnyFn).apply(this, args);
        }
        catch(err)
        {
            if(isNullTextureCrash(err)) return undefined;
            throw err;
        }
    };

    (guarded as { __nitroGuarded__?: boolean }).__nitroGuarded__ = true;
    proto[methodName] = guarded;


    console.info(`[NitroPixiPatch] guarded ${ label }.prototype.${ methodName } against null textureSource`);
    return true;
};

const installPatch = (): void =>
{
    if(typeof window === 'undefined') return;
    if(window.__nitroPixiBatcherPatched__) return;

    const candidates: Array<[string, unknown]> = [
        [ 'DefaultBatcher', (PIXI as Record<string, unknown>).DefaultBatcher ],
        [ 'Batcher', (PIXI as Record<string, unknown>).Batcher ]
    ];

    let patched = false;

    for(const [ name, ctor ] of candidates)
    {
        const proto = (ctor as { prototype?: MethodHost } | undefined)?.prototype;
        if(!proto) continue;

        // break() is called during FilterPipe / StencilMaskPipe / AlphaMaskPipe.pop
        if(guardMethod(proto, 'break', name)) patched = true;
        // checkAndUpdateTexture() is called during SpritePipe.validateRenderable
        if(guardMethod(proto, 'checkAndUpdateTexture', name)) patched = true;
    }

    window.__nitroPixiBatcherPatched__ = patched;

    if(!patched)
    {

        console.warn('[NitroPixiPatch] could not locate Batcher.prototype methods - is pixi.js export shape unchanged?');
    }
};

installPatch();
