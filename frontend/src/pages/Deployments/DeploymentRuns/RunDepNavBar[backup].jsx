import { Box, Button, Grid, Typography } from '@mui/material';
import { useSnackbar } from 'notistack';
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useStopPipelines } from '../../../graphql/stopPipelines';
import RunsDropdown, { usePipelineTasksRunHook } from './RunsDropdown';
import StatusChips from '../../PipelineRuns/StatusChips';
import { useGlobalDeploymentState } from './GlobalDeploymentState';
import useOnRunWebSocket from './useOnRunWebSocket';
import { displayTimerMs, displayTimer } from '../../../utils/formatDate';

export default function RunDepNavBar({ environmentID, deployment }) {
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
        RunState.runTrigger.set((t) => t + 1);
    };

    const handleTimerStop = () => {
        stopPipelines(environmentID, RunState.selectedRunID.get());
        RunState.isRunning.set(false);
    };

    // Updates timer every second
    useEffect(() => {
        let secTimer;
        if (RunState.isRunning.get()) {
            secTimer = setInterval(() => {
                setElapsed(displayTimer(RunState.runIDs[RunState.selectedRunID.get()]?.runStart?.get()));
            }, 500);
        }

        if (RunState.runIDs[RunState.selectedRunID.get()]?.runEnd?.get()) {
            clearInterval(secTimer);
            setElapsed(0);
        }

        return () => {
            clearInterval(secTimer);
            setElapsed(0);
        };

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [RunState.isRunning.get()]);

    return (
        <Grid item>
            <Box display="flex" alignItems="center">
                {RunState.isRunning.get() && !RunState.runIDs[RunState.selectedRunID.get()]?.runEnd?.get() ? (
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

                {!RunState.runIDs[RunState.selectedRunID.get()]?.runEnd?.get() ? (
                    // If looking at an active run, show live timer
                    RunState.isRunning.get() ? (
                        <Typography variant="h3" ml={2}>
                            {elapsed ? elapsed : RunState.isRunning.get() ? '' : '00:00:00'}
                        </Typography>
                    ) : (
                        // If looking at a previous run during an active run
                        <Typography variant="h3" ml={2}>
                            {displayTimerMs(
                                RunState.runIDs[RunState.selectedRunID.get()]?.runStart?.get(),
                                RunState.runIDs[RunState.selectedRunID.get()]?.runEnd?.get()
                            )}
                        </Typography>
                    )
                ) : (
                    // If there is no active run.
                    <Typography variant="h3" ml={2}>
                        {displayTimerMs(
                            RunState.runIDs[RunState.selectedRunID.get()]?.runStart?.get(),
                            RunState.runIDs[RunState.selectedRunID.get()]?.runEnd?.get()
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
            RunState.runIDs[response.run_id].merge({
                runEnd: response.ended_at,
            });
            getPipelineTasksRun(response.run_id, environmentID);
        }
    };
};
