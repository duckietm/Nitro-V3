# Sync `public_name` from furnidata (Furni Editor) — design

**Date:** 2026-06-14
**Repo:** `ui` (Octane-UI React client) — client-only
**Status:** approved (brainstorming)

## Problem

In the Furni Editor, the **"Public Name (DB fallback)"** field is `items_base.public_name`. When a furni has a furnidata entry with a display `name` but its DB `public_name` is empty, the two are out of sync. The 10046 edit/create handler already mirrors the furnidata name into `public_name` going forward (step "5b"), but **existing** furni that were never edited via the new editor keep an empty `public_name`. We want a per-furni manual way to fill the empty DB field from the present furnidata name.

## Scope (decided)

- **Per-furni**, inside the editor (not bulk).
- **Manual** trigger (a button), not automatic-on-open.
- Direction: `items_base.public_name` ← `furnidata.name` (only when DB is empty).

## Approach (A — chosen)

Reuse the existing generic item-update path. No new packet, **no server change**.

- The server `FurniEditorUpdateEvent` already runs `UPDATE items_base SET <fields> WHERE id` and `public_name` is in `ALLOWED_UPDATE_FIELDS`.
- The client already has the `update` action (`FurniEditorUpdateComposer`) whose 10044 success handler shows the "Item updated successfully" toast and re-fetches the detail.

Rejected: (B) dedicated sync packet/handler — needs a new packet + renderer registration + emulator rebuild/restart (Codex active); overkill. (C) re-trigger 10046 — gated on "dirty" and would broadcast an unnecessary 10047.

## Components (2 files, client only)

1. `src/hooks/furni-editor/useFurniEditor.ts`
   - Add `syncPublicName(id: number, name: string)`: sets `pendingActionRef = { action: 'update', itemId: id }` and sends `FurniEditorUpdateComposer(id, JSON.stringify({ publicName: name }))`. Sets `loading`. Export it from the hook.
   - Reuses the existing `FurniEditorResultEvent` (10044) handler: on success → "Item updated successfully" + re-fetch detail; on failure → existing alert + re-fetch revert.

2. `src/components/furni-editor/views/FurniEditorEditView.tsx`
   - Add a small **"Sync from furnidata"** button next to the read-only "Public Name (DB fallback)" field (Basic Info section).
   - Thread `onSyncPublicName` through props from the parent that wires the hook (same place `onUpdateFurnidata` etc. are wired).

## Button visibility (all three true)

1. `furnidataEditable` — entry exists AND classname matches (never sync a mismatched classname's name).
2. DB empty: `!String(item.publicName ?? '').trim()`.
3. furnidata name present: `!!String(furniDataEntry?.name ?? '').trim()`.

Disabled while `loading`. Name synced is the **stored** `furniDataEntry.name`, not the editable `furniName` state (avoid syncing an unsaved edit).

## Data flow

click → `syncPublicName(item.id, furniDataEntry.name)` → `FurniEditorUpdateComposer({ publicName })` → server `UPDATE items_base.public_name` → 10044 success → toast + detail re-fetch → field shows the name, button condition no longer met → button disappears.

## Error handling

Inherited from the existing 10044 failure path (alert with server message + detail re-fetch to revert). No new handling needed.

## Testing

- Primary: runtime verification via Claude-in-Chrome — pick a furni with empty `public_name` + a furnidata name (Search list shows DB-empty rows with the 🎵 placeholder), click "Sync from furnidata", confirm the wire (10045/`update` → 10044 success), the DB field now shows the name, and the button disappears. Confirm `items_base.public_name` updated in the DB.
- Optional unit test: `syncPublicName` sends the right composer payload; visibility predicate.

## Branch

Commit on the active `feat/furni-editor-create-missing` branch (related furni-editor work) unless a separate PR is preferred. Client-only; no renderer/emulator change.
