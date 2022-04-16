import { Grid } from '@mui/material';
import React from 'react';
import { useGlobalFlowState } from '../Flow';
import StartStopRun from './StartStopRun';

export function ActionLayer({ environmentId, pipeline }) {
    // Global states
    const FlowState = useGlobalFlowState();

    return (
        <Grid mt={4} container alignItems="center" sx={{ width: { xl: '88%' }, flexWrap: 'nowrap' }}>
            {/* Timer */}
            {/* {FlowState.elements?.get()?.length > 0 ? <Timer environmentID={environmentId} pipeline={pipeline} /> : null} */}
            <StartStopRun environmentID={environmentId} pipeline={pipeline} />
        </Grid>
    );
}