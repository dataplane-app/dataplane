import { createState, useState as useHookState } from '@hookstate/core';

// Global run state - run_id gets added to global state when pipeline is run
export const globalRunState = createState({
    run_id: null,
    selectedRunID: null,
    runIDs: null,
    dropdownRunId: null,
    runTrigger: 0,
});

export const useGlobalRunState = () => useHookState(globalRunState);
