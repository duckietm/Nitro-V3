/**
 * Stub of `@nitrots/nitro-renderer` for Vitest.
 *
 * The real package eagerly loads Pixi v8 + a few hundred Habbo message
 * parsers/composers at module import time, which jsdom cannot host:
 * any `tests/**` file that transitively pulls a renderer symbol throws
 * before a single assertion runs.
 *
 * This module replaces it via `resolve.alias` in `vitest.config.mts`.
 * We provide explicit named exports for the symbols a test currently
 * needs (logger, event dispatcher, doorbell event class); everything
 * else mentioned in the comments below is a generic stub kept just to
 * keep the side-effectful imports happy as `src/api/index.ts` and
 * friends are pulled in transitively by the barrel cascade.
 *
 * Grow this file as new tests require additional symbols. Prefer adding
 * a real (deterministic) stub over wiring `vi.fn()` — it keeps the
 * mocks readable and avoids state bleed between cases.
 */

import { vi } from 'vitest';

// ---------------------------------------------------------------------------
// Logger
// ---------------------------------------------------------------------------

export const NitroLogger = {
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    enableContexts: vi.fn(),
    setDebug: vi.fn()
};

// ---------------------------------------------------------------------------
// Event dispatcher
// ---------------------------------------------------------------------------
//
// `GetEventDispatcher()` in the real SDK returns the renderer-wide event
// bus. Tests use `mockEventDispatcher.dispatchEvent(event)` to simulate
// a server push. `clearMockEventDispatcher()` resets the listener map
// between cases so subscriptions from a previous test don't leak.

type Listener = (event: any) => void;

const listeners = new Map<string, Set<Listener>>();

export const mockEventDispatcher = {
    addEventListener(type: string, handler: Listener)
    {
        let bucket = listeners.get(type);

        if(!bucket)
        {
            bucket = new Set();
            listeners.set(type, bucket);
        }

        bucket.add(handler);
    },
    removeEventListener(type: string, handler: Listener)
    {
        listeners.get(type)?.delete(handler);
    },
    dispatchEvent(event: { type: string })
    {
        const bucket = listeners.get(event.type);

        if(!bucket) return;

        for(const handler of bucket) handler(event);
    },
    hasListeners(type: string)
    {
        return (listeners.get(type)?.size ?? 0) > 0;
    }
};

export const clearMockEventDispatcher = () =>
{
    listeners.clear();
};

export const GetEventDispatcher = vi.fn(() => mockEventDispatcher);

// ---------------------------------------------------------------------------
// Event type enums (string-keyed Proxies)
// ---------------------------------------------------------------------------
//
// The real `*EventType` is a `class { static readonly FOO = '...'; … }`
// with stable wire strings. Tests only need each constant to be a
// unique string so dispatch + listener agree.

const makeEnumProxy = (label: string) => new Proxy({}, {
    get: (_, prop) => typeof prop === 'string' ? `mock:${ label }:${ prop }` : undefined
}) as Record<string, string>;

export const NitroEventType = makeEnumProxy('NitroEventType');
export const MouseEventType = makeEnumProxy('MouseEventType');
export const TouchEventType = makeEnumProxy('TouchEventType');
export const RoomObjectPlacementSource = makeEnumProxy('RoomObjectPlacementSource');
export const RoomObjectType = makeEnumProxy('RoomObjectType');
export const RoomObjectVariable = makeEnumProxy('RoomObjectVariable');
export const RoomTradingLevelEnum = makeEnumProxy('RoomTradingLevelEnum');
export const HabboClubLevelEnum = makeEnumProxy('HabboClubLevelEnum');
export const FurnitureType = makeEnumProxy('FurnitureType');
export const PetType = makeEnumProxy('PetType');
export const AvatarFigurePartType = makeEnumProxy('AvatarFigurePartType');
export const AvatarScaleType = makeEnumProxy('AvatarScaleType');
export const AvatarSetType = makeEnumProxy('AvatarSetType');
export const AvatarAction = makeEnumProxy('AvatarAction');
export const RoomWidgetEnumItemExtradataParameter = makeEnumProxy('RoomWidgetEnumItemExtradataParameter');

// Numeric enums — values mirror the real renderer SDK so comparisons
// (`controllerLevel >= GUILD_ADMIN`, category branching) keep working.

export class RoomControllerLevel
{
    static readonly NONE = 0;
    static readonly GUEST = 1;
    static readonly GUILD_MEMBER = 2;
    static readonly GUILD_ADMIN = 3;
    static readonly ROOM_OWNER = 4;
    static readonly MODERATOR = 5;
}

export class RoomObjectCategory
{
    static readonly MINIMUM = 0;
    static readonly ROOM = 10;
    static readonly UNIT = 20;
    static readonly FLOOR = 30;
    static readonly WALL = 40;
    static readonly MAXIMUM = 50;
}

// ---------------------------------------------------------------------------
// Doorbell event class
// ---------------------------------------------------------------------------

export class RoomSessionDoorbellEvent
{
    // Wire strings copied from the real class so any consumer that
    // ignores the indirection through the `.DOORBELL` static still
    // matches.
    static readonly DOORBELL = 'RSDE_DOORBELL';
    static readonly RSDE_ACCEPTED = 'RSDE_ACCEPTED';
    static readonly RSDE_REJECTED = 'RSDE_REJECTED';

