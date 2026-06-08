# Messenger Phase 1 — Friend Groups Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add full custom friend groups (create / rename / delete / assign) to the existing React friends list, with an Online/Offline-primary view plus a per-group chip filter.

**Architecture:** Four new client→server packets (renderer composers + Arcturus handlers) drive category CRUD + friend assignment. The server persists to the existing `messenger_categories` table and the `messenger_friendships.category` column, then re-pushes authoritative state through the **existing** `MessengerInitComposer` (category list) and `UpdateFriendComposer` (a friend's new `categoryId`). The client already receives `categories` via `MessengerInitEvent` and `categoryId` per friend — we add CRUD actions + UI and a pure group-filter helper.

**Tech Stack:** Arcturus (Java 21/Maven/HikariCP), Nitro_Render_V3 (TypeScript, yarn workspaces, Vitest), Nitro-V3 (React 19, Vite, Vitest).

---

## Cross-codebase header-ID contract

Renderer **Outgoing** header N == Arcturus **Incoming** header N (verified across 8 existing friend packets, e.g. `SET_RELATIONSHIP_STATUS = 3768 == ChangeRelationEvent = 3768`). Phase 1 reuses existing server→client headers, so it needs **4 new client→server header IDs only**, used identically in `OutgoingHeader.ts` (renderer) and `Incoming.java` (Arcturus):

| Logical packet | Renderer composer | Arcturus handler | Constant name (both sides) |
|---|---|---|---|
| Add category | `AddFriendCategoryComposer(name)` | `AddFriendCategoryEvent` | `ADD_FRIEND_CATEGORY` / `AddFriendCategoryEvent` |
| Rename category | `RenameFriendCategoryComposer(categoryId, name)` | `RenameFriendCategoryEvent` | `RENAME_FRIEND_CATEGORY` / `RenameFriendCategoryEvent` |
| Remove category | `RemoveFriendCategoryComposer(categoryId)` | `RemoveFriendCategoryEvent` | `REMOVE_FRIEND_CATEGORY` / `RemoveFriendCategoryEvent` |
| Assign friend → category | `MoveFriendToCategoryComposer(friendId, categoryId)` | `MoveFriendToCategoryEvent` | `MOVE_FRIEND_TO_CATEGORY` / `MoveFriendToCategoryEvent` |

The concrete numbers are chosen and verified in **Task 1**.

## File map

**Arcturus (`Arcturus-Morningstar-Extended/Emulator/src/main/java/com/eu/habbo/`):**
- Modify `messages/incoming/Incoming.java` — 4 new constants
- Modify `messages/PacketManager.java` — 4 `registerHandler` lines
- Modify `habbohotel/messenger/MessengerBuddy.java` — `setCategoryId(int)`
- Modify `habbohotel/users/HabboInfo.java` — `renameMessengerCategory(int, String)`
- Create `messages/incoming/friends/AddFriendCategoryEvent.java`
- Create `messages/incoming/friends/RenameFriendCategoryEvent.java`
- Create `messages/incoming/friends/RemoveFriendCategoryEvent.java`
- Create `messages/incoming/friends/MoveFriendToCategoryEvent.java`

**Renderer (`Nitro_Render_V3/packages/communication/src/`):**
- Modify `messages/outgoing/OutgoingHeader.ts` — 4 constants
- Modify `NitroMessages.ts` — imports + 4 `_composers.set`
- Modify `messages/outgoing/friendlist/index.ts` — 4 exports
- Create `messages/outgoing/friendlist/AddFriendCategoryComposer.ts`
- Create `messages/outgoing/friendlist/RenameFriendCategoryComposer.ts`
- Create `messages/outgoing/friendlist/RemoveFriendCategoryComposer.ts`
- Create `messages/outgoing/friendlist/MoveFriendToCategoryComposer.ts`
- Create `messages/outgoing/friendlist/__tests__/FriendCategoryComposers.test.ts`

**Client (`Nitro-V3/src/`):**
- Create `api/friends/friendCategory.helpers.ts` + `.test.ts`
- Modify `api/friends/index.ts` — export helper
- Modify `hooks/friends/useFriends.ts` — 4 actions + composer imports
- Modify `components/friends/views/friends-list/FriendsListView.tsx` — chip row + filter
- Create `components/friends/views/friends-list/FriendsListGroupChipsView.tsx` — chip filter row
- Create `components/friends/views/friends-list/FriendsCategoryManagerView.tsx` — create/rename/delete modal
- Modify `components/friends/views/friends-list/friends-list-group/FriendsListGroupItemView.tsx` — assign control
- Modify `css/friends/FriendsView.css` — chip + manager + assign styles

---

## Task 1: Allocate & verify the 4 category header IDs

**Files:** none yet (decision + verification only).

- [ ] **Step 1: Try official IDs, then pick verified-free fallbacks**

The user prefers official Habbo revision IDs for category packets. First check whether the connecting revision shipped friend-category management packets:

Run (renderer): `grep -rin "categor" Nitro_Render_V3/packages/communication/src/messages/outgoing/OutgoingHeader.ts`
Expected: only `MESSENGER_*` friend headers, **no** add/rename/remove/move-category constant.

If no official category constants are found (expected — the bundled revision's `OutgoingHeader.ts` has none), use the custom fallback quartet **4081, 4082, 4083, 4084** and verify they are free on BOTH sides.

- [ ] **Step 2: Verify the four numbers are unused on both sides**

Run:
```
grep -rnE "= ?408[1-4]\b" Nitro_Render_V3/packages/communication/src/messages/outgoing/OutgoingHeader.ts
grep -rnE "= ?408[1-4]\b" Arcturus-Morningstar-Extended/Emulator/src/main/java/com/eu/habbo/messages/incoming/Incoming.java
```
Expected: **no output** from either command (the IDs are free).

If either prints a match, increment the base (try 4085–4088, etc.) and re-run until both commands return nothing. Record the final quartet here before continuing:

```
ADD_FRIEND_CATEGORY      = 4081
RENAME_FRIEND_CATEGORY   = 4082
REMOVE_FRIEND_CATEGORY   = 4083
MOVE_FRIEND_TO_CATEGORY  = 4084
```

All later tasks reference the **constant names**, so only Tasks 2 and 4 (the constant definitions) carry the raw numbers. If you changed the numbers above, use your values in Tasks 2 and 4.

- [ ] **Step 3: No commit** (decision task — nothing changed on disk yet).

---

## Task 2: Renderer — 4 outgoing composers + registration + test

**Files:**
- Create: `Nitro_Render_V3/packages/communication/src/messages/outgoing/friendlist/AddFriendCategoryComposer.ts`
- Create: `Nitro_Render_V3/packages/communication/src/messages/outgoing/friendlist/RenameFriendCategoryComposer.ts`
- Create: `Nitro_Render_V3/packages/communication/src/messages/outgoing/friendlist/RemoveFriendCategoryComposer.ts`
- Create: `Nitro_Render_V3/packages/communication/src/messages/outgoing/friendlist/MoveFriendToCategoryComposer.ts`
- Modify: `Nitro_Render_V3/packages/communication/src/messages/outgoing/OutgoingHeader.ts`
- Modify: `Nitro_Render_V3/packages/communication/src/messages/outgoing/friendlist/index.ts`
- Modify: `Nitro_Render_V3/packages/communication/src/NitroMessages.ts`
- Test: `Nitro_Render_V3/packages/communication/src/messages/outgoing/friendlist/__tests__/FriendCategoryComposers.test.ts`

- [ ] **Step 1: Write the failing test**

Create `__tests__/FriendCategoryComposers.test.ts`:
```typescript
import { describe, expect, it } from 'vitest';
import { AddFriendCategoryComposer } from '../AddFriendCategoryComposer';
import { RenameFriendCategoryComposer } from '../RenameFriendCategoryComposer';
import { RemoveFriendCategoryComposer } from '../RemoveFriendCategoryComposer';
import { MoveFriendToCategoryComposer } from '../MoveFriendToCategoryComposer';

describe('friend category composers', () =>
{
    it('AddFriendCategoryComposer carries the name', () =>
    {
        expect(new AddFriendCategoryComposer('Best friends').getMessageArray()).toEqual([ 'Best friends' ]);
    });

    it('RenameFriendCategoryComposer carries id + name', () =>
    {
        expect(new RenameFriendCategoryComposer(5, 'Staff').getMessageArray()).toEqual([ 5, 'Staff' ]);
    });

    it('RemoveFriendCategoryComposer carries the id', () =>
    {
        expect(new RemoveFriendCategoryComposer(7).getMessageArray()).toEqual([ 7 ]);
    });

    it('MoveFriendToCategoryComposer carries friendId + categoryId', () =>
    {
        expect(new MoveFriendToCategoryComposer(42, 3).getMessageArray()).toEqual([ 42, 3 ]);
    });
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `cd Nitro_Render_V3 && yarn test --run packages/communication/src/messages/outgoing/friendlist/__tests__/FriendCategoryComposers.test.ts`
Expected: FAIL — cannot find module `../AddFriendCategoryComposer` (files not created yet).

- [ ] **Step 3: Create the four composers**

`AddFriendCategoryComposer.ts`:
```typescript
import { IMessageComposer } from '@nitrots/api';

export class AddFriendCategoryComposer implements IMessageComposer<ConstructorParameters<typeof AddFriendCategoryComposer>>
{
    private _data: ConstructorParameters<typeof AddFriendCategoryComposer>;

    constructor(name: string)
    {
        this._data = [ name ];
    }

    public getMessageArray()
    {
        return this._data;
    }

    public dispose(): void
    {
        return;
    }
}
```

`RenameFriendCategoryComposer.ts`:
```typescript
import { IMessageComposer } from '@nitrots/api';

export class RenameFriendCategoryComposer implements IMessageComposer<ConstructorParameters<typeof RenameFriendCategoryComposer>>
{
    private _data: ConstructorParameters<typeof RenameFriendCategoryComposer>;

    constructor(categoryId: number, name: string)
    {
        this._data = [ categoryId, name ];
    }

    public getMessageArray()
    {
        return this._data;
    }

    public dispose(): void
    {
        return;
    }
}
```

`RemoveFriendCategoryComposer.ts`:
```typescript
import { IMessageComposer } from '@nitrots/api';

export class RemoveFriendCategoryComposer implements IMessageComposer<ConstructorParameters<typeof RemoveFriendCategoryComposer>>
{
    private _data: ConstructorParameters<typeof RemoveFriendCategoryComposer>;

    constructor(categoryId: number)
    {
        this._data = [ categoryId ];
    }

    public getMessageArray()
    {
        return this._data;
    }

    public dispose(): void
    {
        return;
    }
}
```

`MoveFriendToCategoryComposer.ts`:
```typescript
import { IMessageComposer } from '@nitrots/api';

export class MoveFriendToCategoryComposer implements IMessageComposer<ConstructorParameters<typeof MoveFriendToCategoryComposer>>
{
    private _data: ConstructorParameters<typeof MoveFriendToCategoryComposer>;

    constructor(friendId: number, categoryId: number)
    {
        this._data = [ friendId, categoryId ];
    }

    public getMessageArray()
    {
        return this._data;
    }

    public dispose(): void
    {
        return;
    }
}
```

- [ ] **Step 4: Run the test to confirm it passes**

Run: `cd Nitro_Render_V3 && yarn test --run packages/communication/src/messages/outgoing/friendlist/__tests__/FriendCategoryComposers.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Add the four header constants**

In `OutgoingHeader.ts`, next to the other friend headers (after `public static FRIEND_LIST_UPDATE = 1419;`), add (use your Task 1 numbers):
```typescript
public static ADD_FRIEND_CATEGORY = 4081;
public static RENAME_FRIEND_CATEGORY = 4082;
public static REMOVE_FRIEND_CATEGORY = 4083;
public static MOVE_FRIEND_TO_CATEGORY = 4084;
```

- [ ] **Step 6: Export the composers from the friendlist barrel**

In `messages/outgoing/friendlist/index.ts`, add:
```typescript
export * from './AddFriendCategoryComposer';
export * from './MoveFriendToCategoryComposer';
export * from './RemoveFriendCategoryComposer';
export * from './RenameFriendCategoryComposer';
```

- [ ] **Step 7: Register the composers in NitroMessages**

First find how friendlist composers are imported in `NitroMessages.ts`:
Run: `grep -n "SendMessageComposer" Nitro_Render_V3/packages/communication/src/NitroMessages.ts`
This shows both the import line and the `_composers.set(...)` line.

Add the four classes to that same import statement (the one that imports `SendMessageComposer`, `SetRelationshipStatusComposer`, etc.). Then, next to `this._composers.set(OutgoingHeader.SET_RELATIONSHIP_STATUS, SetRelationshipStatusComposer);`, add:
```typescript
this._composers.set(OutgoingHeader.ADD_FRIEND_CATEGORY, AddFriendCategoryComposer);
this._composers.set(OutgoingHeader.RENAME_FRIEND_CATEGORY, RenameFriendCategoryComposer);
this._composers.set(OutgoingHeader.REMOVE_FRIEND_CATEGORY, RemoveFriendCategoryComposer);
this._composers.set(OutgoingHeader.MOVE_FRIEND_TO_CATEGORY, MoveFriendToCategoryComposer);
```

- [ ] **Step 8: Type-check + full test run**

Run: `cd Nitro_Render_V3 && yarn compile:fast && yarn test --run`
Expected: compile clean; all tests pass (138 prior + 4 new = 142).

- [ ] **Step 9: Commit**

```bash
cd Nitro_Render_V3
git add packages/communication/src/messages/outgoing/friendlist/ packages/communication/src/messages/outgoing/OutgoingHeader.ts packages/communication/src/NitroMessages.ts
git commit -m "feat(messenger): add friend-category client composers (add/rename/remove/move)"
```

---

## Task 3: Emulator — category persistence helpers

**Files:**
- Modify: `Arcturus-Morningstar-Extended/Emulator/src/main/java/com/eu/habbo/habbohotel/messenger/MessengerBuddy.java`
- Modify: `Arcturus-Morningstar-Extended/Emulator/src/main/java/com/eu/habbo/habbohotel/users/HabboInfo.java`

> The emulator has **no unit-test infrastructure** (confirmed: no `src/test`, no JUnit in `pom.xml`). Verification for Tasks 3–4 is a successful `mvn package` + the manual integration checklist in Task 11.

- [ ] **Step 1: Add `setCategoryId` to MessengerBuddy**

`MessengerBuddy` already has `private int categoryId = 0;`, `private int userOne = 0;` (the owner's id), `this.id` (the friend's id), and `getCategoryId()`. Mirror the existing `setRelation`/`run()` DB idiom. Add after `getCategoryId()` (around line 141):
```java
    public void setCategoryId(int categoryId) {
        this.categoryId = categoryId;

        final int cat = categoryId;
        final int owner = this.userOne;
        final int friend = this.id;

        Emulator.getThreading().run(() -> {
            try (Connection connection = Emulator.getDatabase().getDataSource().getConnection(); PreparedStatement statement = connection.prepareStatement("UPDATE messenger_friendships SET category = ? WHERE user_one_id = ? AND user_two_id = ?")) {
                statement.setInt(1, cat);
                statement.setInt(2, owner);
                statement.setInt(3, friend);
                statement.execute();
            } catch (SQLException e) {
                LOGGER.error("Caught SQL exception", e);
            }
        });
    }
```
(`Connection`, `PreparedStatement`, `SQLException`, `Emulator`, and `LOGGER` are already imported in this file.)

- [ ] **Step 2: Add `renameMessengerCategory` to HabboInfo**

`HabboInfo` already has `loadMessengerCategories()`, `addMessengerCategory(MessengerCategory)` (INSERT + sets generated id), `deleteMessengerCategory(MessengerCategory)` (removes + DELETE via `SqlQueries.update`), and `getMessengerCategories()`. Add a rename helper after `deleteMessengerCategory` (around line 238), reusing the same `SqlQueries.update` idiom:
```java
    public void renameMessengerCategory(int categoryId, String name) {
        for (MessengerCategory category : this.messengerCategories) {
            if (category.getId() == categoryId) {
                category.setName(name);
                break;
            }
        }

        try {
            SqlQueries.update("UPDATE messenger_categories SET name = ? WHERE id = ? AND user_id = ?", name, categoryId, this.id);
        } catch (SqlQueries.DataAccessException e) {
            LOGGER.error("Caught SQL exception", e);
        }
    }
```
(`SqlQueries`, `MessengerCategory`, and `LOGGER` are already imported/available in this file.)

- [ ] **Step 3: Compile**

Run: `cd Arcturus-Morningstar-Extended/Emulator && mvn -q compile`
Expected: BUILD SUCCESS (no compile errors).

- [ ] **Step 4: Commit**

```bash
cd Arcturus-Morningstar-Extended
git add Emulator/src/main/java/com/eu/habbo/habbohotel/messenger/MessengerBuddy.java Emulator/src/main/java/com/eu/habbo/habbohotel/users/HabboInfo.java
git commit -m "feat(messenger): persist friend category assignment + category rename"
```

---

## Task 4: Emulator — 4 incoming handlers + registration

**Files:**
- Create: `Arcturus-Morningstar-Extended/Emulator/src/main/java/com/eu/habbo/messages/incoming/friends/AddFriendCategoryEvent.java`
- Create: `.../friends/RenameFriendCategoryEvent.java`
- Create: `.../friends/RemoveFriendCategoryEvent.java`
- Create: `.../friends/MoveFriendToCategoryEvent.java`
- Modify: `.../messages/incoming/Incoming.java`
- Modify: `.../messages/PacketManager.java`

- [ ] **Step 1: Add the 4 header constants to Incoming.java**

Next to the other friend constants (e.g. after `public static final int InviteFriendsEvent = 1276;`), add (use your Task 1 numbers — must match the renderer):
```java
    public static final int AddFriendCategoryEvent = 4081;
    public static final int RenameFriendCategoryEvent = 4082;
    public static final int RemoveFriendCategoryEvent = 4083;
    public static final int MoveFriendToCategoryEvent = 4084;
```

- [ ] **Step 2: Create AddFriendCategoryEvent**

Caps: ≤ 20 categories/user, name 1–25 chars, case-insensitive de-dupe. Persists via the existing `HabboInfo.addMessengerCategory` (which sets the generated id), then re-pushes the category list with the existing `MessengerInitComposer`.
```java
package com.eu.habbo.messages.incoming.friends;

import com.eu.habbo.habbohotel.messenger.MessengerCategory;
import com.eu.habbo.habbohotel.users.Habbo;
import com.eu.habbo.messages.incoming.MessageHandler;
import com.eu.habbo.messages.outgoing.friends.MessengerInitComposer;

public class AddFriendCategoryEvent extends MessageHandler {
    @Override
    public void handle() throws Exception {
        String name = this.packet.readString();
        Habbo habbo = this.client.getHabbo();

        if (habbo == null || name == null) return;

        name = name.trim();
        if (name.isEmpty() || name.length() > 25) return;
        if (habbo.getHabboInfo().getMessengerCategories().size() >= 20) return;

        for (MessengerCategory existing : habbo.getHabboInfo().getMessengerCategories()) {
            if (existing.getName().equalsIgnoreCase(name)) return;
        }

        MessengerCategory category = new MessengerCategory(name, habbo.getHabboInfo().getId(), 0);
        habbo.getHabboInfo().addMessengerCategory(category);

        this.client.sendResponse(new MessengerInitComposer(habbo));
    }
}
```

- [ ] **Step 3: Create RenameFriendCategoryEvent**

```java
package com.eu.habbo.messages.incoming.friends;

import com.eu.habbo.habbohotel.messenger.MessengerCategory;
import com.eu.habbo.habbohotel.users.Habbo;
import com.eu.habbo.messages.incoming.MessageHandler;
import com.eu.habbo.messages.outgoing.friends.MessengerInitComposer;

public class RenameFriendCategoryEvent extends MessageHandler {
    @Override
    public void handle() throws Exception {
        int categoryId = this.packet.readInt();
        String name = this.packet.readString();
        Habbo habbo = this.client.getHabbo();

        if (habbo == null || name == null) return;

        name = name.trim();
        if (name.isEmpty() || name.length() > 25) return;

        boolean found = false;
        for (MessengerCategory category : habbo.getHabboInfo().getMessengerCategories()) {
            if (category.getId() == categoryId) {
                found = true;
                break;
            }
        }
        if (!found) return;

        habbo.getHabboInfo().renameMessengerCategory(categoryId, name);

        this.client.sendResponse(new MessengerInitComposer(habbo));
    }
}
```

- [ ] **Step 4: Create RemoveFriendCategoryEvent**

Deleting a group resets its members to category `0`, pushing each via the existing `UpdateFriendComposer`, then re-pushes the (now shorter) category list.
```java
package com.eu.habbo.messages.incoming.friends;

import com.eu.habbo.habbohotel.messenger.MessengerBuddy;
import com.eu.habbo.habbohotel.messenger.MessengerCategory;
import com.eu.habbo.habbohotel.users.Habbo;
import com.eu.habbo.messages.incoming.MessageHandler;
import com.eu.habbo.messages.outgoing.friends.MessengerInitComposer;
import com.eu.habbo.messages.outgoing.friends.UpdateFriendComposer;

public class RemoveFriendCategoryEvent extends MessageHandler {
    @Override
    public void handle() throws Exception {
        int categoryId = this.packet.readInt();
        Habbo habbo = this.client.getHabbo();

        if (habbo == null) return;

        MessengerCategory target = null;
        for (MessengerCategory category : habbo.getHabboInfo().getMessengerCategories()) {
            if (category.getId() == categoryId) {
                target = category;
                break;
            }
        }
        if (target == null) return;

        habbo.getHabboInfo().deleteMessengerCategory(target);

        for (MessengerBuddy buddy : habbo.getMessenger().getFriends().values()) {
            if (buddy.getCategoryId() == categoryId) {
                buddy.setCategoryId(0);
                this.client.sendResponse(new UpdateFriendComposer(habbo, buddy, 0));
            }
        }

        this.client.sendResponse(new MessengerInitComposer(habbo));
    }
}
```

- [ ] **Step 5: Create MoveFriendToCategoryEvent**

`categoryId == 0` means "uncategorized"; any other id must be an existing category. Persists via `MessengerBuddy.setCategoryId` and pushes the updated friend via `UpdateFriendComposer`.
```java
package com.eu.habbo.messages.incoming.friends;

import com.eu.habbo.habbohotel.messenger.MessengerBuddy;
import com.eu.habbo.habbohotel.messenger.MessengerCategory;
import com.eu.habbo.habbohotel.users.Habbo;
import com.eu.habbo.messages.incoming.MessageHandler;
import com.eu.habbo.messages.outgoing.friends.UpdateFriendComposer;

public class MoveFriendToCategoryEvent extends MessageHandler {
    @Override
    public void handle() throws Exception {
        int friendId = this.packet.readInt();
        int categoryId = this.packet.readInt();
        Habbo habbo = this.client.getHabbo();

        if (habbo == null) return;

        MessengerBuddy buddy = habbo.getMessenger().getFriends().get(friendId);
        if (buddy == null) return;

        if (categoryId != 0) {
            boolean exists = false;
            for (MessengerCategory category : habbo.getHabboInfo().getMessengerCategories()) {
                if (category.getId() == categoryId) {
                    exists = true;
                    break;
                }
            }
            if (!exists) return;
        }

        buddy.setCategoryId(categoryId);
        this.client.sendResponse(new UpdateFriendComposer(habbo, buddy, 0));
    }
}
```

- [ ] **Step 6: Register the 4 handlers**

In `PacketManager.java`, inside `registerFriends()`, add:
```java
        this.registerHandler(Incoming.AddFriendCategoryEvent, AddFriendCategoryEvent.class);
        this.registerHandler(Incoming.RenameFriendCategoryEvent, RenameFriendCategoryEvent.class);
        this.registerHandler(Incoming.RemoveFriendCategoryEvent, RemoveFriendCategoryEvent.class);
        this.registerHandler(Incoming.MoveFriendToCategoryEvent, MoveFriendToCategoryEvent.class);
```
Then add the four imports near the other `com.eu.habbo.messages.incoming.friends.*` imports at the top of the file:
```java
import com.eu.habbo.messages.incoming.friends.AddFriendCategoryEvent;
import com.eu.habbo.messages.incoming.friends.RenameFriendCategoryEvent;
import com.eu.habbo.messages.incoming.friends.RemoveFriendCategoryEvent;
import com.eu.habbo.messages.incoming.friends.MoveFriendToCategoryEvent;
```
(If `PacketManager.java` already uses a wildcard `import com.eu.habbo.messages.incoming.friends.*;`, skip the explicit imports — check with `grep -n "incoming.friends" PacketManager.java` first.)

- [ ] **Step 7: Build the fat jar**

Run: `cd Arcturus-Morningstar-Extended/Emulator && mvn -q clean package -DskipTests`
Expected: BUILD SUCCESS; jar produced under `target/`. A failure here most likely means a duplicate header (the `registerHandler` guard throws `Header already registered`) — return to Task 1 and pick different free IDs.

- [ ] **Step 8: Commit**

```bash
cd Arcturus-Morningstar-Extended
git add Emulator/src/main/java/com/eu/habbo/messages/incoming/friends/ Emulator/src/main/java/com/eu/habbo/messages/incoming/Incoming.java Emulator/src/main/java/com/eu/habbo/messages/PacketManager.java
git commit -m "feat(messenger): friend-category CRUD + assign packet handlers"
```

---

## Task 5: Client — pure group-filter helper (TDD)

**Files:**
- Create: `Nitro-V3/src/api/friends/friendCategory.helpers.ts`
- Test: `Nitro-V3/src/api/friends/friendCategory.helpers.test.ts`
- Modify: `Nitro-V3/src/api/friends/index.ts`

- [ ] **Step 1: Write the failing test**

`friendCategory.helpers.test.ts`:
```typescript
import { describe, expect, it } from 'vitest';
import { MessengerFriend } from './MessengerFriend';
import { countFriendsByCategory, filterFriendsByCategory } from './friendCategory.helpers';

const makeFriend = (id: number, categoryId: number): MessengerFriend =>
{
    const friend = new MessengerFriend();
    friend.id = id;
    friend.categoryId = categoryId;
    return friend;
};

describe('filterFriendsByCategory', () =>
{
    const friends = [ makeFriend(1, 0), makeFriend(2, 5), makeFriend(3, 5), makeFriend(4, 8) ];

    it('returns all friends when categoryId is 0 (All)', () =>
    {
        expect(filterFriendsByCategory(friends, 0)).toHaveLength(4);
    });

    it('returns only the friends in the given category', () =>
    {
        expect(filterFriendsByCategory(friends, 5).map(f => f.id)).toEqual([ 2, 3 ]);
    });

    it('returns an empty array for a category with no members', () =>
    {
        expect(filterFriendsByCategory(friends, 99)).toEqual([]);
    });

    it('is null-safe', () =>
    {
        expect(filterFriendsByCategory(null, 5)).toEqual([]);
    });
});

describe('countFriendsByCategory', () =>
{
    const friends = [ makeFriend(1, 0), makeFriend(2, 5), makeFriend(3, 5) ];

    it('counts members per category id', () =>
    {
        const counts = countFriendsByCategory(friends);
        expect(counts.get(0)).toBe(1);
        expect(counts.get(5)).toBe(2);
    });

    it('is null-safe', () =>
    {
        expect(countFriendsByCategory(null).size).toBe(0);
    });
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `cd Nitro-V3 && yarn test --run src/api/friends/friendCategory.helpers.test.ts`
Expected: FAIL — cannot resolve `./friendCategory.helpers`.

- [ ] **Step 3: Implement the helper**

`friendCategory.helpers.ts`:
```typescript
import { MessengerFriend } from './MessengerFriend';

/**
 * Filter a friend list to a single category. categoryId 0 means
 * "All" (no filtering) and returns the list unchanged.
 */
export const filterFriendsByCategory = (friends: MessengerFriend[], categoryId: number): MessengerFriend[] =>
{
    if(!friends) return [];

    if(!categoryId) return friends;

    return friends.filter(friend => (friend.categoryId === categoryId));
};

/**
 * Count how many friends belong to each category id. Used to render
 * member counts on the group chips.
 */
export const countFriendsByCategory = (friends: MessengerFriend[]): Map<number, number> =>
{
    const counts = new Map<number, number>();

    if(!friends) return counts;

    for(const friend of friends)
    {
        counts.set(friend.categoryId, (counts.get(friend.categoryId) ?? 0) + 1);
    }

    return counts;
};
```

- [ ] **Step 4: Run the test to confirm it passes**

Run: `cd Nitro-V3 && yarn test --run src/api/friends/friendCategory.helpers.test.ts`
Expected: PASS (6 cases).

- [ ] **Step 5: Export from the friends api barrel**

In `src/api/friends/index.ts`, add:
```typescript
export * from './friendCategory.helpers';
```

- [ ] **Step 6: Commit**

```bash
cd Nitro-V3
git add src/api/friends/friendCategory.helpers.ts src/api/friends/friendCategory.helpers.test.ts src/api/friends/index.ts
git -c user.name=simoleo89 -c user.email=simoleo89@users.noreply.github.com commit -m "feat(friends): pure category filter + count helpers"
```

---

## Task 6: Client — category CRUD + assign actions in the friends store

**Files:**
- Modify: `Nitro-V3/src/hooks/friends/useFriends.ts`

The store re-pushes authoritative state through the server (the existing `MessengerInitEvent` handler updates `settings.categories`; `FriendListUpdateEvent` updates each friend's `categoryId`), so these actions are thin send-wrappers — no optimistic local mutation.

- [ ] **Step 1: Import the new composers**

In the top import from `@nitrots/nitro-renderer` in `useFriends.ts`, add `AddFriendCategoryComposer`, `MoveFriendToCategoryComposer`, `RemoveFriendCategoryComposer`, `RenameFriendCategoryComposer` to the named-import list.

- [ ] **Step 2: Add the four actions inside `useFriendsStore`**

Add alongside `followFriend` / `updateRelationship` (around line 42), before the `return`:
```typescript
    const addCategory = (name: string) =>
    {
        const trimmed = (name ?? '').trim();

        if(!trimmed.length || (trimmed.length > 25)) return;

        SendMessageComposer(new AddFriendCategoryComposer(trimmed));
    };

    const renameCategory = (categoryId: number, name: string) =>
    {
        const trimmed = (name ?? '').trim();

        if(!categoryId || !trimmed.length || (trimmed.length > 25)) return;

        SendMessageComposer(new RenameFriendCategoryComposer(categoryId, trimmed));
    };

    const removeCategory = (categoryId: number) =>
    {
        if(!categoryId) return;

        SendMessageComposer(new RemoveFriendCategoryComposer(categoryId));
    };

    const moveFriendToCategory = (friendId: number, categoryId: number) =>
    {
        if(!friendId) return;

        SendMessageComposer(new MoveFriendToCategoryComposer(friendId, categoryId));
    };
```

- [ ] **Step 3: Expose them from the store return**

In `useFriendsStore`'s `return { ... }` add: `addCategory, renameCategory, removeCategory, moveFriendToCategory`.

- [ ] **Step 4: Expose them via `useFriendsActions`**

In the `useFriendsActions` destructure-from-`useBetween` AND its `return`, add the four names so consumers can pull them:
```typescript
export const useFriendsActions = () =>
{
    const {
        requestFriend,
        requestResponse,
        followFriend,
        updateRelationship,
        addCategory,
        renameCategory,
        removeCategory,
        moveFriendToCategory
    } = useBetween(useFriendsStore);

    return {
        requestFriend,
        requestResponse,
        followFriend,
        updateRelationship,
        addCategory,
        renameCategory,
        removeCategory,
        moveFriendToCategory
    };
};
```
(The deprecated `useFriends` shim returns the whole store, so it picks these up automatically.)

- [ ] **Step 5: Type-check + full test run**

Run: `cd Nitro-V3 && yarn typecheck && yarn test --run`
Expected: typecheck clean; all tests pass (no regressions).

- [ ] **Step 6: Commit**

```bash
cd Nitro-V3
git add src/hooks/friends/useFriends.ts
git -c user.name=simoleo89 -c user.email=simoleo89@users.noreply.github.com commit -m "feat(friends): category CRUD + assign actions in friends store"
```

---

## Task 7: Client — group chip-filter row

**Files:**
- Create: `Nitro-V3/src/components/friends/views/friends-list/FriendsListGroupChipsView.tsx`
- Modify: `Nitro-V3/src/components/friends/views/friends-list/FriendsListView.tsx`

- [ ] **Step 1: Create the chip row component**

It renders an "All" chip plus one chip per category (with member count), and a gear button to open the manager (wired in Task 8). It is a controlled component: parent owns `selectedCategoryId`.
```tsx
import { FC } from 'react';
import { FriendCategoryData } from '@nitrots/nitro-renderer';
import { countFriendsByCategory, LocalizeText, MessengerFriend } from '../../../../api';
import { Flex } from '../../../../common';

interface FriendsListGroupChipsViewProps
{
    categories: FriendCategoryData[];
    friends: MessengerFriend[];
    selectedCategoryId: number;
    setSelectedCategoryId: (id: number) => void;
    onManageClick: () => void;
}

export const FriendsListGroupChipsView: FC<FriendsListGroupChipsViewProps> = props =>
{
    const { categories = [], friends = [], selectedCategoryId = 0, setSelectedCategoryId = null, onManageClick = null } = props;

    const counts = countFriendsByCategory(friends);

    return (
        <Flex alignItems="center" className="friends-group-chips px-2 py-1" gap={ 1 }>
            <Flex alignItems="center" className="friends-group-chips-scroll" gap={ 1 }>
                <div className={ `friends-group-chip${ (selectedCategoryId === 0) ? ' active' : '' }` } onClick={ () => setSelectedCategoryId(0) }>
                    { LocalizeText('friendlist.friends') } ({ friends.length })
                </div>
                { categories.map(category => (
                    <div key={ category.id } className={ `friends-group-chip${ (selectedCategoryId === category.id) ? ' active' : '' }` } onClick={ () => setSelectedCategoryId(category.id) }>
                        { category.name } ({ counts.get(category.id) ?? 0 })
                    </div>
                )) }
            </Flex>
            <div className="friends-group-chip friends-group-chip-manage ms-auto" title={ LocalizeText('friendlist.friends') } onClick={ onManageClick }>
                ⚙
            </div>
        </Flex>
    );
};
```
(If `Flex` is not exported from `../../../../common`, check the import other friends views use — `FriendsListView.tsx` already imports `Flex`, `Button` from `../../../../common`; match that path.)

- [ ] **Step 2: Wire the chip row + filtering into FriendsListView**

In `FriendsListView.tsx`:
1. Add imports:
```tsx
import { useState } from 'react';
import { filterFriendsByCategory } from '../../../../api';
import { FriendsListGroupChipsView } from './FriendsListGroupChipsView';
import { FriendsCategoryManagerView } from './FriendsCategoryManagerView';
```
(`useState` may already be imported — merge into the existing react import. `FriendsCategoryManagerView` is created in Task 8; this import is fine to add now and will resolve after Task 8.)

2. Pull `settings` from the friends state hook used in this component (it already destructures from `useFriendsState`/`useFriends`). Ensure `settings` (and `friends` for the unfiltered counts) are in scope:
```tsx
const { onlineFriends, offlineFriends, requests, settings, friends } = useFriendsState();
```
(Adjust to match the existing hook call in this file — keep whatever names it already destructures and add `settings` + `friends`.)

3. Add local UI state near the other `useState` calls:
```tsx
const [ selectedCategoryId, setSelectedCategoryId ] = useState<number>(0);
const [ showCategoryManager, setShowCategoryManager ] = useState<boolean>(false);

const categories = settings?.categories ?? [];
const filteredOnlineFriends = filterFriendsByCategory(onlineFriends, selectedCategoryId);
const filteredOfflineFriends = filterFriendsByCategory(offlineFriends, selectedCategoryId);
```

4. Insert the chip row directly under `<NitroCardContentView ...>` (before the `<NitroCardAccordionView>`):
```tsx
<FriendsListGroupChipsView
    categories={ categories }
    friends={ friends }
    selectedCategoryId={ selectedCategoryId }
    setSelectedCategoryId={ setSelectedCategoryId }
    onManageClick={ () => setShowCategoryManager(true) } />
```

5. Replace every reference to `onlineFriends` / `offlineFriends` that feeds the **rendered list and counts** with the filtered versions (six edits):
   - online section header count: `(${ filteredOnlineFriends.length })`
   - online `select_all` toolbar: map/every over `filteredOnlineFriends`
   - online `<FriendsListGroupView list={ filteredOnlineFriends } ... />`
   - offline section header count: `(${ filteredOfflineFriends.length })`
   - offline `select_all` toolbar: map/every over `filteredOfflineFriends`
   - offline `<FriendsListGroupView list={ filteredOfflineFriends } ... />`

   (Leave the unfiltered `friends` for the chip counts and `onlineFriends`/`offlineFriends` references that are NOT about the rendered sections, if any.)

6. Render the manager modal at the end of the returned fragment (next to the existing `showRoomInvite` / `showRemoveFriendsConfirmation` blocks):
```tsx
{ showCategoryManager &&
    <FriendsCategoryManagerView categories={ categories } onCloseClick={ () => setShowCategoryManager(false) } /> }
```

- [ ] **Step 3: Type-check**

Run: `cd Nitro-V3 && yarn typecheck`
Expected: clean (a TS2307 for `FriendsCategoryManagerView` is acceptable here only until Task 8 lands; if you implement Task 8 next there should be no errors). If you want a green checkpoint now, temporarily comment the manager import + render block, then restore in Task 8.

- [ ] **Step 4: Commit**

```bash
cd Nitro-V3
git add src/components/friends/views/friends-list/FriendsListGroupChipsView.tsx src/components/friends/views/friends-list/FriendsListView.tsx
git -c user.name=simoleo89 -c user.email=simoleo89@users.noreply.github.com commit -m "feat(friends): group chip-filter row over online/offline list"
```

---

## Task 8: Client — category manager (create / rename / delete)

**Files:**
- Create: `Nitro-V3/src/components/friends/views/friends-list/FriendsCategoryManagerView.tsx`

- [ ] **Step 1: Create the manager modal**

A small `NitroCardView` with an add-input and a list of categories, each with inline rename + delete. Uses `useFriendsActions`.
```tsx
import { FC, useState } from 'react';
import { FriendCategoryData } from '@nitrots/nitro-renderer';
import { LocalizeText } from '../../../../api';
import { Button, Column, Flex, NitroCardContentView, NitroCardHeaderView, NitroCardView } from '../../../../common';
import { useFriendsActions } from '../../../../hooks';

interface FriendsCategoryManagerViewProps
{
    categories: FriendCategoryData[];
    onCloseClick: () => void;
}

export const FriendsCategoryManagerView: FC<FriendsCategoryManagerViewProps> = props =>
{
    const { categories = [], onCloseClick = null } = props;
    const { addCategory, renameCategory, removeCategory } = useFriendsActions();
    const [ newName, setNewName ] = useState<string>('');
    const [ editingId, setEditingId ] = useState<number>(0);
    const [ editingName, setEditingName ] = useState<string>('');

    const submitAdd = () =>
    {
        const trimmed = newName.trim();

        if(!trimmed.length) return;

        addCategory(trimmed);
        setNewName('');
    };

    const submitRename = () =>
    {
        const trimmed = editingName.trim();

        if(editingId && trimmed.length) renameCategory(editingId, trimmed);

        setEditingId(0);
        setEditingName('');
    };

    return (
        <NitroCardView className="nitro-friends-category-manager" theme="primary-slim" uniqueKey="nitro-friends-category-manager">
            <NitroCardHeaderView headerText={ LocalizeText('friendlist.friends') } onCloseClick={ onCloseClick } />
            <NitroCardContentView className="text-black" gap={ 1 }>
                <Flex gap={ 1 }>
                    <input className="form-control form-control-sm" maxLength={ 25 } placeholder={ LocalizeText('friendlist.friends') } type="text" value={ newName } onChange={ event => setNewName(event.target.value) } onKeyDown={ event => (event.key === 'Enter') && submitAdd() } />
                    <Button disabled={ !newName.trim().length || (categories.length >= 20) } onClick={ submitAdd }>{ LocalizeText('generic.create') }</Button>
                </Flex>
                <Column gap={ 1 } overflow="auto">
                    { categories.map(category => (
                        <Flex key={ category.id } alignItems="center" gap={ 1 }>
                            { (editingId === category.id) ?
                                <>
                                    <input autoFocus className="form-control form-control-sm" maxLength={ 25 } type="text" value={ editingName } onChange={ event => setEditingName(event.target.value) } onKeyDown={ event => (event.key === 'Enter') && submitRename() } />
                                    <Button onClick={ submitRename }>{ LocalizeText('generic.save') }</Button>
                                </>
                                :
                                <>
                                    <span className="flex-grow-1">{ category.name }</span>
                                    <div className="nitro-friends-spritesheet icon-edit cursor-pointer" title={ LocalizeText('generic.edit') } onClick={ () => { setEditingId(category.id); setEditingName(category.name); } } />
                                    <div className="nitro-friends-spritesheet icon-deselect cursor-pointer" title={ LocalizeText('generic.delete') } onClick={ () => removeCategory(category.id) } />
                                </> }
                        </Flex>
                    )) }
                    { !categories.length &&
                        <span className="text-muted text-center py-2">{ LocalizeText('friendlist.friends.offlinecaption') }</span> }
                </Column>
            </NitroCardContentView>
        </NitroCardView>
    );
};
```

> **Verify imports against the codebase.** `Column`, `Flex`, `Button`, and the `NitroCard*` components come from `../../../../common`; confirm the exact set with `grep -n "from '../../../../common'" src/components/friends/views/friends-list/FriendsListView.tsx`. The localization keys above (`generic.create` / `generic.save` / `generic.edit` / `generic.delete`) are placeholders for whatever your locale files already define — if a key renders raw, swap it for an existing one or add it to the locale JSON. The `icon-edit` / `icon-deselect` spritesheet classes: reuse whatever exists in `FriendsView.css`; if absent, use a plain text label ("✎" / "✕") instead.

- [ ] **Step 2: Type-check + test**

Run: `cd Nitro-V3 && yarn typecheck && yarn test --run`
Expected: clean; tests green. (If you commented the manager wiring in Task 7 Step 3, restore it now.)

- [ ] **Step 3: Commit**

```bash
cd Nitro-V3
git add src/components/friends/views/friends-list/FriendsCategoryManagerView.tsx src/components/friends/views/friends-list/FriendsListView.tsx
git -c user.name=simoleo89 -c user.email=simoleo89@users.noreply.github.com commit -m "feat(friends): create/rename/delete group manager"
```

---

## Task 9: Client — per-friend "assign to group" control

**Files:**
- Modify: `Nitro-V3/src/components/friends/views/friends-list/friends-list-group/FriendsListGroupItemView.tsx`

- [ ] **Step 1: Add categories + action to the component**

At the top of the component body, pull categories from state and the move action from actions:
```tsx
import { useFriendsActions, useFriendsState } from '../../../../../hooks';
```
(Match the existing relative depth — this file is one level deeper than `FriendsListView.tsx`, so it's `../../../../../hooks`; confirm with the file's existing imports.)

Inside the component:
```tsx
const { settings } = useFriendsState();
const { moveFriendToCategory } = useFriendsActions();
const [ isGroupMenuOpen, setIsGroupMenuOpen ] = useState<boolean>(false);
const categories = settings?.categories ?? [];
```
(`useState` is likely already imported; if not, add it.)

- [ ] **Step 2: Add the assign control to the actions row**

In the `friends-list-actions` div (currently the follow / chat / relationship icons), add — only when the friend is a real user (`friend.id > 0`) and at least one category exists — a group icon that toggles a small menu:
```tsx
{ (friend.id > 0) && (categories.length > 0) &&
    <div className="friends-list-group-assign position-relative">
        <div className="nitro-friends-spritesheet icon-group cursor-pointer" title={ LocalizeText('friendlist.friends') } onClick={ () => setIsGroupMenuOpen(prev => !prev) } />
        { isGroupMenuOpen &&
            <div className="friends-list-group-menu">
                <div className={ `friends-list-group-menu-item${ (friend.categoryId === 0) ? ' active' : '' }` } onClick={ () => { moveFriendToCategory(friend.id, 0); setIsGroupMenuOpen(false); } }>
                    { LocalizeText('friendlist.friends') }
                </div>
                { categories.map(category => (
                    <div key={ category.id } className={ `friends-list-group-menu-item${ (friend.categoryId === category.id) ? ' active' : '' }` } onClick={ () => { moveFriendToCategory(friend.id, category.id); setIsGroupMenuOpen(false); } }>
                        { category.name }
                    </div>
                )) }
            </div> }
    </div> }
```
(Reuse an existing spritesheet class for `icon-group` if one fits, or fall back to a text glyph. The "uncategorized" entry uses `friend.categoryId === 0`.)

- [ ] **Step 3: Type-check + test**

Run: `cd Nitro-V3 && yarn typecheck && yarn test --run`
Expected: clean; tests green.

- [ ] **Step 4: Commit**

```bash
cd Nitro-V3
git add src/components/friends/views/friends-list/friends-list-group/FriendsListGroupItemView.tsx
git -c user.name=simoleo89 -c user.email=simoleo89@users.noreply.github.com commit -m "feat(friends): per-friend assign-to-group control"
```

---

## Task 10: Client — styles for chips, manager, assign menu

**Files:**
- Modify: `Nitro-V3/src/css/friends/FriendsView.css`

- [ ] **Step 1: Append styles**

Match the existing palette in this file (grays `#f3f3ef`/`#e6e6e6`, accent blue `#bfe7f6`, `#111` text). Append:
```css
.friends-group-chips { border-bottom: 1px solid #e6e6e6; }
.friends-group-chips-scroll { overflow-x: auto; flex-wrap: nowrap; }
.friends-group-chips-scroll::-webkit-scrollbar { height: 4px; }
.friends-group-chip {
    flex: 0 0 auto;
    padding: 1px 8px;
    border: 1px solid #d0d0c8;
    border-radius: 10px;
    background: #f3f3ef;
    font-size: 11px;
    line-height: 16px;
    white-space: nowrap;
    cursor: pointer;
    user-select: none;
}
.friends-group-chip.active { background: #bfe7f6; border-color: #7fb9d6; }
.friends-group-chip-manage { padding: 1px 6px; }

.nitro-friends-category-manager { width: 280px; }

.friends-list-group-assign { display: inline-flex; }
.friends-list-group-menu {
    position: absolute;
    right: 0;
    top: 100%;
    z-index: 20;
    min-width: 120px;
    max-height: 180px;
    overflow-y: auto;
    background: #fff;
    border: 1px solid #c0c0b8;
    border-radius: 4px;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}
.friends-list-group-menu-item {
    padding: 3px 8px;
    font-size: 11px;
    cursor: pointer;
    white-space: nowrap;
}
.friends-list-group-menu-item:hover { background: #efefef; }
.friends-list-group-menu-item.active { background: #bfe7f6; }
```

- [ ] **Step 2: Visual sanity (build only)**

Run: `cd Nitro-V3 && yarn typecheck`
Expected: clean (CSS isn't type-checked, but confirm nothing else broke).

- [ ] **Step 3: Commit**

```bash
cd Nitro-V3
git add src/css/friends/FriendsView.css
git -c user.name=simoleo89 -c user.email=simoleo89@users.noreply.github.com commit -m "style(friends): group chips, category manager, assign menu"
```

---

## Task 11: Integration verification (two live sessions)

**Files:** none (manual verification + final checks). Fix-up commits only if something fails.

- [ ] **Step 1: Apply the DB-side prerequisite check**

The `messenger_categories` and `messenger_friendships.category` schema already exist (verified). Confirm against the running DB:
```
SELECT COUNT(*) FROM messenger_categories;
SHOW COLUMNS FROM messenger_friendships LIKE 'category';
```
(Per house rules, if a destructive statement is ever needed, hand the user a one-liner to run under `E:\laragon\bin\mysql\...` — but nothing destructive is required here.)

- [ ] **Step 2: Run the new emulator jar + client dev server**

- Emulator: run the jar built in Task 4 (`java -jar Arcturus-Morningstar-Extended/Emulator/target/Habbo-*-jar-with-dependencies.jar`).
- Client: `cd Nitro-V3 && yarn start` (Vite picks up the renderer source live — no renderer build needed).

- [ ] **Step 3: Manual test matrix (log in, open Friends)**

Verify each:
1. **Create group:** open the manager (⚙), type a name, Create → a new chip appears (server re-pushed `MessengerInit`).
2. **Rename group:** edit a category name → chip label updates after round-trip.
3. **Delete group:** delete a category → chip disappears; any friend that was in it shows as uncategorized (its assign menu no longer marks that group active).
4. **Assign friend:** open a friend's group menu, pick a group → switch the chip filter to that group and confirm the friend appears there; switch to "All" and confirm they still appear once.
5. **Filter:** click each chip → only that group's friends show in both Online and Offline sections; counts in headers match; "All" shows everyone.
6. **Caps:** creating a 21st group is rejected (Create disabled at 20); a >25-char name is truncated by `maxLength`/server.
7. **Persistence:** relog → groups and assignments survive (DB-backed).
8. **No regressions:** follow, chat, relationship icons, requests, search, room-invite, remove-friend still work.

- [ ] **Step 4: Final automated checks**

Run:
```
cd Nitro_Render_V3 && yarn compile:fast && yarn test --run
cd Nitro-V3 && yarn typecheck && yarn test --run && yarn eslint
cd Arcturus-Morningstar-Extended/Emulator && mvn -q clean package -DskipTests
```
Expected: renderer tests green (142), client tests green (existing + 6 new helper cases), client typecheck + eslint clean, emulator BUILD SUCCESS.

- [ ] **Step 5: Commit any fix-ups**

```bash
# only if Step 3/4 required changes
cd Nitro-V3
git -c user.name=simoleo89 -c user.email=simoleo89@users.noreply.github.com commit -am "fix(friends): integration fixes for friend groups"
```

---

## Notes for the next phase

- Phase 2 (offline messages) reuses the same `FriendChatMessageComposer` replay path — no new packets — and the `messenger_offline` table that already exists.
- Phases 3–4 (read receipts, typing) will add custom packets following the same renderer-composer/Arcturus-handler pattern proven here, plus a new server→client event+parser (mirror `NewConsoleMessageEvent`/`NewConsoleMessageParser`) which this phase did not need.
- Do NOT push automatically (the auto-push rule is scoped to the react19 branches only). Open PRs against the correct base per the duckietm `--base dev`/`Dev` convention when the user asks.
