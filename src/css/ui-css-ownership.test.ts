import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const readSource = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');

describe('UI CSS ownership', () =>
{
    it('keeps static widget styles in css files instead of React style tags', () =>
    {
        const radioView = readSource('src/components/radio/RadioView.tsx');
        const toolbarView = readSource('src/components/toolbar/ToolbarView.tsx');
        const friendsBarView = readSource('src/components/friends/views/friends-bar/FriendsBarView.tsx');
        const wheelWinReveal = readSource('src/components/fortune-wheel/WheelWinReveal.tsx');
        const userIdentityView = readSource('src/common/UserIdentityView.tsx');
        const inventoryPrefixView = readSource('src/components/inventory/views/prefix/InventoryPrefixView.tsx');
        const bubbleHiddenView = readSource('src/components/nitrobubblehidden/NitrobubbleHiddenView.tsx');
        const prefixEffectsCss = readSource('src/css/common/PrefixEffects.css');
        const chatsCss = readSource('src/css/chat/Chats.css');

        expect(radioView).not.toContain('RADIO_STYLES');
        expect(toolbarView).not.toContain('TOOLBAR_STYLES');
        expect(friendsBarView).not.toContain('FRIENDBAR_STYLES');
        expect(wheelWinReveal).not.toContain('<style>');
        expect(userIdentityView).not.toContain('<style>');
        expect(inventoryPrefixView).not.toContain('<style>');
        expect(bubbleHiddenView).not.toContain('<style>');
        expect(bubbleHiddenView).not.toContain('dangerouslySetInnerHTML');
        expect(prefixEffectsCss).toContain('@keyframes prefix-pulse');
        expect(prefixEffectsCss).toContain('@keyframes prefix-sparkle');
        expect(chatsCss).toContain('.nitro-bubbles-hidden .newbubblehe');
    });

    it('keeps window-specific classes from repainting shared card chrome', () =>
    {
        const groupCreatorView = readSource('src/components/groups/views/GroupCreatorView.tsx');
        const catalogView = readSource('src/components/catalog/CatalogView.tsx');
        const catalogAdminOfferEditView = readSource('src/components/catalog/views/admin/CatalogAdminOfferEditView.tsx');
        const catalogAdminPageEditView = readSource('src/components/catalog/views/admin/CatalogAdminPageEditView.tsx');
        const catalogAdminModalView = readSource('src/components/catalog/views/admin/CatalogAdminModalView.tsx');
        const catalogAdminQuickActionsView = readSource('src/components/catalog/views/admin/CatalogAdminQuickActionsView.tsx');
        const catalogLayoutDefaultView = readSource('src/components/catalog/views/page/layout/CatalogLayoutDefaultView.tsx');
        const catalogLayoutPetView = readSource('src/components/catalog/views/page/layout/pets/CatalogLayoutPetView.tsx');
        const catalogLayoutTrophiesView = readSource('src/components/catalog/views/page/layout/CatalogLayoutTrophiesView.tsx');
        const getCatalogLayout = readSource('src/components/catalog/views/page/layout/GetCatalogLayout.tsx');
        const catalogCss = readSource('src/css/catalog/CatalogView.css');
        const inventoryCss = readSource('src/css/inventory/InventoryView.css');
        const friendsCss = readSource('src/css/friends/FriendsView.css');
        const roomSettingsCss = readSource('src/css/room/NavigatorRoomSettings.css');
        const indexCss = readSource('src/css/index.css');
        const modToolsView = readSource('src/components/mod-tools/ModToolsView.tsx');
        const modToolsRoomView = readSource('src/components/mod-tools/views/room/ModToolsRoomView.tsx');
        const modToolsTicketsView = readSource('src/components/mod-tools/views/tickets/ModToolsTicketsView.tsx');
        const modToolsUserView = readSource('src/components/mod-tools/views/user/ModToolsUserView.tsx');
        const inventoryView = readSource('src/components/inventory/InventoryView.tsx');
        const inventoryCategoryFilterView = readSource('src/components/inventory/views/InventoryCategoryFilterView.tsx');
        const navigatorView = readSource('src/components/navigator/NavigatorView.tsx');
        const navigatorRoomSettingsView = readSource('src/components/navigator/views/room-settings/NavigatorRoomSettingsView.tsx');
        const wiredBaseView = readSource('src/components/wired/views/WiredBaseView.tsx');
        const friendsCategoryManagerView = readSource('src/components/friends/views/friends-list/FriendsCategoryManagerView.tsx');
        const friendsListView = readSource('src/components/friends/views/friends-list/FriendsListView.tsx');
        const friendsListRemoveConfirmationView = readSource('src/components/friends/views/friends-list/FriendsListRemoveConfirmationView.tsx');
        const friendsListRoomInviteView = readSource('src/components/friends/views/friends-list/FriendsListRoomInviteView.tsx');
        const friendsMessengerView = readSource('src/components/friends/views/messenger/FriendsMessengerView.tsx');

        expect(groupCreatorView).not.toContain('border border-[solid] border-[#283F5D]');
        expect(catalogView).not.toContain('habbo-swf-window');
        expect(catalogAdminModalView).toContain('createPortal');
        expect(catalogAdminModalView).toContain('nitro-card-shell');
        expect(catalogAdminModalView).toContain('fixed inset-0 z-[1000]');
        expect(catalogAdminModalView).toContain('max-w-[calc(100vw-16px)]');
        expect(catalogAdminModalView).toContain('max-h-[calc(100vh-16px)]');
        expect(catalogAdminModalView).toContain('overflow-y-auto');
        expect(catalogAdminOfferEditView).not.toContain('style={ { zIndex: 1000 } }');
        expect(catalogAdminOfferEditView).toContain('<CatalogAdminModalView');
        expect(catalogAdminOfferEditView).toContain('widthClassName="w-[420px]"');
        expect(catalogAdminQuickActionsView).toContain('setEditingPageData(true)');
        expect(catalogLayoutDefaultView).toContain('<CatalogAdminQuickActionsView');
        expect(catalogLayoutPetView).toContain('<CatalogAdminQuickActionsView');
        expect(catalogLayoutTrophiesView).toContain('<CatalogAdminQuickActionsView');
        expect(catalogAdminPageEditView).toContain('<CatalogAdminModalView');
        expect(catalogAdminPageEditView).toContain('widthClassName="w-[520px]"');
        expect(getCatalogLayout).not.toContain('custom_prefix');
        expect(getCatalogLayout).not.toContain('CatalogLayoutCustomPrefixView');
        expect(catalogCss).toContain('.nitro-catalog-window :where(.bg-white, .bg-gray-50, .bg-card-grid-item)');
        expect(catalogCss).toContain('.nitro-catalog-window :where(input, select, textarea)');
        expect(catalogCss).toContain('.nitro-catalog-window :where(.text-muted, .text-dark)');
        expect(inventoryCategoryFilterView).not.toContain('style={ { width: currentTab === TAB_BADGES');
        expect(inventoryCategoryFilterView).toContain('nitro-inventory-filter-bar');
        expect(inventoryCss).toContain('.nitro-inventory-window .nitro-inventory-filter-bar.is-badges');
        expect(inventoryCss).toContain('.nitro-inventory-window :where(.bg-card-grid-item, .bg-white, .bg-light, .bg-muted)');
        expect(inventoryCss).toContain('.nitro-inventory-window :where(input, select, textarea)');
        expect(friendsCategoryManagerView).not.toContain('style={ { width: 270, minWidth: 270 } }');
        expect(friendsListRemoveConfirmationView).not.toContain('style={ { width: 270, height: 225');
        expect(friendsListRoomInviteView).not.toContain('style={ { width: 270, height: 225');
        expect(friendsCss).toContain('.nitro-friends-category-manager :where(input, select, textarea)');
        expect(friendsCss).toContain('width: min(270px, calc(100vw - 16px))');
        expect(roomSettingsCss).toContain('.nitro-room-settings');
        expect(roomSettingsCss).toContain(':where(input, select, textarea)');
        expect(indexCss).toContain('.nitro-wired :where(select, input[type=\'text\'], input[type=\'number\'], textarea)');
        expect(indexCss).toContain('.nitro-mod-tools :where(input, select, textarea)');
        expect(indexCss).toContain('[class*="nitro-mod-tools-"] :where(.bg-white, .bg-light, .bg-muted, .bg-card-grid-item, .bg-white\\/70)');
        expect(indexCss).toContain('.nitro-wired__body');
        expect(indexCss).toContain('overflow-y: auto');
        expect(modToolsView).toContain('max-w-[calc(100vw-16px)]');
        expect(modToolsRoomView).toContain('max-w-[calc(100vw-16px)]');
        expect(modToolsTicketsView).toContain('max-w-[calc(100vw-16px)]');
        expect(modToolsUserView).toContain('max-w-[calc(100vw-16px)]');
        expect(inventoryView).toContain('max-w-[calc(100vw-16px)]');
        expect(navigatorView).toContain('max-w-[calc(100vw-16px)]');
        expect(navigatorRoomSettingsView).toContain('max-w-[calc(100vw-16px)]');
        expect(wiredBaseView).toContain('max-h-[calc(100vh-16px)]');
        expect(friendsListView).toContain('max-w-[calc(100vw-16px)]');
        expect(friendsMessengerView).toContain('max-w-[calc(100vw-16px)]');
    });
});
