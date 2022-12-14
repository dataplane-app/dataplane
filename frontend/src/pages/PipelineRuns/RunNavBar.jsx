import { Box, Button, Grid, Typography } from '@mui/material';
import { useSnackbar } from 'notistack';
import React, { useEffect, useState } from 'react';
import { useStopPipelines } from '../../graphql/stopPipelines';
import { useGlobalPipelineRun } from './GlobalPipelineRunUIState';
import StatusChips from './StatusChips';
import RunsDropdown from './RunsDropdown';
import { useGlobalRunState } from './GlobalRunState';
import EventRunButton from './EventRunButton';
import { v4 as uuidv4 } from 'uuid';
import { useGlobalAuthState } from '../../Auth/UserAuth';
import { displayTimer, displayTimerMs } from '../../utils/formatDate';
import { usePipelineTasksColoursRun } from './UpdatePipelineColours';

var loc = window.location,
    new_uri;
if (loc.protocol === 'https:') {
    new_uri = 'wss:';
} else {
    new_uri = 'ws:';
}
new_uri += '//' + loc.host;

if (process.env.REACT_APP_DATAPLANE_ENV === 'build') {
    new_uri += process.env.REACT_APP_WEBSOCKET_ROOMS_ENDPOINT;
} else {
    new_uri = process.env.REACT_APP_WEBSOCKET_ROOMS_ENDPOINT;
}

const websocketEndpoint = new_uri;

export default function RunNavBar({ environmentID, pipeline }) {
    // Global state
    const FlowState = useGlobalPipelineRun();
    const RunState = useGlobalRunState();
    const { authToken } = useGlobalAuthState();

    // Local state
    const [elapsed, setElapsed] = useState();

    // Set by RunsDropdown.jsx - on page load and on click run
    const [runs, setRuns] = useState([]);
    const [selectedRun, setSelectedRun] = useState(null);
    const [Running, setRunning] = useState(false);
    const [wsconnect, setWsConnect] = useState();
    const [ReconnectWS, setReconnectWS] = useState(true);
    const [runId, setRunId] = useState('');

    // GraphQL hooks - not run at this point
    // const getPipelineTasksRun = usePipelineTasksRunHook();

    const getPipelineTasks = usePipelineTasksColoursRun();
    const stopPipelines = useStopPipelinesHook(getPipelineTasks);

    // Click Run button and start to run the pipeline
    // const handleTimerStart = () => {
    //     RunState.runTrigger.set((t) => t + 1);
    // };

    /*
    On click of run button, this UseEffect state keeps websockets open for run
    Update drop down menu with the latest run
    Set the current run for graph to show
    */
    EventRunButton(environmentID, pipeline?.pipelineID, runId, setRuns, setSelectedRun, Running, setRunning, wsconnect, ReconnectWS);

    const RunButtonClick = () => {
        // 1. Generate run ID
        const runId = uuidv4();

        // console.log("run clicked")

        // 2. Open websockets
        /* 
        Inputs:
        setRuns - dropdown menu, on run will bring back the latest 20
        setSelectedRun - set the run to the latest run on button press
        */
        const authtokenget = authToken.get();
        const wsurl = `${websocketEndpoint}/taskupdate.${environmentID}.${runId}?token=${authtokenget}`;
        const ws = new WebSocket(wsurl);
        setWsConnect(ws);
        setRunId(runId);
        setRunning(true);
        //

        // ------- Handled inside EventRunButton ----------
        // 3. Call Run pipeline
        // 4. Start timer
        // 5. Get pipeline runs
        // 6. Update run dropdown menu
    };

    const StopButtonClick = () => {
        FlowState.isRunning.set(false);
        setRunning(false);
        // pipelineID, environmentID, runID
        stopPipelines(pipeline?.pipelineID, environmentID, RunState.selectedRunID.get());
    };

    const runstart = RunState.runObject?.runStart?.get();
    const runEnd = RunState.runObject?.runEnd?.get();
    // console.log(runstart)

    // Updates timer every second
    useEffect(() => {
        // console.log("Running: ", FlowState.isRunning.get(), RunState.runObject?.get())
        let secTimer;
        if (FlowState.isRunning.get()) {
            secTimer = setInterval(() => {
                setElapsed(displayTimer(RunState.runObject?.runStart?.get()));
            }, 500);
        }

        if (RunState.runObject?.runEnd?.get()) {
            clearInterval(secTimer);
            setElapsed(0);
        }

        return () => {
            clearInterval(secTimer);
            setElapsed(0);
        };

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [runstart, runEnd]);

    return (
        <Grid item>
            <Box display="flex" alignItems="center">
                {/* {console.log(FlowState.isRunning.get())} */}
                {FlowState.isRunning.get() ? (
                    <Button
                        onClick={StopButtonClick}
                        variant="outlined"
                        color="error"
                        sx={{ width: 70, fontWeight: '700', fontSize: '.81rem', border: 2, '&:hover': { border: 2 } }}>
                        Stop
                    </Button>
                ) : FlowState.elements.get().length > 0 ? (
                    <Button
                        id="pipeline-run-button"
                        onClick={RunButtonClick}
                        variant="outlined"
                        sx={{ width: 70, marginRight: '24px', fontWeight: '700', fontSize: '.81rem', border: 2, '&:hover': { border: 2 } }}>
                        Run
                    </Button>
                ) : null}

                <StatusChips />

                {pipeline && environmentID ? (
                    <RunsDropdown
                        environmentID={environmentID}
                        pipeline={pipeline}
                        runs={runs}
                        setRuns={setRuns}
                        selectedRun={selectedRun}
                        setSelectedRun={setSelectedRun}
                        wsconnect={wsconnect}
                        setWsConnect={setWsConnect}
                        ReconnectWS={ReconnectWS}
                        setReconnectWS={setReconnectWS}
                    />
                ) : null}

                {!RunState.runObject?.runEnd?.get() ? (
                    // If looking at an active run, show live timer
                    <Typography variant="h3" ml={2}>
                        {elapsed ? elapsed : FlowState.isRunning.get() ? '' : '00:00:00'}
                    </Typography>
                ) : (
                    // If there is no active run.
                    <Typography variant="h3" ml={2}>
                        {displayTimerMs(RunState.runObject?.runStart?.get(), RunState.runObject?.runEnd?.get())}
                    </Typography>
                )}
            </Box>
        </Grid>
    );
}

const useStopPipelinesHook = (getPipelineTasks) => {
    // GraphQL hook
    const stopPipelines = useStopPipelines();

    const RunState = useGlobalRunState();

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    // Stop pipeline flow
    return async (pipelineID, environmentID, runID) => {
        const response = await stopPipelines({ pipelineID, environmentID, runID, RunType: 'pipeline' });

        if (response.r === 'error') {
            closeSnackbar();
            enqueueSnackbar("Can't stop flow: " + response.msg, { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            RunState.runObject?.merge({
                runEnd: response.ended_at,
            });
            await getPipelineTasks(pipelineID, runID, environmentID, false);
            // getPipelineTasksRun(response.run_id, environmentID);
        }
    };
};
