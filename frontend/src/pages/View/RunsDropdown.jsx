import { Autocomplete, Grid, TextField } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useGlobalRunState } from './useWebSocket';
import { useGetPipelineRuns } from '../../graphql/getPipelineRuns';
import { useParams } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { usePipelineTasksRun } from '../../graphql/getPipelineTasksRun';

export default function RunsDropdown({ environmentID, setElements }) {
    // Global states
    const RunState = useGlobalRunState();

    // Local state
    const [selectedRun, setSelectedRun] = useState();
    const [runs, setRuns] = useState([]);

    // GraphQL hooks
    const getPipelineRuns = useGetPipelineRunsHook();
    const getPipelineTasksRun = usePipelineTasksRunHook();

    // Get pipeline runs on load and environment change and after each run.
    useEffect(() => {
        getPipelineRuns(environmentID, setRuns, setSelectedRun);

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [environmentID, RunState.run_id.get()]);

    // Update elements on run dropdown change
    useEffect(() => {
        if (!selectedRun) return;
        setElements(selectedRun.run_json);
        getPipelineTasksRun(selectedRun.run_id, environmentID);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedRun]);

    return (
        <Grid item alignItems="center" display="flex" width={520}>
            {selectedRun || runs.length === 0 || RunState.run_id.get() === 0 ? (
                <Autocomplete
                    id="run_autocomplete"
                    onChange={(event, newValue) => {
                        setSelectedRun(newValue);
                    }}
                    value={selectedRun}
                    disableClearable
                    sx={{ minWidth: '520px' }}
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

    const RunState = useGlobalRunState();

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
            setRuns(response.sort((a, b) => a.created_at.localeCompare(b.created_at)));
            if (RunState.run_id.get() !== 0) {
                setRun(response[response.length - 1]);
            }
        }
    };
};

export const usePipelineTasksRunHook = () => {
    // GraphQL hook
    const getPipelineTasksRun = usePipelineTasksRun();

    // URI parameter
    const { pipelineId } = useParams();

    const RunState = useGlobalRunState();

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    // Update pipeline flow
    return async (runID, environmentID) => {
        if (!runID) return;

        const response = await getPipelineTasksRun({ pipelineID: pipelineId, runID, environmentID });

        if (response.r === 'Unauthorized') {
            closeSnackbar();
            enqueueSnackbar(`Can't update flow: ${response.r}`, { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message + ': update flow failed', { variant: 'error' }));
        } else {
            // RunState.set({});
            response.map((a) => RunState[a.node_id].set({ status: a.status, end_dt: a.end_dt, start_dt: a.start_dt }));
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
