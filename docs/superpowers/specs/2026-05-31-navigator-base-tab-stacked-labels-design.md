# Navigator — Room Settings "Base" tab: stacked-label layout

**Date:** 2026-05-31
**Component:** Nitro-V3 client
**File:** `src/components/navigator/views/room-settings/NavigatorRoomSettingsBasicTabView.tsx`
**Type:** Layout-only refactor (no logic / data-flow change)

## Problem

The Base tab uses a horizontal two-column row layout: a fixed-width label on the
left, the control on the right. In the narrow room-settings panel the label column
is too tight, so multi-word Italian labels ("Visitatori massimi", "Impostazioni
scambio") wrap onto two lines and look broken. An earlier fix replaced dead
Bootstrap `col-3` classes with `w-1/4 shrink-0`, which stopped the crushing but
still leaves the labels cramped and occasionally wrapping.

The other five room-settings tabs (Access, Rights, VIP/Chat, Mod, Misc) already use
idiomatic vertical/grouped layouts. Base is the outlier.

## Decision

Adopt the **stacked-label** pattern (chosen from three mockup options — A stacked,
B sectioned cards, C wider label column). Each field becomes a vertical block: bold
label on top, full-width control below, validation message underneath. This mirrors
the sibling **Access** tab's existing `<Column gap={1}>` + `<Text bold>` shape, so
the two tabs become visually consistent and labels can never wrap.

## Layout

Every field → its own `<Column gap={1}>` block:

```tsx
<Column gap={ 1 }>
    <Text bold>{ LocalizeText('navigator.roomname') }</Text>
    <input className="form-control form-control-sm" value={ roomName } … onBlur={ saveRoomName } />
    { (roomName.length < ROOM_NAME_MIN_LENGTH) &&
        <Text bold small variant="danger">{ LocalizeText('navigator.roomsettings.roomnameismandatory') }</Text> }
</Column>
```

Field-by-field:

- **Nome stanza** — stacked block, mandatory-name validation preserved.
- **Descrizione** — stacked block, `<textarea>` full width.
- **Categoria** — stacked block, `<select>` from `categories`.
- **Visitatori massimi** — stacked block, `<select>` from `GetMaxVisitorsList`.
- **Impostazioni scambio** — stacked block, 3-option `<select>`.
- **Tag** — one "Tag" label, then the two tag inputs side-by-side in a
  `<Flex gap={1}>`, each `fullWidth`, each keeping its own length/type validation.
- **allow_walkthrough / allow_underpass** — remain inline `checkbox + label` rows;
  remove the empty `<Base className="w-1/4 shrink-0" />` spacers that only existed
  to align with the old label column.
- **Delete link** — unchanged at the bottom.

## Explicit non-goals

- No change to `handleChange` field names or values.
- No change to validation thresholds (`ROOM_NAME_MIN_LENGTH=3`,
  `ROOM_NAME_MAX_LENGTH=60`, `DESC_MAX_LENGTH=255`, `TAGS_MAX_LENGTH=15`).
- No change to save-on-blur handlers (`saveRoomName`, `saveRoomDescription`,
  `saveTags`), the `RoomSettingsSaveErrorEvent` subscription, or `deleteRoom`.
- No change to field order or any localization key.
- No change to the other five tabs.
- The `w-1/4 shrink-0` utility classes added in the prior fix are removed (labels
  are full-width now).

## Risk

Single-file, JSX-only diff. No test covers this view, so no test impact. Manual
check: open Room Settings → Base, confirm no label wraps, all controls full width,
validation still appears, save-on-blur still fires.
