import { Autocomplete, Grid, TextField } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useGetDeploymentRuns } from '../../../graphql/getDeploymentRuns';
import { useHistory, useParams } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { usePipelineTasksRun } from '../../../graphql/getPipelineTasksRun';
import { useGlobalFlowState } from '../../PipelineEdit';
import { useGlobalDeploymentState } from './GlobalDeploymentState';
import { useGlobalMeState } from '../../../components/Navbar';
import { useGetPipelineFlow } from '../../../graphql/getPipelineFlow';
import useOnPageLoadWebSocket, { addDdash } from './useOnPageLoadWebSocket';
import useOnChangeDropdownWebSocket from './useOnChangeDropdownWebSocket';
import { formatDateNoZone } from '../../../utils/formatDate';
import { prepareInputForFrontend } from '../../../utils/PipelinePrepareGraphInput';

export default function RunsDropdown({ environmentID, deployment, runs, setRuns, selectedRun, setSelectedRun }) {
    // Global states
    const DeploymentState = useGlobalDeploymentState();
    const MeData = useGlobalMeState();

    // GraphQL hooks
    const getDeploymentRuns = useGetDeploymentRunsHook(environmentID, setRuns);
    const getPipelineFlow = useGetPipelineFlowHook(deployment.pipelineID);

    // Instantiate websocket for on page load
    useOnPageLoadWebSocket(environmentID, setSelectedRun, setRuns);

    // Instantiate websocket for dropdown change
    useOnChangeDropdownWebSocket(environmentID, setSelectedRun);

    // Get pipeline runs on load
    useEffect(() => {
        (async () => {
            let runID = await getDeploymentRuns(getPipelineFlow);

            // No runID means, there are no runs yet, return.
            if (!runID) return;

            DeploymentState.merge({
                selectedRunID: runID,
                onLoadTrigger: 1,
            });
        })();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Update elements on run dropdown change
    const handleDropdownChange = (run) => {
        setSelectedRun(run);
        DeploymentState.merge((r) => ({
            selectedRunID: run.run_id,
            onChangeTrigger: r.onChangeTrigger + 1,
        }));
    };

    return (
        <Grid item alignItems="center" display="flex" width={520}>
            {selectedRun ? (
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

// ------ Custom hook
export const useGetDeploymentRunsHook = (environmentID, setRuns) => {
    // GraphQL hook
    const getDeploymentRuns = useGetDeploymentRuns();

    // URI parameter
    const { deploymentId, version } = useParams();

    const { enqueueSnackbar } = useSnackbar();

    // Get runs
    return async (getPipelineFlow) => {
        const response = await getDeploymentRuns({ deploymentID: deploymentId, environmentID, version });

        if (response.length === 0) {
            setRuns([]);
            getPipelineFlow(environmentID);
            return;
        } else if (response.r || response.error) {
            enqueueSnackbar("Can't get runs: " + (response.msg || response.r || response.error), { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            setRuns(response);
            return response[0].run_id;
        }
    };
};

export const usePipelineTasksRunHook = () => {
    // GraphQL hook
    const getPipelineTasksRun = usePipelineTasksRun();

    // URI parameter
    const { deploymentId } = useParams();

    const DeploymentState = useGlobalDeploymentState();

    const { enqueueSnackbar } = useSnackbar();

    // Get tasks
    return async (runID, environmentID) => {
        if (!runID) return;

        const response = await getPipelineTasksRun({ pipelineID: deploymentId, runID, environmentID });

        if (response.r || response.error) {
            enqueueSnackbar("Can't get tasks: " + (response.msg || response.r || response.error), { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            const nodes = {};
            response.map(
                (a) =>
                    (nodes[a.node_id] = {
                        status: a.status,
                        end_dt: a.end_dt,
                        start_dt: a.start_dt,
                    })
            );
            DeploymentState.batch((s) => {
                s.selectedRunID.set(response[0].run_id);
                s.runIDs[response[0].run_id].nodes.set(nodes);
            }, 'tasks-batch');
        }
    };
};

const useGetPipelineFlowHook = () => {
    // GraphQL hook
    const getPipelineFlow = useGetPipelineFlow();

    // Global state
    const FlowState = useGlobalFlowState();

    // URI parameter
    const { deploymentId } = useParams();

    const { enqueueSnackbar } = useSnackbar();

    // Get members
    return async (environmentID) => {
        const rawResponse = await getPipelineFlow({ pipelineID: deploymentId.replace('d-', ''), environmentID });
        const response = prepareInputForFrontend(rawResponse);

        if (response.r || response.error) {
            enqueueSnackbar("Can't get flow: " + (response.msg || response.r || response.error), { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            FlowState.elements.set(addDdash(response));
            return;
        }
    };
};

