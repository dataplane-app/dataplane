import { Grid } from '@mui/material';
import React from 'react';
import { useGlobalFlowState } from '../../Flow';
import Timer from './Timer';

export function ActionLayer({ setElements, environmentId, deployment }) {
    // Global states
    const FlowState = useGlobalFlowState();

    return (
        <Grid mt={4} container alignItems="center" sx={{ width: { xl: '88%' }, flexWrap: 'nowrap' }}>
            {/* Timer */}
            {FlowState.elements.get().length > 0 ? <Timer environmentID={environmentId} setElements={setElements} deployment={deployment} /> : null}
        </Grid>
    );
}