    // Mirrors the real constructor signature `(type, session, userName)`
    // so `tsgo` is happy. Tests can pass `null` for the session: the
    // SUT only reads `.userName` and `.type`.
    constructor(public readonly type: string, public readonly _session: unknown, public readonly userName: string) {}
}

// ---------------------------------------------------------------------------
// Generic classes — placeholders for symbols that need to exist as
// constructors so module-level `new X(...)` calls don't crash during
// the barrel cascade, but whose behavior tests don't yet exercise.
// ---------------------------------------------------------------------------

class StubClass
{
    constructor(..._args: unknown[]) {}
}

export class NitroAlphaFilter extends StubClass {}
export class NitroContainer extends StubClass {}
export class NitroRectangle extends StubClass {}
export class NitroSprite extends StubClass {}
export class NitroTexture extends StubClass {}
export class NitroSoundEvent extends StubClass {}
export class NitroEvent extends StubClass {}
export class MessageEvent extends StubClass {}
export class RoomEngineObjectEvent extends StubClass {}
export class CreateLinkEvent extends StubClass {}
export class EventDispatcher extends StubClass {}
export class AdvancedMap extends StubClass {}
export class AvatarFigureContainer extends StubClass {}
export class Vector3d extends StubClass {}
export class ObjectDataFactory extends StubClass {}
export class RoomDataParser extends StubClass {}
export class RoomModerationSettings extends StubClass {}
export class StringDataType extends StubClass {}
export class SellablePetPaletteData extends StubClass {}
export class PetFigureData extends StubClass {}
export class PetData extends StubClass {}
export class NodeData extends StubClass {}
export class ItemDataStructure extends StubClass {}
export class HabboGroupEntryData extends StubClass {}
export class FriendParser extends StubClass {}
export class FriendCategoryData extends StubClass {}
export class FriendRequestData extends StubClass {}
export class FurnitureListItemParser extends StubClass {}
export class BotData extends StubClass {}
export class AchievementData extends StubClass {}
export class CatalogPageMessageProductData extends StubClass {}
export class GiftWrappingConfigurationParser extends StubClass {}
export class WiredFilter extends StubClass {}
export class HabboWebTools extends StubClass {}

// Composers — symbol-only constructors; only their identity matters in the
// codebase ("did the SUT call SendMessageComposer(new FooComposer(args))").
export class AddFavouriteRoomMessageComposer extends StubClass {}
export class DeleteFavouriteRoomMessageComposer extends StubClass {}
export class DesktopViewComposer extends StubClass {}
export class FurniturePlacePaintComposer extends StubClass {}
export class GetGuestRoomMessageComposer extends StubClass {}
export class GetProductOfferComposer extends StubClass {}
export class GroupFavoriteComposer extends StubClass {}
export class GroupInformationComposer extends StubClass {}
export class GroupJoinComposer extends StubClass {}
export class GroupUnfavoriteComposer extends StubClass {}
export class UserProfileComposer extends StubClass {}

// `ChooserSelectionFilter` is used as a string enum in some call sites.
export const ChooserSelectionFilter = makeEnumProxy('ChooserSelectionFilter');

// ---------------------------------------------------------------------------
// Singleton getters
// ---------------------------------------------------------------------------

const stubManager = () =>
{
    const sentinel = new Proxy(() => undefined, {
        get(target, prop)
        {
            if(prop === 'then') return undefined;
            const cached = (target as any)[prop];
            if(cached !== undefined) return cached;
            // Most fields read from a real manager are either methods
            // (return functions) or sub-objects (return proxies). We
            // return another callable proxy so chained access works.
            const value = stubManager();
            (target as any)[prop] = value;
            return value;
        },
        apply()
        {
            return undefined;
        }
    });

    return sentinel;
};

export const GetAssetManager = vi.fn(stubManager);
export const GetAvatarRenderManager = vi.fn(stubManager);
export const GetCommunication = vi.fn(stubManager);
export const GetConfiguration = vi.fn(stubManager);
export const GetLocalizationManager = vi.fn(stubManager);
export const GetRoomEngine = vi.fn(stubManager);
export const GetRoomSessionManager = vi.fn(stubManager);
export const GetSessionDataManager = vi.fn(stubManager);
export const GetTickerTime = vi.fn(() => 0);
export const TextureUtils = stubManager();
export const NitroVersion = stubManager();

// ---------------------------------------------------------------------------
// Type-only re-exports (interfaces erase at compile time, but listing them
// here documents what the codebase imports through the type channel).
//
//   IAvatarFigureContainer · IEventDispatcher · IFigurePart · IFigurePartSet ·
//   IFurnitureData · IFurnitureItemData · IGraphicAsset · IMessageComposer ·
//   IMessageEvent · IObjectData · IPartColor · IPollQuestion · IProductData ·
//   IRoomEngine · IRoomModerationSettings · IRoomObject · IRoomObjectController ·
//   IRoomObjectSpriteVisualization · IRoomPetData · IRoomSession · IRoomUserData
//
// No need to alias them — TypeScript only consults them in the type
// system, and the production `tsconfig.json` resolves them against the
// real renderer via `node_modules/@nitrots/nitro-renderer/src`.

// ---------------------------------------------------------------------------
// Catch-all
// ---------------------------------------------------------------------------
//
// Anything else still resolves to `undefined`. If a test fails with
// "X is not a constructor" / "X.SOMETHING is not a function", add the
// missing symbol above with a real stub. Avoid the temptation to
// blanket-mock everything — explicit stubs surface intent and let
// failing tests pinpoint what behavior they actually rely on.
