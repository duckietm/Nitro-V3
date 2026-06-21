import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { initialState } from '../state/reducer';
import { FloorplanImportExport } from './FloorplanImportExport';

describe('FloorplanImportExport', () => {
    afterEach(() => cleanup());
    it('shows serialized tilemap of current state in textarea', () => {
        const state = {
            ...initialState,
            tiles: [
                [
                    { h: 0, blocked: false },
                    { h: 1, blocked: false }
                ],
                [
                    { h: 0, blocked: true },
                    { h: 2, blocked: false }
                ]
            ]
        };
        render(<FloorplanImportExport state={state} dispatch={() => {}} onClose={() => {}} onSaveFromText={() => {}} onRevertText={() => ''} />);
        const ta = document.querySelector('textarea') as HTMLTextAreaElement;
        expect(ta).toBeTruthy();
        expect(ta.value).toBe('01\nx2');
    });

    it('clicking Load dispatches IMPORT_STRING with textarea content', () => {
        const dispatch = vi.fn();
        render(<FloorplanImportExport state={initialState} dispatch={dispatch} onClose={() => {}} onSaveFromText={() => {}} onRevertText={() => ''} />);
        const ta = document.querySelector('textarea') as HTMLTextAreaElement;
        expect(ta).toBeTruthy();
        fireEvent.change(ta, { target: { value: 'xq\n00' } });
        const button = document.querySelector('[data-testid="import-load"]') as HTMLButtonElement;
        expect(button).toBeTruthy();
        fireEvent.click(button);
        expect(dispatch).toHaveBeenCalledWith({ type: 'IMPORT_STRING', raw: 'xq\n00', source: 'local' });
    });

    it('clicking Save invokes onSaveFromText with textarea content', () => {
        const onSaveFromText = vi.fn();
        render(<FloorplanImportExport state={initialState} dispatch={() => {}} onClose={() => {}} onSaveFromText={onSaveFromText} onRevertText={() => ''} />);
        const ta = document.querySelector('textarea') as HTMLTextAreaElement;
        fireEvent.change(ta, { target: { value: '00\n01' } });
        const saveBtn = document.querySelector('[data-testid="import-save"]') as HTMLButtonElement;
        fireEvent.click(saveBtn);
        expect(onSaveFromText).toHaveBeenCalledWith('00\n01');
    });
});
