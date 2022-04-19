import { Box, Button, Grid, Typography } from '@mui/material';
import { useSnackbar } from 'notistack';
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useStopPipelines } from '../../../graphql/stopPipelines';
import StatusChips from './StatusChips';
import RunsDropdown, { usePipelineTasksRunHook } from './RunsDropdown';
import { useGlobalDeploymentState } from './GlobalDeploymentState';
import useOnRunWebSocket from './useOnRunWebSocket';
import { displayTimerMs } from '../../PipelineRuns/RunsDropdown';

export default function StartStopRun({ environmentID, deployment }) {
    // Global state
    const DeploymentState = useGlobalDeploymentState();

    // Local state
    const [elapsed, setElapsed] = useState();
    const [runs, setRuns] = useState([]);
    const [selectedRun, setSelectedRun] = useState(null);

    // GraphQL hooks
    const getPipelineTasksRun = usePipelineTasksRunHook();
    const stopPipelines = useStopPipelinesHook(getPipelineTasksRun);

    // URI parameter
    const { version } = useParams();

    // Instantiate websocket for start/stop run
    useOnRunWebSocket(environmentID, setRuns, setSelectedRun);

    const handleTimerStart = () => {
        DeploymentState.runTrigger.set((t) => t + 1);
    };

    const handleTimerStop = () => {
        stopPipelines(environmentID, DeploymentState.selectedRunID.get());
        DeploymentState.isRunning.set(false);
    };

    // Updates timer every second
    useEffect(() => {
        let secTimer;
        if (DeploymentState.isRunning.get()) {
            secTimer = setInterval(() => {
                setElapsed(displayTimer(DeploymentState.runIDs[DeploymentState.selectedRunID.get()]?.runStart?.get()));
            }, 500);
        }

        if (DeploymentState.runIDs[DeploymentState.selectedRunID.get()]?.runEnd?.get()) {
            clearInterval(secTimer);
            setElapsed(0);
        }

        return () => {
            clearInterval(secTimer);
            setElapsed(0);
        };

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [DeploymentState.isRunning.get()]);

    return (
        <Grid item>
            <Box display="flex" alignItems="center">
                {DeploymentState.isRunning.get() && !DeploymentState.runIDs[DeploymentState.selectedRunID.get()]?.runEnd?.get() ? (
                    <Button
                        onClick={handleTimerStop}
                        variant="outlined"
                        color="error"
                        sx={{ mr: 3, width: 70, fontWeight: '700', fontSize: '.81rem', border: 2, '&:hover': { border: 2 } }}>
                        Stop
                    </Button>
                ) : deployment?.version === version ? (
                    <Button onClick={handleTimerStart} variant="outlined" sx={{ mr: 3, width: 70, fontWeight: '700', fontSize: '.81rem', border: 2, '&:hover': { border: 2 } }}>
                        Run
                    </Button>
                ) : null}

                <StatusChips />

                {deployment && environmentID ? (
                    <RunsDropdown environmentID={environmentID} deployment={deployment} runs={runs} setRuns={setRuns} selectedRun={selectedRun} setSelectedRun={setSelectedRun} />
                ) : null}

                {!DeploymentState.runIDs[DeploymentState.selectedRunID.get()]?.runEnd?.get() ? (
                    // If looking at an active run, show live timer
                    DeploymentState.isRunning.get() ? (
                        <Typography variant="h3" ml={2}>
                            {elapsed ? elapsed : DeploymentState.isRunning.get() ? '' : '00:00:00'}
                        </Typography>
                    ) : (
                        // If looking at a previous run during an active run
                        <Typography variant="h3" ml={2}>
                            {displayTimerMs(
                                DeploymentState.runIDs[DeploymentState.selectedRunID.get()]?.runStart?.get(),
                                DeploymentState.runIDs[DeploymentState.selectedRunID.get()]?.runEnd?.get()
                            )}
                        </Typography>
                    )
                ) : (
                    // If there is no active run.
                    <Typography variant="h3" ml={2}>
                        {displayTimerMs(
                            DeploymentState.runIDs[DeploymentState.selectedRunID.get()]?.runStart?.get(),
                            DeploymentState.runIDs[DeploymentState.selectedRunID.get()]?.runEnd?.get()
                        )}
                    </Typography>
                )}
            </Box>
        </Grid>
    );
}

// Custom GraphQL hooks
const useStopPipelinesHook = (getPipelineTasksRun) => {
    // GraphQL hook
    const stopPipelines = useStopPipelines();

    const DeploymentState = useGlobalDeploymentState();

    // URI parameter
    const { deploymentId } = useParams();

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    // Stop deployment flow
    return async (environmentID, runID) => {
        const response = await stopPipelines({ pipelineID: deploymentId, environmentID, runID, RunType: 'deployment' });

        if (response.r === 'error') {
            closeSnackbar();
            enqueueSnackbar("Can't stop flow: " + response.msg, { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            DeploymentState.runIDs[response.run_id].merge({
                runEnd: response.ended_at,
            });
            getPipelineTasksRun(response.run_id, environmentID);
        }
    };
};

// Utility function
export function displayTimer(startDate, endDate = new Date()) {
    if (typeof endDate === 'string') {
        endDate = new Date(endDate);
    }
    if (!startDate) return '';
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
