# Furni editor — furnidata editing UI + typography refresh (Client/Renderer) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`).

**Goal:** Expose the server-side furnidata name/description editing (Plan A, already on Arcturus `main`) in the React furni editor: make Classname/Public Name read-only, add an editable **Furnidata** section (Display Name + Description) with diff-confirm + revert, search by furnidata name, and refresh the editor's typography/colors to the theme tokens.

**Architecture:** Renderer (`Nitro_Render_V3`) gains 2 outgoing composers matching the server's incoming headers (update **10046**, revert **10048**); the success result reuses the existing `FurniEditorResult` (10044) and live propagation reuses the merged `FurnitureDataReload` (10047). Client (`Nitro-V3`) adds hook actions + UI. A small server tweak lets search match furnidata display names.

**Tech Stack:** React 19 + Vite + TailwindCSS 4 (theme tokens in `tailwind.config.js`), TS, Vitest (client); TS/PixiJS (renderer); Java/Maven (server tweak). Server feature already built (Plan A).

**Companion:** spec `Arcturus-Morningstar-Extended/docs/superpowers/specs/2026-06-06-furni-editor-furnidata-names-design.md`; server plan `…/plans/2026-06-06-furni-editor-furnidata-names-server.md`. Exploration of the client (exact file:line) is in this session's history — follow the cited patterns.

**Server header contract (already on Arcturus main):** incoming `FurniEditorUpdateFurnidataEvent = 10046` reads `int itemId` + `String` (JSON `{name,description}`); incoming `FurniEditorRevertFurnidataEvent = 10048` reads `int itemId`; both respond with `FurniEditorResultComposer` (10044) and broadcast `FurnitureDataReloadComposer` (10047).

---

## Task 1 (renderer): outgoing composers + headers

**Files (in `E:\Users\simol\Desktop\DEV\Nitro_Render_V3\packages\communication\src\messages`):**
- Modify: `outgoing/OutgoingHeader.ts` (after `FURNI_EDITOR_DELETE = 10045`, ~line 505)
- Create: `outgoing/furnieditor/FurniEditorUpdateFurnidataComposer.ts`
- Create: `outgoing/furnieditor/FurniEditorRevertFurnidataComposer.ts`
- Modify: the furnieditor `index.ts` barrel (same folder as the existing furni-editor composers)

- [ ] **Step 1: Add headers** in `OutgoingHeader.ts`:
```ts
    public static readonly FURNI_EDITOR_UPDATE_FURNIDATA = 10046;
    public static readonly FURNI_EDITOR_REVERT_FURNIDATA = 10048;
```
(Match the real declaration style in that file — `public static readonly NAME: number = id;` or the enum/const pattern actually used. Verify 10046/10048 are unused in OutgoingHeader.)

- [ ] **Step 2: Create `FurniEditorUpdateFurnidataComposer.ts`** (mirror the existing `FurniEditorUpdateComposer` in the same folder):
```ts
import { IMessageComposer } from '../../../../api';
import { OutgoingHeader } from '../OutgoingHeader';

export class FurniEditorUpdateFurnidataComposer implements IMessageComposer<ConstructorParameters<typeof FurniEditorUpdateFurnidataComposer>>
{
    private _data: ConstructorParameters<typeof FurniEditorUpdateFurnidataComposer>;

    constructor(itemId: number, jsonFields: string)
    {
        this._data = [ itemId, jsonFields ];
    }

    public getMessageArray() { return this._data; }
    public dispose() { this._data = null; }
    public getHeader() { return OutgoingHeader.FURNI_EDITOR_UPDATE_FURNIDATA; }
}
```
**Before writing, open the real `FurniEditorUpdateComposer.ts`** and copy its EXACT structure/imports (the `IMessageComposer` import path + the `getMessageArray/getHeader/dispose` shape may differ from the above; match it verbatim, only changing the header constant and that the payload is `[itemId, jsonFields]`).

- [ ] **Step 3: Create `FurniEditorRevertFurnidataComposer.ts`** — same pattern, constructor `(itemId: number)`, payload `[ itemId ]`, header `FURNI_EDITOR_REVERT_FURNIDATA`.

- [ ] **Step 4: Export both** from the furnieditor composers `index.ts` barrel (add the two `export * from './FurniEditor...Composer';` lines next to the existing furni-editor composer exports).

- [ ] **Step 5: Build** — `cd E:\Users\simol\Desktop\DEV\Nitro_Render_V3 && yarn compile:fast` (or the real compile script in package.json). Expected: clean, no TS errors.

