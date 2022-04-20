import { Autocomplete, Grid, TextField } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useGetPipelineRuns } from '../../graphql/getPipelineRuns';
import { useHistory, useParams } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { usePipelineTasksRun } from '../../graphql/getPipelineTasksRun';
import { useGlobalPipelineRun} from './GlobalPipelineRunUIState'
import { useGlobalRunState } from './GlobalRunState';
import { useGetPipelineFlow } from '../../graphql/getPipelineFlow';
import { prepareInputForFrontend } from '.';
import useOnChangeDropdownWebSocket from './useOnChangeDropdownWebSocket';
import useOnPageLoadWebSocket from './useOnPageLoadWebSocket';
import { formatDateNoZone } from '../../utils/formatDate';
import { useGlobalMeState } from '../../components/Navbar';

export default function RunsDropdown({ environmentID, pipeline, runs, setRuns, selectedRun, setSelectedRun }) {
    // Global states
    const RunState = useGlobalPipelineRun();
    const MeData = useGlobalMeState();

    // Local state
    const [isNewFlow, setIsNewFlow] = useState(false);

    // Graphql hook
    const getPipelineRuns = useGetPipelineRunsHook(environmentID, setRuns, setIsNewFlow, pipeline.updated_at);
    const getPipelineFlow = useGetPipelineFlowHook(pipeline.pipelineID);

    // Instantiate websocket for on page load
    useOnPageLoadWebSocket(environmentID, setSelectedRun, setRuns, setIsNewFlow, pipeline.updated_at);

    // Instantiate websocket for dropdown change
    useOnChangeDropdownWebSocket(environmentID, setSelectedRun);

    useEffect(() => {
        (async () => {
            let [lastRunTime, runID] = await getPipelineRuns(getPipelineFlow);

            // If the pipeline has a new flow, get only the flow and return
            const isNewFlow = pipeline.updated_at > lastRunTime;
            if (isNewFlow) {
                setIsNewFlow(true);
                getPipelineFlow(environmentID);
                return;
            }

            RunState.merge({
                selectedRunID: runID,
                onLoadTrigger: 1,
            });
        })();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Update elements on run dropdown change
    const handleDropdownChange = (run) => {
        setSelectedRun(run);
        RunState.merge((r) => ({
            selectedRunID: run.run_id,
            onChangeTrigger: r.onChangeTrigger + 1,
        }));
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
                    getOptionLabel={(a) => formatDateNoZone(a.created_at, MeData.timezone.get()) + ' - ' + a.run_id}
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
                    getOptionLabel={(a) => formatDateNoZone(a.created_at, MeData.timezone.get()) + ' - ' + a.run_id}
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

    // URI parameter
    const { pipelineId } = useParams();

    const { enqueueSnackbar } = useSnackbar();

    // Get runs
    return async (getPipelineFlow) => {
        const response = await getPipelineRuns({ pipelineID: pipelineId, environmentID });

        if (response.length === 0) {
            setRuns([]);
            // If there are no runs to get flow info, run getPipelineFlow instead
            getPipelineFlow(environmentID);
            return;
        } else if (response.r || response.error) {
            enqueueSnackbar("Can't get runs: " + (response.msg || response.r || response.error), { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            setRuns(response);
            return [response[0]?.updated_at, response[0].run_id];
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

    // Get tasks
    return async (runID, environmentID) => {
        if (!runID) return;

        const response = await getPipelineTasksRun({ pipelineID: pipelineId, runID, environmentID });

        if (response.r || response.error) {
            enqueueSnackbar("Can't get tasks: " + (response.msg || response.r || response.error), { variant: 'error' });
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

const useGetPipelineFlowHook = () => {
    // GraphQL hook
    const getPipelineFlow = useGetPipelineFlow();

    // React router
    const history = useHistory();

    // Global state
    const FlowState = useGlobalPipelineRun();

    // URI parameter
    const { pipelineId } = useParams();

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    // Get members
    return async (environmentID) => {
        const rawResponse = await getPipelineFlow({ pipelineID: pipelineId, environmentID });
        const response = prepareInputForFrontend(rawResponse);

        if (response.length === 0) {
            FlowState.elements.set([]);
            history.push(`/pipelines/flow/${pipelineId}`);
        } else if (response.r === 'error') {
            closeSnackbar();
            enqueueSnackbar("Can't get flow: " + response.msg, { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            FlowState.elements.set(response);
        }
    };
};

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
