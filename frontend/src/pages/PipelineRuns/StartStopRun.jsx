import { Box, Button, Grid, Typography } from '@mui/material';
import { useSnackbar } from 'notistack';
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { usePipelineTasksRun } from '../../graphql/getPipelineTasksRun';
import { useRunPipelines } from '../../graphql/runPipelines';
import { useStopPipelines } from '../../graphql/stopPipelines';
import { useGlobalFlowState } from '../Flow';
import useWebSocket from './useWebSocket';
import StatusChips from './StatusChips';
import RunsDropdown, { displayTimerMs } from './RunsDropdown';
import { Downgraded } from '@hookstate/core';
import { useGlobalRunState } from './GlobalRunState';

export default function StartStopRun({ environmentID, pipeline }) {
    // Global state
    const FlowState = useGlobalFlowState();
    const RunState = useGlobalRunState();

    // Local state
    const [elapsed, setElapsed] = useState();

    // GraphQL hooks
    const runPipelines = useRunPipelinesHook();
    const stopPipelines = useStopPipelinesHook();

    // URI parameter
    const { pipelineId } = useParams();

    // Instantiate websocket connection
    useWebSocket(environmentID, RunState.run_id.get());

    // Click Run button and start to run the pipeline
    const handleTimerStart = () => {
        FlowState.isRunning.set(true);
        // RunState.runStart.set(null);

        // Find key of trigger node
        let triggerKey = Object.values(FlowState.elements.attach(Downgraded).get()).filter((a) => a.type === 'scheduleNode' || a.type === 'playNode')[0].id;
        // Set trigger to success so becomes green as the run starts
        let triggerNode = { [triggerKey]: { status: 'Success' } };

        // Clear run state before a new run
        RunState.merge({
            nodes: triggerNode,
            runStart: null,
            runEnd: null,
        });
        // RunState.nodes.set(triggerNode);
        runPipelines(environmentID, pipelineId);
    };

    const handleTimerStop = () => {
        FlowState.isRunning.set(false);
        stopPipelines(environmentID, RunState.run_id.get());
    };

    // Updates timer every second
    useEffect(() => {
        if (!RunState.runStart.get()) return;

        let secTimer;
        if (FlowState.isRunning.get()) {
            secTimer = setInterval(() => {
                setElapsed(displayTimer(RunState.runStart.get()));
            }, 500);
        }

        if (RunState.runEnd.get()) {
            clearInterval(secTimer);
            setElapsed(0);
        }

        return () => {
            clearInterval(secTimer);
            setElapsed(0);
        };

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [RunState.runStart.get(), RunState.runEnd.get()]);

    return (
        <Grid item>
            <Box display="flex" alignItems="center">
                {FlowState.isRunning.get() && RunState.runEnd.get() === null ? (
                    <Button
                        onClick={handleTimerStop}
                        variant="outlined"
                        color="error"
                        sx={{ width: 70, fontWeight: '700', fontSize: '.81rem', border: 2, '&:hover': { border: 2 } }}>
                        Stop
                    </Button>
                ) : (
                    <Button onClick={handleTimerStart} variant="outlined" sx={{ width: 70, fontWeight: '700', fontSize: '.81rem', border: 2, '&:hover': { border: 2 } }}>
                        Run
                    </Button>
                )}

                <StatusChips />

                {pipeline && environmentID ? <RunsDropdown environmentID={environmentID} pipeline={pipeline} /> : null}

                {!RunState.runEnd.get() ? (
                    // If active run, show live timer
                    RunState.dropdownRunId.get() === RunState.run_id.get() ? (
                        <Typography variant="h3" ml={2}>
                            {elapsed ? elapsed : FlowState.isRunning.get() ? '' : '00:00:00'}
                        </Typography>
                    ) : (
                        // If not active run, show calculated run time
                        <Typography variant="h3" ml={2}>
                            {displayTimerMs(RunState.runStart.get(), RunState.runEnd.get())}
                        </Typography>
                    )
                ) : (
                    <Typography variant="h3" ml={2}>
                        {displayTimerMs(RunState.runStart.get(), RunState.runEnd.get())}
                    </Typography>
                )}
            </Box>
        </Grid>
    );
}

// This function runs the pipeline and updates the Global Runstate when button Run gets pressed - not when drop down menu changes
export const useRunPipelinesHook = () => {
    // GraphQL hook - this is the Graphql to Run the pipeline
    const runPipelines = useRunPipelines();

    const RunState = useGlobalRunState();

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    // Run pipeline flow
    return async (environmentID, pipelineId) => {
        const response = await runPipelines({
            pipelineID: pipelineId,
            environmentID,
            RunType: 'pipeline',
        });

        if (response.r === 'error') {
            closeSnackbar();
            enqueueSnackbar("Can't run flow: " + response.msg, { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            RunState.run_id.set(response.run_id);
            RunState.dropdownRunId.set(response.run_id);
            RunState.runStart.set(response.created_at);
        }
    };
};

const useStopPipelinesHook = () => {
    // GraphQL hook
    const stopPipelines = useStopPipelines();

    const RunState = useGlobalRunState();

    // URI parameter
    const { pipelineId } = useParams();

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    // Stop pipeline flow
    return async (environmentID, runID) => {
        const response = await stopPipelines({ pipelineID: pipelineId, environmentID, runID, RunType: 'pipeline' });

        if (response.r === 'error') {
            closeSnackbar();
            enqueueSnackbar("Can't stop flow: " + response.msg, { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            // add if statement to match run id before setting runEnd time
            RunState.runEnd.set(response.ended_at);
        }
    };
};

export const usePipelineTasksRunHook = () => {
    // GraphQL hook
    const getPipelineTasksRun = usePipelineTasksRun();

    // URI parameter
    const { pipelineId } = useParams();

    const RunState = useGlobalRunState();
    const FlowState = useGlobalFlowState();

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    // Update pipeline flow
    return async (runID, environmentID) => {
        if (!runID) return;

        const response = await getPipelineTasksRun({ pipelineID: pipelineId, runID, environmentID });

        if (response.r === 'Unauthorized') {
            closeSnackbar();
            enqueueSnackbar(`Can't update flow: ${response.r}`, { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            response.map((a) => RunState.nodes[a.node_id].merge({ status: a.status }));
            if (response.every((a) => a.status === 'Fail' || a.status === 'Success')) {
                FlowState.isRunning.set(false);
                RunState.run_id.set(response[0].run_id);
            }
        }
    };
};

// Utility function
export function displayTimer(startDate, endDate = new Date()) {
    if (typeof endDate === 'string') {
        endDate = new Date(endDate);
    }
    var ticks = Math.floor((endDate - new Date(startDate)) / 1000);
    var hh = Math.floor(ticks / 3600);
    var mm = Math.floor((ticks % 3600) / 60);
    var ss = ticks % 60;

    return pad(hh, 2) + ':' + pad(mm, 2) + ':' + pad(ss, 2);
}

function pad(n, width) {
    const num = n + '';
    return num.length >= width ? num : new Array(width - num.length + 1).join('0') + n;
}