- [ ] **Step 6: Commit** (renderer repo):
```
git -C "E:/Users/simol/Desktop/DEV/Nitro_Render_V3" add packages/communication/src/messages/outgoing/OutgoingHeader.ts packages/communication/src/messages/outgoing/furnieditor/
git -C "E:/Users/simol/Desktop/DEV/Nitro_Render_V3" commit -m "feat(furnieditor): outgoing composers for furnidata update (10046) + revert (10048)"
```
NO `Co-Authored-By` trailer.

---

## Task 2 (client): hook actions

**Files:** Modify `E:\Users\simol\Desktop\DEV\Nitro-V3\src\hooks\furni-editor\useFurniEditor.ts`

- [ ] **Step 1: Parse furnidata name/desc into state.** Where the detail handler parses `furniDataJson` into `furniDataEntry` (lines ~140–152), also derive convenience strings. The `furniDataEntry` is `Record<string,unknown>` with `name`/`description` keys. No new state needed — the EditView will read `furniDataEntry?.name`/`furniDataEntry?.description`. (No change required here if the EditView reads `furniDataEntry`; otherwise expose `furniDataName`/`furniDataDescription` strings. Choose the minimal path — prefer reading `furniDataEntry` directly in the view.)

- [ ] **Step 2: Add actions.** Mirror `updateItem` (lines ~233–239). Add inside the hook body and to the return object (lines ~254–259):
```ts
const updateFurnidata = useCallback((id: number, name: string, description: string) =>
{
    pendingActionRef.current = { type: 'update', id };
    setLoading(true);
    SendMessageComposer(new FurniEditorUpdateFurnidataComposer(id, JSON.stringify({ name, description })));
}, []);

const revertFurnidata = useCallback((id: number) =>
{
    pendingActionRef.current = { type: 'update', id };
    setLoading(true);
    SendMessageComposer(new FurniEditorRevertFurnidataComposer(id));
}, []);
```
Use the REAL send-composer helper this hook already uses (the exploration shows `updateItem` sends `new FurniEditorUpdateComposer(...)` — copy its exact send mechanism, whether `SendMessageComposer(...)` or a local `send`). Import the two new composers from `@nitrots/nitro-renderer`. Reusing `pendingActionRef.type='update'` makes the existing `FurniEditorResultEvent` success handler (lines ~162–210) auto-reload the detail — which is what we want after a furnidata write.

- [ ] **Step 3: Export** `updateFurnidata`, `revertFurnidata` in the hook's return object.

- [ ] **Step 4: Typecheck** — `cd E:\Users\simol\Desktop\DEV\Nitro-V3 && yarn typecheck`. Expected: no new errors (pre-existing renderer-SDK TS2307 in a sandbox without the renderer are acceptable, but here the renderer IS present so it should be clean for these files).

- [ ] **Step 5: Commit:**
```
git -C "E:/Users/simol/Desktop/DEV/Nitro-V3" add src/hooks/furni-editor/useFurniEditor.ts
git -C "E:/Users/simol/Desktop/DEV/Nitro-V3" commit -m "feat(furni-editor): updateFurnidata/revertFurnidata hook actions"
```
NO `Co-Authored-By`.

---

## Task 3 (client): EditView — read-only classname/public_name + editable Furnidata section + props

**Files:** Modify `src\components\furni-editor\views\FurniEditorEditView.tsx` and `src\components\furni-editor\FurniEditorView.tsx`.

- [ ] **Step 1: Thread props.** In `FurniEditorEditViewProps` add `onUpdateFurnidata: (id: number, name: string, description: string) => void;` and `onRevertFurnidata: (id: number) => void;`. In `FurniEditorView.tsx` (where `<FurniEditorEditView ... onUpdate=... onDelete=... />` is rendered, ~lines 149–158), pass `onUpdateFurnidata={ updateFurnidata }` and `onRevertFurnidata={ revertFurnidata }` (destructure them from `useFurniEditor()`).

- [ ] **Step 2: Make Classname + Public Name read-only.** In the Basic Info section (lines ~232–256): replace the **Item Name** `<input>` with a read-only display, relabel to **"Classname"**, and render the value in monospace on a muted background (see Task 4 classes). Same for **Public Name** (label it "Public Name (DB fallback)"). Use a shared `readonlyClass` (Task 4). Keep `form.itemName`/`form.publicName` in state (so `updateItem` still sends unchanged values harmlessly) but do NOT let them be edited. Example:
```tsx
<div>
  <label className={ labelClass }>Classname</label>
  <div className={ readonlyClass }>{ form.itemName }</div>
</div>
<div>
  <label className={ labelClass }>Public Name (DB fallback)</label>
  <div className={ readonlyClass }>{ form.publicName }</div>
</div>
```

