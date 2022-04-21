import { Autocomplete, Grid, TextField } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useGetPipelineRuns } from '../../graphql/getPipelineRuns';
import { useSnackbar } from 'notistack';
import { formatDateNoZone } from '../../utils/formatDate';
import { useGlobalMeState } from '../../components/Navbar';
import { GetPipelineFlow } from './PipelineFlowStructure';
import { GetPipelineRun } from './PipelineRunStructure';
import { usePipelineTasksColoursRun } from './UpdatePipelineColours';
import EventRunOpen from './EventRunOpen';
import { useGlobalAuthState } from '../../Auth/UserAuth';


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

/*
Input:
runs, setRuns - state set at RunNavBar level but are set inside this component
*/
export default function RunsDropdown({ environmentID, pipeline, runs, setRuns, selectedRun, setSelectedRun }) {
    // Global states
    // const RunState = useGlobalPipelineRun();
    const MeData = useGlobalMeState();
    const { authToken } = useGlobalAuthState();

    // Local state
    const [isNewFlow, setIsNewFlow] = useState(false);

    // Graphql functions
    const getPipelineRuns = useGetPipelineRuns();
    const getPipelineFlow = GetPipelineFlow();
    const getPipelineRun = GetPipelineRun();
    const getPipelineTasks = usePipelineTasksColoursRun();

    const { enqueueSnackbar } = useSnackbar();

    const [Running, setRunning] = useState(false);
    const [wsconnect, setWsConnect] = useState();
    const [runId, setRunId] = useState("");

    EventRunOpen(runId, Running, setRunning, wsconnect)

    // ------ On page load get the latest run -------- 
    useEffect(() => {
        (async () => {

            // --------  1. Retrieve the the previous runs:
            const response = await getPipelineRuns({ pipelineID: pipeline.pipelineID, environmentID });

            // console.log("Runs response:", response)
    
            if (response.length === 0) {
                setRuns([]);
                // If there are no runs to get flow info, run getPipelineFlow instead
                // getPipelineFlow(environmentID);
            } else if (response.r || response.error) {
                enqueueSnackbar("Can't get runs: " + (response.msg || response.r || response.error), { variant: 'error' });
            } else if (response.errors) {
                response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
            } else {
                setRuns(response);
                // return [response[0]?.updated_at, response[0].run_id];
            }

            let lastRunTime = response[0]?.updated_at
            let runID = response[0]?.run_id

            // On page load select the latest response
            // console.log("Run ID:", runID)

            // If there is no runID then show the structure without RunID
            if (runID == null){

            // Get the flow of the latest run or if no flow then get structure
            // console.log("Pipeline ID:", pipeline.pipelineID)
            const flowstructure = await getPipelineFlow({ pipelineId: pipeline.pipelineID, environmentID});
            }else{
                // If there is a run then get the run structure 
                setSelectedRun(response[0])
                const runstructure = await getPipelineRun(pipeline.pipelineID, runID, environmentID);
            }

            // If the pipeline has a new flow, get only the flow and return
            const isNewFlow = pipeline.updated_at > lastRunTime;
            if (isNewFlow) {
                setIsNewFlow(true);
                // getPipelineFlow(environmentID);
                return;
            }

        })();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /* 
    On the update of the run, consider if running or not 
    ----------- 2. Is the pipeline running or not?
        if yes --- websockets + graphql tasks update
        if no ---- graphql tasks update
    */
    useEffect(() => {

        (async () => {
            
        if (selectedRun!= null){
            // console.log("I am the selected run:", selectedRun)
            if (selectedRun.status == "Running"){

                const authtokenget = authToken.get()
                const wsurl = `${websocketEndpoint}/${environmentID}?subject=taskupdate.${environmentID}.${selectedRun.run_id}&id=${selectedRun.run_id}&token=${authtokenget}`
                const ws = new WebSocket(wsurl);
                setWsConnect(ws)
                setRunId(selectedRun.run_id)
                setRunning(true)

                const runtaskscolours = await getPipelineTasks(pipeline.pipelineID, selectedRun.run_id, environmentID, false);

            }else{
                // console.log("change run:", selectedRun.status)
                const runtaskscolours = await getPipelineTasks(pipeline.pipelineID, selectedRun.run_id, environmentID, false);
            }
        }
    })();

    },[selectedRun])

    // Update elements on run dropdown change
    const handleDropdownChange = (run) => {

        // Update the selected run state
        setSelectedRun(run);

        // Retrieve the run structure
        const runstructure = getPipelineRun(pipeline.pipelineID, run.run_id, environmentID);

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





