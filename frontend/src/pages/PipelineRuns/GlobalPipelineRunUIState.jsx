import { createState, useState as useHookState } from '@hookstate/core';

/* State for UI to run the flow */
export const globalPipelineRun = createState({
    isRunning: false,
    isOpenLogDrawer: false,
    isOpenAPIDrawer: false,
    isOpenTurnOffPipelineDrawer: false,
    isDragging: false,
    isPanEnable: false,
    scale: 1,
    selectedEdge: null,
    pipelineInfo: null,
    selectedElement: null,
    elements: [],
});

export const useGlobalPipelineRun = () => useHookState(globalPipelineRun);
