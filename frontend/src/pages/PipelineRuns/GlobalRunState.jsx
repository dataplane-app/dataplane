import { createState, useState as useHookState } from '@hookstate/core';

// Global run state - run_id gets added to global state when pipeline is run
export const globalRunState = createState({
    selectedRunID: null,
    runObject: null,
});

export const useGlobalRunState = () => useHookState(globalRunState);
