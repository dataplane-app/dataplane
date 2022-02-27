import { Grid, MenuItem, TextField, Typography } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useGlobalFlowState } from '../Flow';
import { Downgraded } from '@hookstate/core';
import { useGlobalRunState } from './useWebSocket';

export default function RunsDropdown() {
    // Global states
    const FlowState = useGlobalFlowState();
    const RunState = useGlobalRunState();

    // Local state
    const [runId, setRunId] = useState();
    const [startedAt, setStartedAt] = useState();

    useEffect(() => {
        if (RunState.run_id.get()) {
            setRunId(RunState.run_id.get());
            setStartedAt(formatDate(FlowState.startedRunningAt.attach(Downgraded).get()));
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [RunState.run_id.get()]);

    return (
        <Grid item alignItems="center" display="flex" flex={1}>
            <Typography variant="h3">Run</Typography>
            <TextField label="Live" id="last" select size="small" sx={{ ml: 2, mr: 2, flex: 1 }}>
                {runId ? (
                    <MenuItem value="live">
                        {startedAt} - {runId}
                    </MenuItem>
                ) : null}
            </TextField>
        </Grid>
    );
}

// ----- Utility function
function formatDate(date) {
    let day = new Intl.DateTimeFormat('en', { day: 'numeric' }).format(date);
    let monthYear = new Intl.DateTimeFormat('en', { year: 'numeric', month: 'short' }).format(date);
    let time = new Intl.DateTimeFormat('en', { hourCycle: 'h23', hour: '2-digit', minute: 'numeric', second: 'numeric' }).format(date);
    return `${day} ${monthYear} ${time}`;
}
