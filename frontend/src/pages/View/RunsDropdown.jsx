import { Autocomplete, Grid, TextField } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useGlobalFlowState } from '../Flow';
import { Downgraded } from '@hookstate/core';
import { useGlobalRunState } from './useWebSocket';
import { useGetPipelineRuns } from '../../graphql/getPipelineRuns';
import { useParams } from 'react-router-dom';
import { useSnackbar } from 'notistack';

export default function RunsDropdown({ environmentID }) {
    // Global states
    const FlowState = useGlobalFlowState();
    const RunState = useGlobalRunState();

    // Local state
    const [run, setRun] = useState();
    console.log('🚀 ~ file: RunsDropdown.jsx ~ line 17 ~ RunsDropdown ~ run', run);
    const [runs, setRuns] = useState([]);
    console.log('🚀 ~ file: RunsDropdown.jsx ~ line 18 ~ RunsDropdown ~ runs', runs);

    // GraphQL hook
    const getPipelineRuns = useGetPipelineRunsHook();

    useEffect(() => {
        if (RunState.run_id.get()) {
            setRun([formatDate(FlowState.startedRunningAt.attach(Downgraded).get()) + ' - ' + RunState.run_id.get()]);
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [RunState.run_id.get()]);

    // Get pipeline runs on load and environment change
    useEffect(() => {
        getPipelineRuns(environmentID, setRuns, setRun);

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [environmentID]);

    return (
        <Grid item alignItems="center" display="flex" width={510}>
            {run ? (
                <Autocomplete
                    id="run_autocomplete"
                    onChange={(event, newValue) => {
                        setRun(newValue);
                    }}
                    value={run}
                    disableClearable
                    sx={{ minWidth: '510px' }}
                    options={runs}
                    getOptionLabel={(a) => formatDate(a.created_at) + ' - ' + a.run_id}
                    renderInput={(params) => <TextField {...params} label="Run" id="run" size="small" sx={{ fontSize: '.75rem', display: 'flex' }} />}
                />
            ) : null}
        </Grid>
    );
}

// ------ Custom hook
const useGetPipelineRunsHook = () => {
    // GraphQL hook
    const getPipelineRuns = useGetPipelineRuns();

    // URI parameter
    const { pipelineId } = useParams();

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    // Get members
    return async (environmentID, setRuns, setRun) => {
        const response = await getPipelineRuns({ pipelineID: pipelineId, environmentID });

        if (response.length === 0) {
            setRuns([]);
        } else if (response.r === 'error') {
            closeSnackbar();
            enqueueSnackbar("Can't get flow: " + response.msg, { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message + ': get flow', { variant: 'error' }));
        } else {
            setRuns(response);
            setRun(response[response.length - 1]);
        }
    };
};

// ----- Utility function
function formatDate(date) {
    if (!date) return;
    date = new Date(date);
    let day = new Intl.DateTimeFormat('en', { day: 'numeric' }).format(date);
    let monthYear = new Intl.DateTimeFormat('en', { year: 'numeric', month: 'short' }).format(date);
    let time = new Intl.DateTimeFormat('en', { hourCycle: 'h23', hour: '2-digit', minute: 'numeric', second: 'numeric' }).format(date);
    return `${day} ${monthYear} ${time}`;
}
