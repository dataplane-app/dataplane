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
import { GetPipelineFlow } from './PipelineFlowStructure';
import { GetPipelineRun } from './PipelineRunStructure';


/*
Input:
runs, setRuns - state set at RunNavBar level but are set inside this component
*/
export default function RunsDropdown({ environmentID, pipeline, runs, setRuns, selectedRun, setSelectedRun }) {
    // Global states
    const RunState = useGlobalPipelineRun();
    const MeData = useGlobalMeState();

    // Local state
    const [isNewFlow, setIsNewFlow] = useState(false);

    // Graphql
    const getPipelineRuns = useGetPipelineRuns();
    const getPipelineFlow = GetPipelineFlow();
    const getPipelineRun = GetPipelineRun();

    const { enqueueSnackbar } = useSnackbar();

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

        if (selectedRun!= null){
            console.log("I am the selected run:", selectedRun)
            if (selectedRun.status == "Running"){

            }else{
                
            }
        }

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





