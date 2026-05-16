import { beforeEach, describe, expect, it } from 'vitest';
import { useWiredCreatorToolsUiStore } from './wiredCreatorToolsUiStore';

const INITIAL = {
    isVisible: false,
    activeTab: 'monitor' as const,
    inspectionType: 'furni' as const,
    variablesType: 'furni' as const,
    isMonitorHistoryOpen: false,
    isMonitorInfoOpen: false,
    isInspectionGiveOpen: false,
    isVariableManageOpen: false,
    isManagedGiveOpen: false,
    monitorHistorySeverityFilter: 'ALL' as const,
    monitorHistoryTypeFilter: 'ALL',
    variableManageTypeFilter: 'ALL',
    variableManageSort: 'highest_value',
    variableManagePage: 1
};

describe('useWiredCreatorToolsUiStore', () =>
{
    beforeEach(() =>
    {
        useWiredCreatorToolsUiStore.setState(INITIAL);
    });

    it('exposes the documented defaults', () =>
    {
        const state = useWiredCreatorToolsUiStore.getState();

        expect(state.isVisible).toBe(false);
        expect(state.activeTab).toBe('monitor');
        expect(state.inspectionType).toBe('furni');
        expect(state.variablesType).toBe('furni');
        expect(state.isMonitorHistoryOpen).toBe(false);
        expect(state.isMonitorInfoOpen).toBe(false);
        expect(state.isInspectionGiveOpen).toBe(false);
        expect(state.isVariableManageOpen).toBe(false);
        expect(state.isManagedGiveOpen).toBe(false);
        expect(state.monitorHistorySeverityFilter).toBe('ALL');
        expect(state.monitorHistoryTypeFilter).toBe('ALL');
        expect(state.variableManageTypeFilter).toBe('ALL');
        expect(state.variableManageSort).toBe('highest_value');
        expect(state.variableManagePage).toBe(1);
    });

    describe('setIsVisible', () =>
    {
        it('accepts a direct boolean', () =>
        {
            useWiredCreatorToolsUiStore.getState().setIsVisible(true);
            expect(useWiredCreatorToolsUiStore.getState().isVisible).toBe(true);
        });

        it('accepts a functional updater (toggle pattern)', () =>
        {
            useWiredCreatorToolsUiStore.getState().setIsVisible(prev => !prev);
            expect(useWiredCreatorToolsUiStore.getState().isVisible).toBe(true);

            useWiredCreatorToolsUiStore.getState().setIsVisible(prev => !prev);
            expect(useWiredCreatorToolsUiStore.getState().isVisible).toBe(false);
        });
    });

    describe('setActiveTab', () =>
    {
        it('switches the active tab', () =>
        {
            useWiredCreatorToolsUiStore.getState().setActiveTab('variables');
            expect(useWiredCreatorToolsUiStore.getState().activeTab).toBe('variables');

            useWiredCreatorToolsUiStore.getState().setActiveTab('inspection');
            expect(useWiredCreatorToolsUiStore.getState().activeTab).toBe('inspection');
        });
    });

    describe('setInspectionType / setVariablesType', () =>
    {
        it('updates the inspection element type', () =>
        {
            useWiredCreatorToolsUiStore.getState().setInspectionType('user');
            expect(useWiredCreatorToolsUiStore.getState().inspectionType).toBe('user');
        });

        it('updates the variables element type (including context)', () =>
        {
            useWiredCreatorToolsUiStore.getState().setVariablesType('context');
            expect(useWiredCreatorToolsUiStore.getState().variablesType).toBe('context');
        });
    });

    describe('modal/popover flags', () =>
    {
        it('setIsMonitorHistoryOpen toggles the history modal flag', () =>
        {
            useWiredCreatorToolsUiStore.getState().setIsMonitorHistoryOpen(true);
            expect(useWiredCreatorToolsUiStore.getState().isMonitorHistoryOpen).toBe(true);

            useWiredCreatorToolsUiStore.getState().setIsMonitorHistoryOpen(false);
            expect(useWiredCreatorToolsUiStore.getState().isMonitorHistoryOpen).toBe(false);
        });

        it('setIsMonitorInfoOpen toggles the info modal flag', () =>
        {
            useWiredCreatorToolsUiStore.getState().setIsMonitorInfoOpen(true);
            expect(useWiredCreatorToolsUiStore.getState().isMonitorInfoOpen).toBe(true);
        });

        it('setIsInspectionGiveOpen accepts a functional updater', () =>
        {
            useWiredCreatorToolsUiStore.getState().setIsInspectionGiveOpen(prev => !prev);
            expect(useWiredCreatorToolsUiStore.getState().isInspectionGiveOpen).toBe(true);

            useWiredCreatorToolsUiStore.getState().setIsInspectionGiveOpen(prev => !prev);
            expect(useWiredCreatorToolsUiStore.getState().isInspectionGiveOpen).toBe(false);
        });

        it('setIsVariableManageOpen takes a direct boolean', () =>
        {
            useWiredCreatorToolsUiStore.getState().setIsVariableManageOpen(true);
            expect(useWiredCreatorToolsUiStore.getState().isVariableManageOpen).toBe(true);
        });

        it('setIsManagedGiveOpen accepts a functional updater', () =>
        {
            useWiredCreatorToolsUiStore.getState().setIsManagedGiveOpen(prev => !prev);
            expect(useWiredCreatorToolsUiStore.getState().isManagedGiveOpen).toBe(true);
        });
    });

    describe('monitor history filters', () =>
    {
        it('setMonitorHistorySeverityFilter narrows to ERROR / WARNING / ALL', () =>
        {
            useWiredCreatorToolsUiStore.getState().setMonitorHistorySeverityFilter('ERROR');
            expect(useWiredCreatorToolsUiStore.getState().monitorHistorySeverityFilter).toBe('ERROR');

            useWiredCreatorToolsUiStore.getState().setMonitorHistorySeverityFilter('WARNING');
            expect(useWiredCreatorToolsUiStore.getState().monitorHistorySeverityFilter).toBe('WARNING');

            useWiredCreatorToolsUiStore.getState().setMonitorHistorySeverityFilter('ALL');
            expect(useWiredCreatorToolsUiStore.getState().monitorHistorySeverityFilter).toBe('ALL');
        });

        it('setMonitorHistoryTypeFilter stores an arbitrary type label', () =>
        {
            useWiredCreatorToolsUiStore.getState().setMonitorHistoryTypeFilter('FurnitureRuntime');
            expect(useWiredCreatorToolsUiStore.getState().monitorHistoryTypeFilter).toBe('FurnitureRuntime');
        });
    });

    describe('variable manage UI', () =>
    {
        it('setVariableManageTypeFilter / setVariableManageSort store string filters', () =>
        {
            useWiredCreatorToolsUiStore.getState().setVariableManageTypeFilter('Number');
            useWiredCreatorToolsUiStore.getState().setVariableManageSort('lowest_value');

            expect(useWiredCreatorToolsUiStore.getState().variableManageTypeFilter).toBe('Number');
            expect(useWiredCreatorToolsUiStore.getState().variableManageSort).toBe('lowest_value');
        });

        it('setVariableManagePage accepts a direct value', () =>
        {
            useWiredCreatorToolsUiStore.getState().setVariableManagePage(4);
            expect(useWiredCreatorToolsUiStore.getState().variableManagePage).toBe(4);
        });

        it('setVariableManagePage accepts a functional updater (next/prev pagination)', () =>
        {
            useWiredCreatorToolsUiStore.getState().setVariableManagePage(2);
            useWiredCreatorToolsUiStore.getState().setVariableManagePage(prev => prev + 1);
            expect(useWiredCreatorToolsUiStore.getState().variableManagePage).toBe(3);

            useWiredCreatorToolsUiStore.getState().setVariableManagePage(prev => Math.max(1, prev - 1));
            expect(useWiredCreatorToolsUiStore.getState().variableManagePage).toBe(2);
        });
    });
});
