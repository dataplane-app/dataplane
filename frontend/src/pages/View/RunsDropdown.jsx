import { Autocomplete, Grid, TextField } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useGlobalFlowState } from '../Flow';
import { Downgraded } from '@hookstate/core';
import { useGlobalRunState } from './useWebSocket';

export default function RunsDropdown() {
    // Global states
    const FlowState = useGlobalFlowState();
    const RunState = useGlobalRunState();

    // Local state
    const [run, setRun] = useState();

    useEffect(() => {
        if (RunState.run_id.get()) {
            setRun([formatDate(FlowState.startedRunningAt.attach(Downgraded).get()) + ' - ' + RunState.run_id.get()]);
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [RunState.run_id.get()]);

    return (
        <Grid item alignItems="center" display="flex" width={510}>
            <Autocomplete
                id="run_autocomplete"
                onChange={(event, newValue) => {
                    // setSelectedUserEnvironment(newValue);
                }}
                value={run || []}
                disableClearable
                sx={{ minWidth: '510px' }}
                options={run || []}
                renderInput={(params) => <TextField {...params} label="Run" id="run" size="small" sx={{ fontSize: '.75rem', display: 'flex' }} />}
            />
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