- [ ] **Step 3: New editable Furnidata section.** Replace the read-only `FurniData.json` section (lines ~323–334) with:
```tsx
<Section title="Furnidata (display name)" defaultOpen={ true }>
  <Column gap={ 1 }>
    <div>
      <label className={ labelClass }>Display Name</label>
      <input className={ inputClass() } value={ furniName } onChange={ e => setFurniName(e.target.value) } maxLength={ 256 } />
    </div>
    <div>
      <label className={ labelClass }>Description</label>
      <textarea className={ inputClass() } rows={ 3 } value={ furniDescription } onChange={ e => setFurniDescription(e.target.value) } maxLength={ 256 } />
    </div>
    { (furniName !== (String(furniDataEntry?.name ?? '')) || furniDescription !== (String(furniDataEntry?.description ?? ''))) &&
      <span className="text-[10px] text-orange-500 font-bold">Unsaved furnidata changes</span> }
    <Flex gap={ 1 }>
      <Button variant="success" disabled={ loading } onClick={ () => setConfirmFurnidata(true) }>Save name/desc</Button>
      <Button variant="secondary" disabled={ loading } onClick={ () => onRevertFurnidata(item.id) }>Revert</Button>
    </Flex>
  </Column>
</Section>
```
Add local state near the other state (lines ~71–91): `const [furniName, setFurniName] = useState('');` `const [furniDescription, setFurniDescription] = useState('');` `const [confirmFurnidata, setConfirmFurnidata] = useState(false);` and seed `furniName`/`furniDescription` from `furniDataEntry?.name`/`?.description` (falling back to `item.publicName`/`item.description`) in the same `useEffect` that syncs `form` (lines ~95–122), re-running when `furniDataEntry` changes.

- [ ] **Step 4: Diff + confirm modal** (mirrors the existing Delete-confirm modal, lines ~353–368). When `confirmFurnidata`, show a small modal listing old → new:
```tsx
{ confirmFurnidata &&
  <div className="...overlay classes copied from the delete modal...">
    <div className="...panel classes...">
      <Text bold>Apply furnidata change to ALL clients?</Text>
      <div className="text-xs"><b>Name:</b> { String(furniDataEntry?.name ?? '') } → { furniName }</div>
      <div className="text-xs"><b>Desc:</b> { String(furniDataEntry?.description ?? '') } → { furniDescription }</div>
      <Flex gap={ 1 }>
        <Button variant="success" onClick={ () => { onUpdateFurnidata(item.id, furniName, furniDescription); setConfirmFurnidata(false); } }>Confirm</Button>
        <Button variant="secondary" onClick={ () => setConfirmFurnidata(false) }>Cancel</Button>
      </Flex>
    </div>
  </div> }
```
Copy the exact overlay/panel Tailwind classes from the existing delete-confirmation modal so it looks identical.

- [ ] **Step 5: Typecheck + manual render.** `cd Nitro-V3 && yarn typecheck` (clean). With `yarn start` running, open the editor on a furni: Classname/Public Name show read-only (monospace, muted), the Furnidata section shows the real display name from furnidata, editing + Save shows the confirm modal, Confirm sends the composer.

- [ ] **Step 6: Commit:**
```
git -C "E:/Users/simol/Desktop/DEV/Nitro-V3" add src/components/furni-editor/views/FurniEditorEditView.tsx src/components/furni-editor/FurniEditorView.tsx
git -C "E:/Users/simol/Desktop/DEV/Nitro-V3" commit -m "feat(furni-editor): editable furnidata name/desc section + read-only classname/public_name + diff-confirm + revert"
```
NO `Co-Authored-By`.

---

## Task 4 (client): typography / color refresh (theme tokens)

The chosen direction: replace scattered hardcoded hex with theme tokens, restyle labels for hierarchy, bump input font + focus ring, and render read-only/technical values in monospace on a muted bg.

**Files:** `FurniEditorEditView.tsx` (the in-file helper class strings).

