import { Box, Button, Grid, Typography } from '@mui/material';
import { useSnackbar } from 'notistack';
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useStopPipelines } from '../../graphql/stopPipelines';
import { useGlobalPipelineRun} from './GlobalPipelineRunUIState'
import StatusChips from './StatusChips';
import RunsDropdown from './RunsDropdown';
import { useGlobalRunState } from './GlobalRunState';
import EventRunButton from './EventRunButton'
import { v4 as uuidv4 } from 'uuid';
import { useGlobalAuthState } from '../../Auth/UserAuth';
// import { usePipelineTasksRunHook } from './UpdatePipelineColours';
import { displayTimer, displayTimerMs } from '../../utils/formatDate';


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
    const [runId, setRunId] = useState("");

    // GraphQL hooks - not run at this point
    // const getPipelineTasksRun = usePipelineTasksRunHook();
    // const stopPipelines = useStopPipelinesHook(getPipelineTasksRun);

    // Instantiate websocket for start/stop run - not opening websockets yet
    // useOnRunWebSocket(environmentID, setRuns, setSelectedRun);

    // Click Run button and start to run the pipeline
    const handleTimerStart = () => {
        RunState.runTrigger.set((t) => t + 1);
    };


    /*
    On click of run button, this UseEffect state keeps websockets open for run
    Update drop down menu with the latest run
    Set the current run for graph to show
    */
    EventRunButton(environmentID, pipeline?.pipelineID, runId, setRuns, setSelectedRun, Running, setRunning, wsconnect)

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
        const authtokenget = authToken.get()
        const wsurl = `${websocketEndpoint}/${environmentID}?subject=taskupdate.${environmentID}.${runId}&id=${runId}&token=${authtokenget}`
        const ws = new WebSocket(wsurl);
        setWsConnect(ws)
        setRunId(runId)
        setRunning(true)
        // 
        
        // ------- Handled inside EventRunButton ----------
        // 3. Call Run pipeline
        // 4. Start timer
        // 5. Get pipeline runs
        // 6. Update run dropdown menu

    }

    // Click the stop button and run the stopPipelines function - with the selected RunID
    const handleTimerStop = () => {
        // stopPipelines(environmentID, RunState.selectedRunID.get());
        FlowState.isRunning.set(false);
    };

    // Updates timer every second
    useEffect(() => {
        let secTimer;
        if (FlowState.isRunning.get()) {
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
    }, [FlowState.isRunning.get()]);

    return (
        <Grid item>
            <Box display="flex" alignItems="center">
                {FlowState.isRunning.get() && !RunState.runIDs[RunState.selectedRunID.get()]?.runEnd?.get() ? (
                    <Button
                        onClick={handleTimerStop}
                        variant="outlined"
                        color="error"
                        sx={{ width: 70, fontWeight: '700', fontSize: '.81rem', border: 2, '&:hover': { border: 2 } }}>
                        Stop
                    </Button>
                ) : (
                    <Button onClick={RunButtonClick} variant="outlined" sx={{ width: 70, fontWeight: '700', fontSize: '.81rem', border: 2, '&:hover': { border: 2 } }}>
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

const useStopPipelinesHook = (getPipelineTasksRun) => {
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
            RunState.runIDs[response.run_id].merge({
                runEnd: response.ended_at,
            });
            getPipelineTasksRun(response.run_id, environmentID);
        }
    };
};
