import { createState, useState as useHookState } from '@hookstate/core';

// Global run state - run_id gets added to global state when pipeline is run
export const globalRunState = createState({
    pipelineRunsTrigger: 1,
    runStart: null,
    runEnd: null,
    run_id: null,
    dropdownRunId: null,
    nodes: null,
});

export const useGlobalRunState = () => useHookState(globalRunState);