- [ ] **Step 1: Update the helper class strings** near lines ~209–211:
```ts
// inputs: bump xs→sm, add focus ring using the theme primary token
const inputClass = (field?: string) =>
  `w-full px-2 py-1 text-sm leading-normal rounded-sm border border-[#bbb] focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/40 min-h-[calc(1.5em+0.5rem+2px)]${ field && errors[field] ? ' border-red-500 bg-red-50' : '' }`;
// labels: stronger hierarchy — uppercase, tracked, secondary token
const labelClass = 'text-[10px] font-bold text-secondary uppercase tracking-wider mb-0.5 flex items-center gap-0.5';
// read-only / technical values: monospace on muted bg, clearly "locked"
const readonlyClass = 'w-full px-2 py-1 text-sm font-mono rounded-sm border border-[#ddd] bg-[#f2f2eb] text-[#555] select-all';
```
(Match the real existing `inputClass` signature/`errors` variable name; only change the class string + add `readonlyClass`. `text-secondary`/`focus:ring-primary` resolve via `tailwind.config.js` tokens `secondary=#185D79`, `primary=#1E7295`.)

- [ ] **Step 2: Section titles** — they already use `<Text small bold variant="primary">` (theme `#1E7295`). Leave as-is (already token-aligned) OR, if a stronger separator is wanted, add `border-b border-[#e3e3da] pb-1` to the section header row. Keep minimal.

- [ ] **Step 3: Apply `font-mono` to technical inline values** already covered by `readonlyClass` (Classname/Public Name from Task 3). Also render the header `ID: {id} | Sprite: {spriteId}` (line ~223) in `font-mono text-[#555]` for consistency.

- [ ] **Step 4: Typecheck + visual check** — `yarn typecheck` clean; with `yarn start`, confirm labels are now uppercase secondary-tinted, inputs larger with a focus ring, classname/public-name monospace on muted bg.

- [ ] **Step 5: Commit:**
```
git -C "E:/Users/simol/Desktop/DEV/Nitro-V3" add src/components/furni-editor/views/FurniEditorEditView.tsx
git -C "E:/Users/simol/Desktop/DEV/Nitro-V3" commit -m "style(furni-editor): theme-token typography refresh (labels, inputs focus ring, mono read-only)"
```
NO `Co-Authored-By`.

---

## Task 5 (server): search also matches furnidata display name

Lets the Search box find furni by their real (furnidata) name, not just `item_name`/`public_name`.

**Files (Arcturus):** Modify `Emulator/.../messages/incoming/furnieditor/FurniEditorSearchEvent.java`.

- [ ] **Step 1:** Read the existing `FurniEditorSearchEvent.handle()` (it queries `items_base` by `item_name`/`public_name` LIKE the query). After collecting the DB matches, also scan the in-memory furnidata index for display-name matches and union their item ids:
   - Get the provider: `FurnitureTextProvider p = Emulator.getGameEnvironment().getFurnitureTextProvider();`
   - The provider currently exposes `getName(classname)` but not a name→classnames search. Add a method to `FurnitureTextProvider`: `public java.util.List<String> findClassnamesByName(String q)` that lowercases `q` and returns classnames whose indexed name contains it (iterate the `index` map values; cap results e.g. 200). Then map those classnames → `items_base.id` via a `SELECT id FROM items_base WHERE item_name IN (...)` and merge with the existing result rows (dedupe by id, keep the existing result row shape).
   - Keep it bounded (cap added rows) and behind the same `ACC_CATALOGFURNI` gate.

- [ ] **Step 2: Build** `cd Emulator && mvn -q compile` → SUCCESS.

- [ ] **Step 3: Commit** (Arcturus repo, `main`):
```
git -C "E:/Users/simol/Desktop/DEV/Arcturus-Morningstar-Extended" add Emulator/src/main/java/com/eu/habbo/messages/incoming/furnieditor/FurniEditorSearchEvent.java Emulator/src/main/java/com/eu/habbo/habbohotel/items/FurnitureTextProvider.java
git -C "E:/Users/simol/Desktop/DEV/Arcturus-Morningstar-Extended" commit -m "feat(furnieditor): search also matches furnidata display names"
```
NO `Co-Authored-By`. (This task is optional/last — if it balloons, ship Tasks 1–4 first.)

---

## Task 6: final build/verify

- [ ] Renderer: `cd Nitro_Render_V3 && yarn compile:fast` clean.
- [ ] Client: `cd Nitro-V3 && yarn typecheck && yarn test --run` green (pre-existing unrelated failures noted, not introduced).
- [ ] Server (if Task 5 done): `cd Emulator && mvn -q package -DskipTests=false` SUCCESS; deploy jar to `Latest_Compiled_Version` + restart for manual end-to-end.
- [ ] Manual acceptance: edit a furni's display name in the editor → confirm modal → live update in catalog/inventory/infostand without refresh; Revert restores; Classname/Public Name read-only; search by display name finds it; audit row written.

## Self-review
- Spec §5 coverage: editable furnidata name/desc (T3), read-only classname/public_name (T3), diff+confirm (T3), revert (T2/T3), live-preview/dirty (T3), search-by-name (T5), typography (T4), composers/headers matching server (T1). ✓
- Header consistency: client outgoing 10046/10048 == server incoming 10046/10048; result via 10044; live via 10047. ✓
- Types: `updateFurnidata(id,name,description)`, `revertFurnidata(id)`, `onUpdateFurnidata`/`onRevertFurnidata` props, `readonlyClass` — consistent across T2/T3/T4.
- Open: confirm the real renderer composer import path + send helper (T1/T2) and the real `inputClass`/`errors` names (T4) by reading the files first.
