import { Autocomplete, Grid, TextField } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useGetDeploymentRuns } from '../../../graphql/getDeploymentRuns';
import { useParams } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { usePipelineTasksRun } from '../../../graphql/getPipelineTasksRun';
import { useGlobalFlowState } from '../../Flow';
import { useGlobalRunState } from './GlobalRunState';

export default function RunsDropdown({ environmentID, deployment }) {
    // Global states
    const RunState = useGlobalRunState();
    const FlowState = useGlobalFlowState();

    // Local state
    const [runs, setRuns] = useState([]);
    const [isNewFlow, setIsNewFlow] = useState(true);
    const [selectedRun, setSelectedRun] = useState(null);

    // GraphQL hooks
    const getPipelineRuns = useGetDeploymentRunsHook(environmentID, setRuns);
    const getPipelineTasksRun = usePipelineTasksRunHook(selectedRun);

    // Get pipeline runs on load and environment change
    useEffect(() => {
        if (!environmentID) return;
        getPipelineRuns();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [environmentID]);

    // Get pipeline runs after each run.
    useEffect(() => {
        if (RunState.run_id.get() && FlowState.isRunning.get()) {
            getPipelineRuns();
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [RunState.run_id.get()]);

    // Get pipeline runs on trigger.
    useEffect(() => {
        if (RunState.pipelineRunsTrigger.get() < 2) return;
        getPipelineRuns();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [RunState.pipelineRunsTrigger.get()]);

    // Set flow status,color on change
    useEffect(() => {
        if (runs.length === 0 || !deployment) return;
        setSelectedRun(runs[0]);
        RunState.runStart.set(runs[0].created_at);
        RunState.runEnd.set(runs[0].ended_at);
        setIsNewFlow(false);

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [deployment, runs]);

    // Update elements on run dropdown change
    useEffect(() => {
        if (!selectedRun) return;
        FlowState.elements.set(selectedRun.run_json);

        getPipelineTasksRun(selectedRun.run_id, environmentID);

        // Set timer on dropdown change. Works only for runs returned from pipeline runs.
        if (selectedRun.ended_at) {
            RunState.prevRunTime.set(displayTimerMs(selectedRun.created_at, selectedRun.ended_at));
        }

        RunState.dropdownRunId.set(selectedRun.run_id);

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedRun?.run_id]);

    return (
        <Grid item alignItems="center" display="flex" width={520}>
            {selectedRun && !isNewFlow ? (
                <Autocomplete
                    id="run_autocomplete"
                    onChange={(event, newValue) => {
                        setSelectedRun(newValue);
                        RunState.runStart.set(newValue.created_at);
                        RunState.runEnd.set(newValue.ended_at);
                    }}
                    value={selectedRun}
                    disableClearable
                    sx={{ minWidth: '520px' }}
                    options={runs}
                    isOptionEqualToValue={(option, value) => option.run_id === value.run_id}
                    getOptionLabel={(a) => formatDate(a.created_at) + ' - ' + a.run_id}
                    renderInput={(params) => <TextField {...params} label="Run" id="run" size="small" sx={{ fontSize: '.75rem', display: 'flex' }} />}
                />
            ) : null}
            {isNewFlow ? (
                <Autocomplete
                    id="run_autocomplete"
                    onChange={(event, newValue) => {
                        setSelectedRun(newValue);
                        RunState.runStart.set(newValue.created_at);
                        RunState.runEnd.set(newValue.ended_at);
                    }}
                    value={selectedRun}
                    disableClearable
                    sx={{ minWidth: '520px' }}
                    options={runs}
                    isOptionEqualToValue={(option, value) => option.run_id === value.run_id}
                    getOptionLabel={(a) => formatDate(a.created_at) + ' - ' + a.run_id}
                    renderInput={(params) => <TextField {...params} label="Run" id="run" size="small" sx={{ fontSize: '.75rem', display: 'flex' }} />}
                />
            ) : null}
        </Grid>
    );
}

// ------ Custom hook
export const useGetDeploymentRunsHook = (environmentID, setRuns) => {
    // GraphQL hook
    const getPipelineRuns = useGetDeploymentRuns();

    // URI parameter
    const { deploymentId, version } = useParams();

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    // Get members
    return async () => {
        const response = await getPipelineRuns({ deploymentID: deploymentId, environmentID, version });

        if (response.length === 0) {
            setRuns([]);
        } else if (response.r === 'error') {
            closeSnackbar();
            enqueueSnackbar("Can't get flow: " + response.msg, { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            setRuns(response);
        }
    };
};

export const usePipelineTasksRunHook = (selectedRun) => {
    // GraphQL hook
    const getPipelineTasksRun = usePipelineTasksRun();

    // URI parameter
    const { deploymentId } = useParams();

    const RunState = useGlobalRunState();
    const FlowState = useGlobalFlowState();

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    // Update pipeline flow
    return async (runID, environmentID) => {
        if (!runID) return;

        const response = await getPipelineTasksRun({ pipelineID: deploymentId, runID, environmentID });

        if (response.r === 'Unauthorized') {
            closeSnackbar();
            enqueueSnackbar(`Can't update flow: ${response.r}`, { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            // Keeping only start_id and run_id and removing rest of the nodes before adding this run's nodes.
            const keep = {
                start_id: RunState.start_dt.get(),
                run_id: RunState.run_id.get() || RunState.dropdownRunId.get(),
                pipelineRunsTrigger: RunState.pipelineRunsTrigger.get(),
                dropdownRunId: selectedRun.run_id,
                runStart: RunState.runStart.get(),
                runEnd: RunState.runEnd.get(),
                selectedNodeStatus: RunState.selectedNodeStatus.get(),
                prevRunTime: RunState.prevRunTime.get(),
            };
            if (!RunState.runEnd.get()) {
                FlowState.isRunning.set(true);
            }

            response.map(
                (a) =>
                    (keep[a.node_id.replace('d-', '')] = {
                        status: a.status,
                        end_dt: a.end_dt,
                        start_dt: a.start_dt,
                        name: selectedRun.run_json.filter((b) => b.id === a.node_id.replace('d-', ''))[0].data.name,
                        type: selectedRun.run_json.filter((b) => b.id === a.node_id.replace('d-', ''))[0].type,
                    })
            );
            RunState.set(keep);
        }
    };
};

// ----- Utility functions
function formatDate(date) {
    if (!date) return;
    date = new Date(date);
    let day = new Intl.DateTimeFormat('en', { day: 'numeric' }).format(date);
    let monthYear = new Intl.DateTimeFormat('en', { year: 'numeric', month: 'short' }).format(date);
    let time = new Intl.DateTimeFormat('en', { hourCycle: 'h23', hour: '2-digit', minute: 'numeric', second: 'numeric' }).format(date);
    return `${day} ${monthYear} ${time}`;
}

function displayTimerMs(end, start) {
    if (!end || !start) return null;

    var ticks = (new Date(start) - new Date(end)) / 1000;
    var hh = Math.floor(ticks / 3600);
    var mm = Math.floor((ticks % 3600) / 60);
    var ss = (ticks % 60).toFixed(3);

    return pad(hh, 2) + ':' + pad(mm, 2) + ':' + pad(Math.floor(ss), 2) + '.' + ss.split('.')[1];
}

function pad(n, width) {
    const num = n + '';
    return num.length >= width ? num : new Array(width - num.length + 1).join('0') + n;
}
