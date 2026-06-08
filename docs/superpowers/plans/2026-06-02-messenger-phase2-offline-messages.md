# Messenger Phase 2 — Offline Messages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Messages sent to an offline friend are stored and delivered on the recipient's next login, tagged "sent while offline".

**Architecture:** No new packets. The emulator stores send-to-offline in the existing `messenger_offline` table; on login it replays them through the existing `FriendChatMessageComposer` (extended with an optional `extraData` marker) so the client's existing `NewConsoleMessageEvent` path renders them. The client adds an `offlineDelivered` flag (derived from `extraData === "offline"`) and a subtle marker in the thread.

**Tech Stack:** Arcturus (Java 21/Maven/HikariCP), Nitro-V3 (React 19, Vite, Vitest). No renderer change.

---

## Branches
All repos are already on `feat/messenger-groups-receipts` (continuing the messenger initiative). Continue committing there. Client commits use the house-rule author override `git -c user.name=simoleo89 -c user.email=simoleo89@users.noreply.github.com`. No Co-Authored-By / AI attribution anywhere.

## Pre-flight: how messages flow today (read once)
- `FriendPrivateMessageEvent` (incoming) → `buddy.onMessageReceived(sender, message)` which delivers via `FriendChatMessageComposer` ONLY if the recipient is online (else the message is silently dropped — that's the gap we close).
- On login the client sends `MessengerInitComposer` → emulator `RequestInitFriendsEvent` sends `MessengerInitComposer` + the friend list.
- `FriendChatMessageComposer.composeInternal()` appends: `toId` (the sender id shown to the recipient), message text, `secondsSinceSent` (= now − message.timestamp). For group chat (`toId < 0`) it appends an extra `name/look/id` string. For 1:1 it appends nothing after `secondsSinceSent`.
- Client: `useMessenger` subscribes to `NewConsoleMessageEvent` and calls `sendMessage(thread, parser.senderId, parser.messageText, parser.secondsSinceSent, parser.extraData)`, which stores `extraData` on the created `MessengerThreadChat`.
- `messenger_offline` columns (verified): `id` (PK auto), `user_id` (recipient), `user_from_id` (sender), `message` varchar(500), `sended_on` int (unix).

## File map
**Emulator (`Arcturus-Morningstar-Extended/Emulator/src/main/java/com/eu/habbo/`):**
- Modify `habbohotel/messenger/Message.java` — add a `(fromId, toId, message, timestamp)` constructor.
- Modify `messages/outgoing/friends/FriendChatMessageComposer.java` — optional `extraData` appended for 1:1.
- Modify `habbohotel/messenger/Messenger.java` — `addOfflineMessage(...)` + `deliverOfflineMessages(...)` + cap constant.
- Modify `messages/incoming/friends/FriendPrivateMessageEvent.java` — branch online vs offline.
- Modify `messages/incoming/friends/RequestInitFriendsEvent.java` — deliver offline on login.

**Client (`Nitro-V3/src/`):**
- Modify `api/friends/MessengerThreadChat.ts` — `offlineDelivered` getter.
- Create `api/friends/MessengerThreadChat.test.ts` — getter test.
- Modify `components/friends/views/messenger/messenger-thread/FriendsMessengerThreadGroup.tsx` — render marker.
- Modify `public/configuration/UITexts.example` — add `messenger.offline.delivered` text key.
- Modify a messenger CSS file — `.messenger-offline-tag` style.

---

## Task 1: Emulator — `Message` timestamp constructor + composer `extraData`

**Files:**
- Modify: `Emulator/src/main/java/com/eu/habbo/habbohotel/messenger/Message.java`
- Modify: `Emulator/src/main/java/com/eu/habbo/messages/outgoing/friends/FriendChatMessageComposer.java`

> Emulator has no unit tests; verification is `mvn compile`.

- [ ] **Step 1: Add a timestamp constructor to `Message`**

`Message` has `private final int timestamp;` set to `Emulator.getIntUnixTimestamp()` in the existing constructor. Add a second constructor that accepts an explicit timestamp (needed so a replayed offline message reports its original age). Add it right after the existing constructor (after the block ending at the line `this.timestamp = Emulator.getIntUnixTimestamp(); }`):
```java
    public Message(int fromId, int toId, String message, int timestamp) {
        this.fromId = fromId;
        this.toId = toId;
        this.message = message;
        this.timestamp = timestamp;
    }
```

- [ ] **Step 2: Add optional `extraData` to `FriendChatMessageComposer`**

Add an `extraData` field + a 4-arg constructor, and append it for the 1:1 path. Replace the field/constructor region and the `composeInternal` tail.

Add the field next to the existing fields:
```java
    private String extraData = null;
```
Add this constructor after the existing `FriendChatMessageComposer(Message message, int toId, int fromId)`:
```java
    public FriendChatMessageComposer(Message message, int toId, int fromId, String extraData) {
        this.message = message;
        this.toId = toId;
        this.fromId = fromId;
        this.extraData = extraData;
    }
```
In `composeInternal()`, the existing `if (this.toId < 0) { ...group chat... }` block stays. Immediately AFTER that `if` block (before `return this.response;`), add an `else if` so 1:1 messages with a marker append it (online 1:1 messages pass `extraData == null` and append nothing — wire unchanged):
```java
        else if (this.extraData != null) {
            this.response.appendString(this.extraData);
        }
```
The result is:
```java
        if (this.toId < 0) // group chat
        {
            // ... existing group block unchanged ...
            this.response.appendString(name + "/" + look + "/" + this.fromId);
        }
        else if (this.extraData != null) {
            this.response.appendString(this.extraData);
        }

        return this.response;
```

- [ ] **Step 3: Compile**

Run: `cd Arcturus-Morningstar-Extended/Emulator && mvn -q compile`
Expected: BUILD SUCCESS.

- [ ] **Step 4: Commit (only these 2 files)**
```bash
cd Arcturus-Morningstar-Extended
git add Emulator/src/main/java/com/eu/habbo/habbohotel/messenger/Message.java Emulator/src/main/java/com/eu/habbo/messages/outgoing/friends/FriendChatMessageComposer.java
git commit -m "feat(messenger): Message timestamp ctor + optional extraData on chat composer"
```
Verify with `git show --stat HEAD` that ONLY these 2 files are committed (the working tree also has an unrelated `soundboard/SoundboardPlayEvent.java` modification and untracked jars — never stage those).

---

## Task 2: Emulator — offline message store + deliver helpers in `Messenger`

**Files:**
- Modify: `Emulator/src/main/java/com/eu/habbo/habbohotel/messenger/Messenger.java`

`Messenger` already has static DB methods (e.g. `unfriend`) using `Emulator.getDatabase().getDataSource().getConnection()` with try-with-resources, and a `LOGGER`. `Message` and `MessengerCategory` are in the same package (no import needed). You WILL need imports for `java.sql.ResultSet`, `java.util.ArrayList`, `java.util.List`, `com.eu.habbo.habbohotel.gameclients.GameClient`, and `com.eu.habbo.messages.outgoing.friends.FriendChatMessageComposer` — check the existing import block and add whichever are missing.

- [ ] **Step 1: Add the cap constant**

Near the other `Messenger` constants (e.g. by `MAXIMUM_FRIENDS`), add:
```java
    public static final int MAXIMUM_OFFLINE_MESSAGES = 200;
```

- [ ] **Step 2: Add `addOfflineMessage`**

Stores one offline message for `toId`, evicting the oldest if the per-user inbox is at the cap. Add as a static method:
```java
    public static void addOfflineMessage(int fromId, int toId, String message) {
        try (Connection connection = Emulator.getDatabase().getDataSource().getConnection()) {
            try (PreparedStatement count = connection.prepareStatement("SELECT COUNT(*) FROM messenger_offline WHERE user_id = ?")) {
                count.setInt(1, toId);
                try (ResultSet set = count.executeQuery()) {
                    if (set.next() && set.getInt(1) >= MAXIMUM_OFFLINE_MESSAGES) {
                        try (PreparedStatement delete = connection.prepareStatement("DELETE FROM messenger_offline WHERE user_id = ? ORDER BY id ASC LIMIT 1")) {
                            delete.setInt(1, toId);
                            delete.execute();
                        }
                    }
                }
            }

            try (PreparedStatement insert = connection.prepareStatement("INSERT INTO messenger_offline (user_id, user_from_id, message, sended_on) VALUES (?, ?, ?, ?)")) {
                insert.setInt(1, toId);
                insert.setInt(2, fromId);
                insert.setString(3, message);
                insert.setInt(4, Emulator.getIntUnixTimestamp());
                insert.execute();
            }
        } catch (SQLException e) {
            LOGGER.error("Caught SQL exception", e);
        }
    }
```

- [ ] **Step 3: Add `deliverOfflineMessages`**

Loads any stored messages for the logging-in user (oldest first), replays each through `FriendChatMessageComposer` with the `"offline"` marker and the original timestamp, then deletes the delivered rows.
```java
    public static void deliverOfflineMessages(GameClient client) {
        if (client == null || client.getHabbo() == null) return;

        int userId = client.getHabbo().getHabboInfo().getId();
        List<Message> messages = new ArrayList<>();

        try (Connection connection = Emulator.getDatabase().getDataSource().getConnection();
             PreparedStatement statement = connection.prepareStatement("SELECT user_from_id, message, sended_on FROM messenger_offline WHERE user_id = ? ORDER BY sended_on ASC, id ASC")) {
            statement.setInt(1, userId);
            try (ResultSet set = statement.executeQuery()) {
                while (set.next()) {
                    messages.add(new Message(set.getInt("user_from_id"), userId, set.getString("message"), set.getInt("sended_on")));
                }
            }
        } catch (SQLException e) {
            LOGGER.error("Caught SQL exception", e);
        }

        if (messages.isEmpty()) return;

        for (Message message : messages) {
            client.sendResponse(new FriendChatMessageComposer(message, message.getFromId(), message.getFromId(), "offline"));
        }

        try (Connection connection = Emulator.getDatabase().getDataSource().getConnection();
             PreparedStatement statement = connection.prepareStatement("DELETE FROM messenger_offline WHERE user_id = ?")) {
            statement.setInt(1, userId);
            statement.execute();
        } catch (SQLException e) {
            LOGGER.error("Caught SQL exception", e);
        }
    }
```

- [ ] **Step 4: Compile**

Run: `cd Arcturus-Morningstar-Extended/Emulator && mvn -q compile`
Expected: BUILD SUCCESS. If it fails on a missing symbol, add the missing import (see the list at the top of this task).

- [ ] **Step 5: Commit (only Messenger.java)**
```bash
cd Arcturus-Morningstar-Extended
git add Emulator/src/main/java/com/eu/habbo/habbohotel/messenger/Messenger.java
git commit -m "feat(messenger): store + deliver offline messages (capped inbox)"
```

---

## Task 3: Emulator — wire send-to-offline + deliver-on-login

**Files:**
- Modify: `Emulator/src/main/java/com/eu/habbo/messages/incoming/friends/FriendPrivateMessageEvent.java`
- Modify: `Emulator/src/main/java/com/eu/habbo/messages/incoming/friends/RequestInitFriendsEvent.java`

- [ ] **Step 1: Branch online vs offline in `FriendPrivateMessageEvent`**

Currently the handler ends with `buddy.onMessageReceived(this.client.getHabbo(), message);`. Replace that single line with a branch: deliver if the recipient is online, otherwise store (word-filtered, matching the filtering the online path applies before sending). Add imports `com.eu.habbo.habbohotel.messenger.Messenger` and `com.eu.habbo.habbohotel.modtool.WordFilter`.

Replace:
```java
        buddy.onMessageReceived(this.client.getHabbo(), message);
```
with:
```java
        if (Emulator.getGameServer().getGameClientManager().getHabbo(userId) != null) {
            buddy.onMessageReceived(this.client.getHabbo(), message);
        } else {
            String stored = message;
            if (WordFilter.ENABLED_FRIENDCHAT) {
                stored = Emulator.getGameEnvironment().getWordFilter().filter(message, this.client.getHabbo());
            }
            Messenger.addOfflineMessage(this.client.getHabbo().getHabboInfo().getId(), userId, stored);
        }
```
(`Emulator` is already imported in this file. `userId` is the recipient read at the top of `handle()`.)

- [ ] **Step 2: Deliver offline messages on login in `RequestInitFriendsEvent`**

After the existing `this.client.sendResponses(messages);`, add a call to deliver any stored offline messages (sent AFTER the friend list so the client's thread lookup can resolve the sender as a known friend). Add import `com.eu.habbo.habbohotel.messenger.Messenger`.

The method becomes:
```java
    public void handle() throws Exception {
        ArrayList<ServerMessage> messages = new ArrayList<>();
        messages.add(new MessengerInitComposer(this.client.getHabbo()).compose());
        messages.addAll(FriendsComposer.getMessagesForBuddyList(this.client.getHabbo().getMessenger().getFriends().values()));
        this.client.sendResponses(messages);

        Messenger.deliverOfflineMessages(this.client);
    }
```

- [ ] **Step 3: Build the fat jar**

Run: `cd Arcturus-Morningstar-Extended/Emulator && mvn -q clean package -DskipTests`
Expected: BUILD SUCCESS.

- [ ] **Step 4: Commit (only these 2 files)**
```bash
cd Arcturus-Morningstar-Extended
git add Emulator/src/main/java/com/eu/habbo/messages/incoming/friends/FriendPrivateMessageEvent.java Emulator/src/main/java/com/eu/habbo/messages/incoming/friends/RequestInitFriendsEvent.java
git commit -m "feat(messenger): persist messages to offline friends, replay on login"
```
Verify `git show --stat HEAD` shows exactly 2 files.

---

## Task 4: Client — `offlineDelivered` getter on `MessengerThreadChat` (TDD)

**Files:**
- Modify: `Nitro-V3/src/api/friends/MessengerThreadChat.ts`
- Test: `Nitro-V3/src/api/friends/MessengerThreadChat.test.ts`

`MessengerThreadChat` already stores `_extraData` and `_type`, with `CHAT = 0`. The emulator sends `extraData === "offline"` only for replayed 1:1 messages.

- [ ] **Step 1: Write the failing test**

Create `src/api/friends/MessengerThreadChat.test.ts`:
```typescript
import { describe, expect, it } from 'vitest';
import { MessengerThreadChat } from './MessengerThreadChat';

describe('MessengerThreadChat.offlineDelivered', () =>
{
    it('is true for a CHAT message with extraData "offline"', () =>
    {
        const chat = new MessengerThreadChat(5, 'hello', 60, 'offline', MessengerThreadChat.CHAT);
        expect(chat.offlineDelivered).toBe(true);
    });

    it('is false for a normal CHAT message with no extraData', () =>
    {
        const chat = new MessengerThreadChat(5, 'hello', 0, null, MessengerThreadChat.CHAT);
        expect(chat.offlineDelivered).toBe(false);
    });

    it('is false when extraData is some other value (e.g. group chat data)', () =>
    {
        const chat = new MessengerThreadChat(5, 'hi', 0, 'Bob/figurestr/5', MessengerThreadChat.CHAT);
        expect(chat.offlineDelivered).toBe(false);
    });

    it('is false for a non-CHAT type even if extraData is "offline"', () =>
    {
        const chat = new MessengerThreadChat(5, 'hi', 0, 'offline', MessengerThreadChat.ROOM_INVITE);
        expect(chat.offlineDelivered).toBe(false);
    });
});
```

- [ ] **Step 2: Run it, confirm FAIL**

Run: `cd Nitro-V3 && yarn test --run src/api/friends/MessengerThreadChat.test.ts`
Expected: FAIL — `offlineDelivered` is not a function/getter.

- [ ] **Step 3: Add the getter**

In `MessengerThreadChat.ts`, add after the `extraData` getter:
```typescript
    public get offlineDelivered(): boolean
    {
        return (this._type === MessengerThreadChat.CHAT) && (this._extraData === 'offline');
    }
```

- [ ] **Step 4: Run the test, confirm PASS (4 cases).**

- [ ] **Step 5: Type-check + full suite**

Run: `cd Nitro-V3 && yarn typecheck && yarn test --run`
Expected: typecheck shows only the known pre-existing `FloorplanCanvasSVG.tsx(143,20): TS2503`; tests green except the 3 known pre-existing floorplan failures.

- [ ] **Step 6: Commit**
```bash
cd Nitro-V3
git add src/api/friends/MessengerThreadChat.ts src/api/friends/MessengerThreadChat.test.ts
git -c user.name=simoleo89 -c user.email=simoleo89@users.noreply.github.com commit -m "feat(messenger): offlineDelivered flag on thread chat"
```

---

## Task 5: Client — render the "sent while offline" marker

**Files:**
- Modify: `Nitro-V3/src/components/friends/views/messenger/messenger-thread/FriendsMessengerThreadGroup.tsx`
- Modify: `Nitro-V3/public/configuration/UITexts.example`
- Modify: a messenger CSS file (see Step 3)

- [ ] **Step 1: Add the localization key**

In `public/configuration/UITexts.example`, add a key near other `messenger.*` entries (match the file's JSON format — confirm by reading an existing `messenger.` line):
```json
"messenger.offline.delivered": "Sent while you were offline",
```
(The user can localize the value in their live `UITexts` later. `LocalizeText` falls back to the key string if absent, so this never crashes.)

- [ ] **Step 2: Render the marker in the message bubble**

In `FriendsMessengerThreadGroup.tsx`, the bubble maps `group.chats`. `LocalizeText` is already imported. In the NON-translation branch (the `if(!chat.showTranslation)` return), append the marker when `chat.offlineDelivered`. Replace:
```tsx
                        if(!chat.showTranslation)
                        {
                            return <Base key={ index } className="text-break">{ chat.message }</Base>;
                        }
```
with:
```tsx
                        if(!chat.showTranslation)
                        {
                            return (
                                <Base key={ index } className="text-break">
                                    { chat.message }
                                    { chat.offlineDelivered &&
                                        <span className="messenger-offline-tag">{ LocalizeText('messenger.offline.delivered') }</span> }
                                </Base>
                            );
                        }
```
(Leave the translation branch as-is — an offline message that is also auto-translated is a rare combination and the marker on the plain branch covers the normal case.)

- [ ] **Step 3: Add the marker style**

Find the CSS file that styles the messenger thread (search for an existing class used here, e.g. `messenger-message-bubble` or `messenger-message-time`):
Run: `grep -rl "messenger-message-bubble" Nitro-V3/src/css`
Append to that file a subtle style:
```css
.messenger-offline-tag {
    display: block;
    margin-top: 2px;
    font-size: 10px;
    font-style: italic;
    opacity: 0.6;
}
```
If the grep finds no file (the classes are global/elsewhere), append the same rule to `src/css/friends/FriendsView.css` instead, and note that in your report.

- [ ] **Step 4: Type-check + full suite**

Run: `cd Nitro-V3 && yarn typecheck && yarn test --run`
Expected: only the known pre-existing typecheck error; no new test failures.

- [ ] **Step 5: Commit**
```bash
cd Nitro-V3
git add src/components/friends/views/messenger/messenger-thread/FriendsMessengerThreadGroup.tsx public/configuration/UITexts.example
# plus the CSS file you edited:
git add <the css file from Step 3>
git -c user.name=simoleo89 -c user.email=simoleo89@users.noreply.github.com commit -m "feat(messenger): show 'sent while offline' marker in thread"
```

---

## Task 6: Integration verification

**Files:** none (manual + automated checks; fix-up commits only).

- [ ] **Step 1: Automated checks**
```
cd Nitro-V3 && yarn typecheck && yarn test --run
cd Arcturus-Morningstar-Extended/Emulator && mvn -q clean package -DskipTests
```
Expected: client typecheck shows only the pre-existing `FloorplanCanvasSVG.tsx(143,20): TS2503`; client tests green except the 3 known floorplan failures (+4 new MessengerThreadChat cases passing); emulator BUILD SUCCESS. (No renderer change this phase.)

- [ ] **Step 2: Live two-session manual test**

Run the new jar + `yarn start`. With two accounts A and B who are friends:
1. **Store while offline:** B logs out. A opens the messenger thread with B and sends a message. (A's client shows the sent message as normal.)
2. **Deliver on login:** B logs in → the message appears in B's thread with A, carrying the "Sent while you were offline" marker.
3. **Order + multiple:** A sends 3 messages while B is offline → on B's login all 3 appear in order, each marked, and the `messenger_offline` rows for B are gone (delivered + deleted):
   `SELECT * FROM messenger_offline WHERE user_id = <B id>;` → 0 rows after login.
4. **Online still instant:** with both online, messages deliver immediately and show NO offline marker (wire unchanged for online 1:1).
5. **Cap:** (optional) inserting >200 stored messages for one user evicts the oldest.
6. **No regressions:** room invites, group/staff chat, and normal messaging still work.

- [ ] **Step 3: Commit any fix-ups** (only if needed)
```bash
cd Nitro-V3
git -c user.name=simoleo89 -c user.email=simoleo89@users.noreply.github.com commit -am "fix(messenger): offline message integration fixes"
```

---

## Notes / scope boundaries
- **Word filter:** offline messages are word-filtered at store time (sender online) so the recipient sees filtered text, matching the online path. They are NOT written to `chatlogs_private` (offline messages were never chat-logged before; adding that is out of scope).
- **Displayed time:** the thread shows the client receive-time (existing behavior); `secondsSinceSent` is sent but the bubble timestamp is local. The "sent while offline" marker is what signals the message is delayed; back-dating the bubble timestamp is out of scope.
- **Read receipts (Phase 3)** will mark these delivered-on-login messages as read once the recipient opens the thread — not part of Phase 2.
- Do NOT push/merge automatically; the branch already carries Phase 1 + the user's own `feat(chat)` commit.
