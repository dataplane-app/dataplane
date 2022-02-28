import { Box, Button, Grid, Typography } from '@mui/material';
import { useSnackbar } from 'notistack';
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
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
    const [runID, setRunID] = useState('');
    const [elapsed, setElapsed] = useState();

    // Instantiate websocket connection
    useWebSocket(environmentID, runID);

    // Get current runs status
    useEffect(() => {
        if (FlowState.isRunning.get() && runID !== '') {
            getPipelineTasksRun(runID, environmentID);
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [FlowState.isRunning.get(), runID]);

    const handleTimerStart = () => {
        FlowState.isRunning.set(true);
        runPipelines(environmentID, setRunID);
    };

    const handleTimerStop = () => {
        FlowState.isRunning.set(false);
        RunState.start_dt.set();
        stopPipelines(environmentID, runID);
    };

    // Updates timer every second
    useEffect(() => {
        let secTimer;
        if (FlowState.isRunning.get()) {
            secTimer = setInterval(() => {
                setElapsed(displayTimer(RunState.start_dt.get()));
            }, 1000);
        }

        return () => {
            clearInterval(secTimer);
            setElapsed(0);
        };

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [RunState.start_dt.get()]);

    return (
        <Grid item flex={0.6}>
            {FlowState.isRunning.get() ? (
                <Box display="flex" alignItems="center">
                    <Button
                        onClick={handleTimerStop}
                        variant="outlined"
                        color="error"
                        sx={{ width: 70, fontWeight: '700', fontSize: '.81rem', border: 2, '&:hover': { border: 2 } }}>
                        Stop
                    </Button>

                    <Typography variant="h3" ml={2}>
                        {elapsed ? elapsed : '00:00:00'}
                    </Typography>
                </Box>
            ) : (
                <Button onClick={handleTimerStart} variant="outlined" sx={{ width: 70, fontWeight: '700', fontSize: '.81rem', border: 2, '&:hover': { border: 2 } }}>
                    Run
                </Button>
            )}
        </Grid>
    );
}

// Custom GraphQL hooks
const useRunPipelinesHook = () => {
    // GraphQL hook
    const runPipelines = useRunPipelines();

    // URI parameter
    const { pipelineId } = useParams();

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    // Run pipeline flow
    return async (environmentID, setRunID) => {
        const response = await runPipelines({ pipelineID: pipelineId, environmentID });

        if (response.r === 'error') {
            closeSnackbar();
            enqueueSnackbar("Can't run flow: " + response.msg, { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message + ': run flow', { variant: 'error' }));
        } else {
            setRunID(response.run_id);
            closeSnackbar();
            enqueueSnackbar('Success', { variant: 'success' });
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
        } else {
            closeSnackbar();
            enqueueSnackbar('Success', { variant: 'success' });
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
        // Prepare input to match the structure in the backend

        const response = await getPipelineTasksRun({ pipelineID: pipelineId, runID, environmentID });

        if (response.r === 'Unauthorized') {
            closeSnackbar();
            enqueueSnackbar(`Can't update flow: ${response.r}`, { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message + ': update flow failed', { variant: 'error' }));
        } else {
            response.map((a) => RunState[a.node_id].set({ status: a.status }));
            RunState.run_id.set(response.map((a) => a.run_id)[0]);
            RunState.start_dt.set(response.map((a) => a.start_dt)[0]);
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
