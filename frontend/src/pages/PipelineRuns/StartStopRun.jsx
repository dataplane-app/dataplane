import { Box, Button, Grid, Typography } from '@mui/material';
import { useSnackbar } from 'notistack';
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useRunPipelines } from '../../graphql/runPipelines';
import { useStopPipelines } from '../../graphql/stopPipelines';
import { useGlobalFlowState } from '../Flow';
import useWebSocket from './useWebSocket';
import StatusChips from './StatusChips';
import RunsDropdown, { displayTimerMs, usePipelineTasksRunHook } from './RunsDropdown';
import { Downgraded } from '@hookstate/core';
import { useGlobalRunState } from './GlobalRunState';
import { v4 as uuidv4 } from 'uuid';
import useRunPipelineWebSocket from './useRunPipelineWebSocket';

export default function StartStopRun({ environmentID, pipeline }) {
    // Global state
    const FlowState = useGlobalFlowState();
    const RunState = useGlobalRunState();

    // Local state
    const [elapsed, setElapsed] = useState();
    const [runs, setRuns] = useState([]);
    const [selectedRun, setSelectedRun] = useState(null);

    // GraphQL hooks
    const runPipelines = useRunPipelinesHook();
    const getPipelineTasksRun = usePipelineTasksRunHook();
    const stopPipelines = useStopPipelinesHook(getPipelineTasksRun);

    // URI parameter
    const { pipelineId } = useParams();

    // Instantiate websocket connection
    // useWebSocket(environmentID, RunState.run_id.get());
    useRunPipelineWebSocket(environmentID, setRuns, setSelectedRun);

    // Click Run button and start to run the pipeline
    const handleTimerStart = () => {
        FlowState.isRunning.set(true);

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

        // runPipelines(environmentID, pipelineId);
        RunState.runTrigger.set((t) => t + 1);
    };

    const handleTimerStop = () => {
        FlowState.isRunning.set(false);
        stopPipelines(environmentID, RunState.run_id.get());
    };

    // Updates timer every second
    useEffect(() => {
        if (!RunState.runIDs[RunState.selectedRunID.get()]?.runStart?.get()) return;

        let secTimer;
        if (FlowState.isRunning.get()) {
            secTimer = setInterval(() => {
                setElapsed(displayTimer(RunState.runIDs[RunState.selectedRunID.get()]?.runStart.get()));
            }, 500);
        }

        if (RunState.runIDs[RunState.selectedRunID.get()]?.runEnd.get()) {
            clearInterval(secTimer);
            setElapsed(0);
        }

        return () => {
            clearInterval(secTimer);
            setElapsed(0);
        };

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [RunState.runIDs[RunState.selectedRunID.get()]?.runStart?.get(), RunState.runIDs[RunState.selectedRunID.get()]?.runEnd?.get()]);

    return (
        <Grid item>
            <Box display="flex" alignItems="center">
                {FlowState.isRunning.get() && RunState.runIDs[RunState.selectedRunID.get()]?.runEnd?.get() === null ? (
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

                {pipeline && environmentID ? (
                    <RunsDropdown environmentID={environmentID} pipeline={pipeline} runs={runs} setRuns={setRuns} selectedRun={selectedRun} setSelectedRun={setSelectedRun} />
                ) : null}

                {!RunState.runIDs[RunState.selectedRunID.get()]?.runEnd?.get() ? (
                    // If looking at an active run, show live timer
                    FlowState.isRunning.get() ? (
                        <Typography variant="h3" ml={2}>
                            {elapsed ? elapsed : FlowState.isRunning.get() ? '' : '00:00:00'}
                        </Typography>
                    ) : (
                        // If looking at a previous run during an active run
                        <Typography variant="h3" ml={2}>
                            {displayTimerMs(RunState.runIDs[RunState.selectedRunID.get()]?.runStart?.get(), RunState.runIDs[RunState.selectedRunID.get()]?.runEnd?.get())}
                        </Typography>
                    )
                ) : (
                    // If there is no active run.
                    <Typography variant="h3" ml={2}>
                        {displayTimerMs(RunState.runIDs[RunState.selectedRunID.get()]?.runStart?.get(), RunState.runIDs[RunState.selectedRunID.get()]?.runEnd?.get())}
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

    const RunID = uuidv4();

    // Run pipeline flow
    return async (environmentID, pipelineId) => {
        RunState.run_id.set(RunID);

        const response = await runPipelines({
            pipelineID: pipelineId,
            environmentID,
            RunType: 'pipeline',
            RunID,
        });

        if (response.r === 'error') {
            closeSnackbar();
            enqueueSnackbar("Can't run flow: " + response.msg, { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            // RunState.run_id.set(response.run_id);
            RunState.dropdownRunId.set(response.run_id);
            // RunState.runStart.set(response.created_at);
        }
    };
};

const useStopPipelinesHook = (getPipelineTasksRun) => {
    // GraphQL hook
    const stopPipelines = useStopPipelines();

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
            getPipelineTasksRun(response.run_id, environmentID);
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
