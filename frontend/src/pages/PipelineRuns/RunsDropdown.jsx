import { Autocomplete, Grid, TextField } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useGetPipelineRuns } from '../../graphql/getPipelineRuns';
import { useParams } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { usePipelineTasksRun } from '../../graphql/getPipelineTasksRun';
import { useGetSinglepipelineRun } from '../../graphql/getSinglepipelineRun';
import { useGlobalFlowState } from '../Flow';
import { useGetPipelineFlowHook } from '.';
import { useGlobalRunState } from './GlobalRunState';
import { Downgraded } from '@hookstate/core';

export default function RunsDropdown({ environmentID, pipeline, runs, setRuns, selectedRun, setSelectedRun }) {
    // Global states
    const RunState = useGlobalRunState();
    // console.log('🚀 ~ file: RunsDropdown.jsx ~ line 15 ~ RunsDropdown ~ RunState', RunState.attach(Downgraded).get());
    const FlowState = useGlobalFlowState();

    // Local state
    const [isNewFlow, setIsNewFlow] = useState(false);

    // GraphQL hooks
    const getPipelineRuns = useGetPipelineRunsHook(environmentID, setRuns);
    const getPipelineTasksRun = usePipelineTasksRunHook(selectedRun);
    const getSinglepipelineRun = useGetSinglepipelineRunHook(environmentID, setSelectedRun);
    const getPipelineFlow = useGetPipelineFlowHook(pipeline);

    // Get pipeline runs on load and environment change
    useEffect(() => {
        (async () => {
            let [lastRunId, lastRunTime] = await getPipelineRuns();

            const isNewFlow = pipeline.updated_at > lastRunTime;

            if (isNewFlow) {
                setIsNewFlow(true);
                getPipelineFlow(environmentID);
                return;
            }

            getSinglepipelineRun(lastRunId);
            getPipelineTasksRun(lastRunId, environmentID);
        })();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [environmentID]);

    // Get pipeline runs with each run start.
    useEffect(() => {
        if (RunState.run_id.get() && FlowState.isRunning.get()) {
            // getPipelineRuns();
            // getSinglepipelineRun(RunState.run_id.get());
            // getPipelineTasksRun(RunState.run_id.get(), environmentID);
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [RunState.run_id.get()]);

    // Update elements on run dropdown change
    const handleDropdownChange = (run) => {
        setSelectedRun(run);
        getPipelineTasksRun(run.run_id, environmentID);
        getSinglepipelineRun(run.run_id);

        RunState.merge({
            dropdownRunId: run.run_id,
            runStart: run.created_at,
            runEnd: run.ended_at,
        });
    };

    return (
        <Grid item alignItems="center" display="flex" width={520}>
            {selectedRun && !isNewFlow ? (
                <Autocomplete
                    id="run_autocomplete"
                    onChange={(event, newValue) => handleDropdownChange(newValue)}
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
                    onChange={(event, newValue) => handleDropdownChange(newValue)}
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
export const useGetPipelineRunsHook = (environmentID, setRuns) => {
    // GraphQL hook
    const getPipelineRuns = useGetPipelineRuns();

    const RunState = useGlobalRunState();

    // URI parameter
    const { pipelineId } = useParams();

    const { enqueueSnackbar } = useSnackbar();

    // Get members
    return async () => {
        const response = await getPipelineRuns({ pipelineID: pipelineId, environmentID });

        if (response.length === 0) {
            setRuns([]);
        } else if (response.r || response.error) {
            enqueueSnackbar("Can't get flow: " + (response.msg || response.r || response.error), { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            setRuns(response);
            return [response[0].run_id, response[0].updated_at];
        }
    };
};

const useGetSinglepipelineRunHook = (environmentID, setSelectedRun) => {
    // GraphQL hook
    const getSinglepipelineRun = useGetSinglepipelineRun();

    const FlowState = useGlobalFlowState();
    const RunState = useGlobalRunState();

    // URI parameter
    const { pipelineId } = useParams();

    const { enqueueSnackbar } = useSnackbar();

    // Get pipeline run
    return async (runID) => {
        const response = await getSinglepipelineRun({ pipelineID: pipelineId, environmentID, runID });

        if (response.length === 0) {
            setSelectedRun([]);
        } else if (response.r || response.error) {
            enqueueSnackbar("Can't get pipeline run: " + (response.msg || response.r || response.error), { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            // Check if there is an active run when the page loads and set run_id to fire websockets
            if (response.created_at && !response.ended_at) {
                FlowState.isRunning.set(true);
                RunState.run_id.set(response.run_id);
            }
            setSelectedRun(response);
            FlowState.elements.set(response.run_json);
            RunState.runIDs.merge({
                [response.run_id]: {
                    runStart: response.created_at,
                    runEnd: response.ended_at,
                },
            });
        }
    };
};

export const usePipelineTasksRunHook = () => {
    // GraphQL hook
    const getPipelineTasksRun = usePipelineTasksRun();

    // URI parameter
    const { pipelineId } = useParams();

    const RunState = useGlobalRunState();

    const { enqueueSnackbar } = useSnackbar();

    // Update pipeline flow
    return async (runID, environmentID) => {
        if (!runID) return;

        const response = await getPipelineTasksRun({ pipelineID: pipelineId, runID, environmentID });

        if (response.r || response.error) {
            enqueueSnackbar("Can't update flow: " + (response.msg || response.r || response.error), { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            const nodes = {};
            response.map(
                (a) =>
                    (nodes[a.node_id] = {
                        status: a.status,
                        end_dt: a.end_dt,
                        start_dt: a.start_dt,
                    })
            );
            RunState.batch((s) => {
                s.selectedRunID.set(response[0].run_id);
                s.runIDs[response[0].run_id].nodes.set(nodes);
            }, 'tasks-batch');
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

export function displayTimerMs(end, start) {
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
