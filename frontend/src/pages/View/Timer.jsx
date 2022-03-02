import { Box, Button, Grid, Typography } from '@mui/material';
import { useSnackbar } from 'notistack';
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Downgraded } from '@hookstate/core';
import { usePipelineTasksRun } from '../../graphql/getPipelineTasksRun';
import { useRunPipelines } from '../../graphql/runPipelines';
import { useStopPipelines } from '../../graphql/stopPipelines';
import { useGlobalFlowState } from '../Flow';
import useWebSocket, { useGlobalRunState } from './useWebSocket';

export default function Timer({ environmentID }) {
    // Global state
    const FlowState = useGlobalFlowState();
    const RunState = useGlobalRunState();

    // GraphQL hooks
    const runPipelines = useRunPipelinesHook();
    const stopPipelines = useStopPipelinesHook();
    const getPipelineTasksRun = usePipelineTasksRunHook();

    // Local state
    const [elapsed, setElapsed] = useState();
    const [isRunning, setIsRunning] = useState(false);
    const [start, setStart] = useState();

    // URI parameter
    const { pipelineId } = useParams();

    // Instantiate websocket connection
    useWebSocket(environmentID, RunState.run_id.get());

    // Get current runs status
    useEffect(() => {
        if (FlowState.isRunning.get() && RunState.run_id.get() !== '') {
            getPipelineTasksRun(RunState.run_id.get(), environmentID);
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [FlowState.isRunning.get(), RunState.run_id.get()]);

    const handleTimerStart = () => {
        FlowState.isRunning.set(true);
        RunState.set({});
        runPipelines(environmentID, pipelineId);
    };

    const handleTimerStop = () => {
        FlowState.isRunning.set(false);
        RunState.start_dt.set(undefined);
        stopPipelines(environmentID, RunState.run_id.get());
    };

    // Updates timer every second
    useEffect(() => {
        if (!start) return;
        let secTimer;
        if (isRunning) {
            secTimer = setInterval(() => {
                setElapsed(displayTimer(start));
            }, 500);
        }

        if (!isRunning) {
            clearInterval(secTimer);
        }

        return () => {
            clearInterval(secTimer);
            setElapsed(0);
        };

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [start]);

    // Set isRunning state and start state for timer
    useEffect(() => {
        if (Object.values(RunState.get())?.some((a) => a?.status === 'Queue')) {
            setStart(
                Object.values(RunState.get())
                    .map((a) => a?.start_dt)
                    .sort((a, b) => a?.localeCompare(b))[0]
            );
            setIsRunning(true);
        } else {
            setIsRunning(false);
            setStart();
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [RunState.get()]);

    return (
        <>
            <Grid item>
                {isRunning ? (
                    <Box display="flex" alignItems="center">
                        <Button
                            onClick={handleTimerStop}
                            variant="outlined"
                            color="error"
                            sx={{ width: 70, fontWeight: '700', fontSize: '.81rem', border: 2, '&:hover': { border: 2 } }}>
                            Stop
                        </Button>

                        <Typography variant="h3" ml={2}>
                            {elapsed ? elapsed : isRunning ? '' : '00:00:00'}
                        </Typography>
                    </Box>
                ) : (
                    <Button onClick={handleTimerStart} variant="outlined" sx={{ width: 70, fontWeight: '700', fontSize: '.81rem', border: 2, '&:hover': { border: 2 } }}>
                        Run
                    </Button>
                )}
            </Grid>
        </>
    );
}

// Custom GraphQL hooks
export const useRunPipelinesHook = () => {
    // GraphQL hook
    const runPipelines = useRunPipelines();

    const RunState = useGlobalRunState();
    const FlowState = useGlobalFlowState();

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    // Run pipeline flow
    return async (environmentID, pipelineId) => {
        const response = await runPipelines({
            pipelineID: pipelineId,
            environmentID,
            run_json: FlowState.elements.attach(Downgraded).get(),
        });

        if (response.r === 'error') {
            closeSnackbar();
            enqueueSnackbar("Can't run flow: " + response.msg, { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message + ': run flow', { variant: 'error' }));
        } else {
            RunState.run_id.set(response.run_id);
        }
    };
};

const useStopPipelinesHook = () => {
    // GraphQL hook
    const stopPipelines = useStopPipelines();

    // URI parameter
    const { pipelineId } = useParams();

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    // Stop pipeline flow
    return async (environmentID, runID) => {
        const response = await stopPipelines({ pipelineID: pipelineId, environmentID, runID });

        if (response.r === 'error') {
            closeSnackbar();
            enqueueSnackbar("Can't stop flow: " + response.msg, { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message + ': stop flow', { variant: 'error' }));
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
            response.errors.map((err) => enqueueSnackbar(err.message + ': update flow failed', { variant: 'error' }));
        } else {
            response.map((a) => RunState[a.node_id].set({ status: a.status }));
            RunState.start_dt.set(response.map((a) => a.start_dt)[0]);
            if (response.every((a) => a.status === 'Fail' || a.status === 'Success')) {
                FlowState.isRunning.set(false);
                RunState.run_id.set(response[0].run_id);
            }
        }
    };
};

// Utility function
function displayTimer(date) {
    var ticks = Math.floor((new Date() - new Date(date)) / 1000);
    var hh = Math.floor(ticks / 3600);
    var mm = Math.floor((ticks % 3600) / 60);
    var ss = ticks % 60;

    return pad(hh, 2) + ':' + pad(mm, 2) + ':' + pad(ss, 2);
}

function pad(n, width) {
    const num = n + '';
    return num.length >= width ? num : new Array(width - num.length + 1).join('0') + n;
}
