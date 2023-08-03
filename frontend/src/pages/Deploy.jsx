import { styled } from '@mui/system';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Autocomplete, Box, Button, Drawer, Grid, TextField, Typography, useTheme } from '@mui/material';
import { useSnackbar } from 'notistack';
import { useEffect, useReducer, useState } from 'react';
import { IOSSwitch } from '../components/DrawerContent/SchedulerDrawer/IOSSwitch';
import { useGlobalEnvironmentsState, useGlobalEnvironmentState } from '../components/EnviromentDropdown';
import { useGetEnvironments } from '../graphql/getEnvironments';
import { useForm } from 'react-hook-form';
import { useGetNonDefaultWGNodes } from '../graphql/getNonDefaultWGNodes';
import { useGetPipeline } from '../graphql/getPipeline';
import { useHistory, useParams } from 'react-router-dom';
import { useAddDeployment } from '../graphql/deployments/addDeployment';
import { useState as useHookState } from '@hookstate/core';
// import { useGetPipelineHook } from './PipelineRuns';
import { useGetActiveDeployment } from '../graphql/deployments/getActiveDeployment';
import { useGetWorkerGroups } from '../graphql/getWorkerGroups';
import DeployAPITRiggerDrawer from '../components/DrawerContent/DeployAPITriggerDrawer';
import { v4 as uuidv4 } from 'uuid';
import { useGetDeploymentTrigger } from '../graphql/deployments/getDeploymentTrigger';
import { useGenerateDeploymentTrigger } from '../graphql/deployments/generateDeploymentTrigger';
// import { useGetRemoteProcessGroupsForAnEnvironment } from '../graphql/getRemoteProcessGroupsForAnEnvironment';

let host = process.env.REACT_APP_DATAPLANE_ENDPOINT;
if (host === '') {
    host = window.location.origin;
}
const PUBLIC = `${host}/publicapi/deployment/api-trigger/latest/`;
const PRIVATE = `https://{{ HOST }}/privateapi/deployment/api-trigger/latest/`;

const initialState = {
    publicLive: true,
    privateLive: true,
    apiKeyActive: false,
};

const Deploy = () => {
    // Environment global state
    const Environment = useGlobalEnvironmentState();

    const onlineswitch = ['schedule']

    // Local state
    const [deployment, setDeployment] = useState(null);
    const [selectedEnvironment, setSelectedEnvironment] = useState(null);
    const [availableEnvironments, setAvailableEnvironments] = useState([]);
    const [availableWorkerGroups, setAvailableWorkerGroups] = useState([]);
    const [pipeline, setPipeline] = useState(null);
    const [live, setLive] = useState(true);
    // const [workerGroup, setWorkerGroup] = useState(null);
    const nonDefaultWGNodes = useHookState([]);
    
    // ------ clear values in drop down ----------
    // const [values, setValues] = useState("");
    // const onChange = (_, value) => {
    //     setValues(value);
    //   };
    //   const clearSelected = () => {
    //     setValues([]);
    //   };

    // non-default worker count
    // let nondefaultworkercount = 0;

    // Local state for trigger
    const [apiDrawerOpen, setApiDrawerOpen] = useState(false);
    const [triggerID, setTriggerID] = useState(() => uuidv4());
    const [switches, dispatch] = useReducer((switches, newState) => ({ ...switches, ...newState }), initialState);

    // Theme hook
    const theme = useTheme();

    // React hook form
    const { register, handleSubmit, reset } = useForm();
    // formState: { formerrors }

    // React router
    const { pipelineId } = useParams();
    const history = useHistory();

    // Declare the Graphql Hooks, called below in useEffect
    const getEnvironments = useGetEnvironmentsHook(setAvailableEnvironments);
    const getWorkerGroups = useGetWorkerGroupsHook(setAvailableWorkerGroups); //nonDefaultWGNodes[0]?.nodeTypeDesc?.get()
    const getNonDefaultWGNodes = useGetNonDefaultWGNodesHook(nonDefaultWGNodes, selectedEnvironment);
    const addDeployment = useAddDeploymentHook();
    const getPipeline = useGetPipelineHook(Environment.id.get(), setPipeline);

    // Get any existing deployments for this pipeline - called below when the drop down menu for environment is selected
    const getActiveDeployment = useGetDeploymentHook(selectedEnvironment?.id, 'd-' + pipelineId, setDeployment);
    
    
    // Graphql API Trigger Hooks
    const getDeploymentTriggerHook = useGetDeploymentTriggerHook(Environment.id.get(), setTriggerID, dispatch);
    const generateDeploymentTrigger = useGenerateDeploymentTriggerHook(Environment.id.get(), triggerID, switches, dispatch);

    // ------ ON PAGE LOAD ---------
    // ------ Get data for environments, pipeline and deployment on load ---------
    useEffect(() => {
        if (!Environment.id?.get()) return;

        // We need a list of environments to deploy the pipeline to. 
        getEnvironments();
        getPipeline();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [Environment.id?.get()]);

    useEffect(() => {
        if (!pipeline) return;
    // ------ SET PAGE TITLE ON PIPELINE CHANGE ---------
    document.title = 'Deploy pipeline: ' + pipeline?.name + ' | DataPlane';
    }, [pipeline]);

    // ------ ON ENVIRONMENT DROP DOWN CHANGE ---------
    /* The drop down menu that selects an environment will set selectedEnvironment and trigger this section */
    useEffect(() => {
        if (!selectedEnvironment) return;

        // This is a list of workers that are specific to a pipeline step i.e. non-default 
        // A bit legacy as all nodes now have a specific worker group i.e. this will return all nodes.
        getNonDefaultWGNodes(Environment.id?.get(), selectedEnvironment.id);

        // Get available worker groups for the selected environment
        getWorkerGroups(selectedEnvironment.id);

        // Given environment, get any existing deployment for this pipeline and versioning
        getActiveDeployment();

        // Retrieve data about the API trigger for an existing deployment
        if(pipeline?.node_type_desc === 'api') {
        getDeploymentTriggerHook();
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedEnvironment]);


    // Check for worker groups after nonDefaultWGNodes is fetched
    // useEffect(() => {

        // console.log('nonDefaultWGNodes', nonDefaultWGNodes.get())
        // if (nonDefaultWGNodes.length === 0) return;
       

        // console.log("Deployment:", deployment, workerGroup, availableWorkerGroups);

        // eslint-disable-next-line react-hooks/exhaustive-deps
    // }, [nonDefaultWGNodes.length]);

    // Populate values on load
    useEffect(() => {
        if (!deployment) return;
        if (!pipeline) return;

        // console.log("active deployments:", deployment, pipeline)
        
        // If deployment is set then populate the form with the version number
        if (deployment.environmentID !== "") {
            // setWorkerGroup(deployment.workerGroup);

            // reset set values in the useForm hook
            reset({
                major: deployment.version.split('.')[0],
                minor: deployment.version.split('.')[1],
                patch: deployment.version.split('.')[2],
                // workerGroupDefault: deployment.workerGroup,
            });
            setLive(deployment.online);
        } else {
            // setWorkerGroup(pipeline.workerGroup);
            reset({ major: '0', minor: '0', patch: '0', workerGroup: null });
            setLive(true);
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [deployment]);

    // // Set worker group on load
    // useEffect(() => {
    //     if (workerGroups.length === 0) return;
    //     setWorkerGroup(workerGroups.filter((a) => a.WorkerGroup === rest.pipeline.workerGroup)[0]);
    // }, [rest.pipeline.workerGroup, workerGroups]);

    const handleClose = () => {
        history.push(`/`);
    };

    const onSubmit = (data) => {

        // console.log("Submit nbutton clicked", data, formerrors)


        if (!selectedEnvironment) {
            console.log("No environment selected")
            return;
        }

        if (!pipeline){
            console.log("Pipeline not found on submit")
         return;
        }

        // Where a specific worker group is set against a pipeline step, this is added to the deployment
        const nodeWorkerGroup = nonDefaultWGNodes.get().map((a) => ({
            NodeID: a.nodeID,
            WorkerGroup: a.workerGroup,
        }));

        console.log("nodeWorkerGroup on submit", nodeWorkerGroup);


        let input = {
            pipelineID: pipelineId,
            fromEnvironmentID: Environment.id?.get(),
            toEnvironmentID: selectedEnvironment.id,
            version: `${data.major}.${data.minor}.${data.patch}`,
            workerGroup: data.workerGroupDefault,
            liveactive: live,
            nodeWorkerGroup,
        };

        addDeployment(input);

        // Retrieve data about the API trigger for an existing deployment
        // Should be added to addDeployment to keep it in one transaction
        if(pipeline?.node_type_desc === 'api') {
        generateDeploymentTrigger();
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <Box className="page" height="calc(100vh - 136px)" minHeight="min-content" ml={3}>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={5}>
                    <Typography component="h2" variant="h1">
                        Deploy pipeline - {pipeline?.name}
                    </Typography>

                    <Button
                        onClick={handleClose}
                        style={{ paddingLeft: '16px', paddingRight: '16px', marginLeft: '20px' }}
                        variant="text"
                        startIcon={<FontAwesomeIcon icon={faTimes} />}>
                        Close
                    </Button>
                </Box>
                <Grid container>
                    <Grid item mr={20} mb={5}>
                        <Typography component="h3" variant="h3" color="text.primary" fontWeight="700" fontSize="0.875rem">
                            Deploy to environment
                        </Typography>

                        <Grid mt={2} display="flex" alignItems="center">
                            <Autocomplete
                                onChange={(event, newValue) => {
                                    setSelectedEnvironment(newValue);

                                    // setApiDrawerOpen(true);
                                }}
                                sx={{ minWidth: '212px' }}
                                options={availableEnvironments}
                                getOptionLabel={(option) => option.name}
                                renderInput={(params) => (
                                    <TextField {...params} label="Environment" required id="available_environments" size="small" sx={{ fontSize: '.75rem', display: 'flex' }} />
                                )}
                            />
                        </Grid>

                        {deployment ? (
                            <Box mt={8} width="212px">
                                <Typography component="h3" variant="h3" color="text.primary" fontWeight="700" fontSize="0.875rem">
                                    Version control
                                </Typography>
                                <Grid container alignItems="center" flexWrap="nowrap" justifyContent="flex-start" mt={2} mb={onlineswitch.includes(pipeline.node_type_desc) ? 4 : 8}>
                                    <Grid item display="flex" alignItems="center" sx={{ flexDirection: 'column' }}>
                                        <Typography variant="subtitle1" fontWeight={500} mb={0.6}>
                                            Major
                                        </Typography>

                                        <PatchInput
                                            placeholder="0"
                                            defaultValue={0}
                                            id="major"
                                            size="small"
                                            required
                                            inputProps={{ min: 0, style: { textAlign: 'center', fontWeight: 700, fontSize: '.9375rem' } }}
                                            sx={{ display: 'flex', background: 'background.main', width: '47px' }}
                                            {...register('major', { required: true })}
                                        />
                                    </Grid>
                                    <Grid item display="flex" alignItems="center" sx={{ flexDirection: 'column' }} ml={2} mr={2}>
                                        <Typography variant="subtitle1" fontWeight={500} mb={0.6}>
                                            Minor
                                        </Typography>

                                        <PatchInput
                                            type="number"
                                            placeholder="0"
                                            defaultValue={0}
                                            id="major"
                                            size="small"
                                            required
                                            inputProps={{ min: 0, style: { textAlign: 'center', fontWeight: 700, fontSize: '.9375rem' } }}
                                            sx={{ display: 'flex', background: 'background.main', width: '47px' }}
                                            {...register('minor', { required: true })}
                                        />
                                    </Grid>
                                    <Grid item display="flex" alignItems="center" sx={{ flexDirection: 'column' }}>
                                        <Typography variant="subtitle1" fontWeight={500} mb={0.6}>
                                            Patch
                                        </Typography>

                                        <PatchInput
                                            placeholder="0"
                                            defaultValue={0}
                                            id="major"
                                            size="small"
                                            required
                                            inputProps={{ min: 0, style: { textAlign: 'center', fontWeight: 700, fontSize: '.9375rem' } }}
                                            sx={{ display: 'flex', background: 'background.main', width: '47px' }}
                                            {...register('patch', { required: true })}
                                        />
                                    </Grid>
                                </Grid>

                                {/* In list of array trigger which has online - only scheduler at this point */}
                                {onlineswitch.includes(pipeline.node_type_desc) ? (
                                    <Grid container alignItems="center" mb={4}>
                                        <IOSSwitch onClick={() => setLive(!live)} checked={live} inputProps={{ 'aria-label': 'controlled' }} />
                                        <Typography
                                            sx={{ ml: onlineswitch.includes(pipeline.node_type_desc) ? 2 : 0, fontSize: 16, color: live ? 'status.pipelineOnlineText' : 'error.main' }}>
                                            {live ? 'Online' : 'Offline'}
                                        </Typography>
                                    </Grid>
                                ) : null}

                                {availableWorkerGroups.length !== 0 ? (
                                    console.log("availableWorkerGroups", availableWorkerGroups),
                                    <Autocomplete
                                    id="default_worker_group"
                                        options={availableWorkerGroups}

               
                                        defaultValue={deployment.workerGroup || null}
                
                                        // getOptionLabel={(option) => option.title}
                                        // defaultValue={workerGroup}
                                        // getOptionSelected={(option, value) => option.id === value.id}
                                        // getOptionLabel={(option) => option.WorkerGroup || option.name || option}
                                        // onChange={(event, newValue) => {
                                        //     setWorkerGroup(newValue);
                                        // }}

                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                label="Default worker group"
                                                size="small"
                                                required={true}
                                                sx={{ fontSize: '.75rem', display: 'flex' }}
                                                {...register('workerGroupDefault', { required: true })}
                                            />
                                        )}
                                    />
                                ) : null}
                                <Grid mt={4} display="flex" alignItems="center">
                                    <Button type="submit" variant="contained" color="primary" style={{ width: '100%' }}>
                                        Deploy
                                    </Button>
                                </Grid>
                            </Box>
                        ) : null}
                    </Grid>

                    {/* Right side */}
                    {selectedEnvironment ? (
                        <Grid mb={5}>
                            
                                <>
                                {pipeline.node_type_desc === 'api' ? (
                                    <>
                                    <Typography component="h3" variant="h3" color="text.primary" fontWeight="700" fontSize="0.875rem">
                                        API Trigger
                                    </Typography>
                                    <Typography onClick={() => setApiDrawerOpen(true)} fontSize="0.8125rem" mb={4} color="primary.main" sx={{ cursor: 'pointer' }}>
                                        Configure API trigger
                                    </Typography>

                                    <Typography component="h3" variant="h3" color="text.primary" fontWeight="700" fontSize="0.875rem">
                                        Public -
                                        <span style={{ color: switches.publicLive ? theme.palette.success.main : '#F80000' }}>{switches.publicLive ? ' Live ' : ' Offline '}</span>-
                                        Key Protected
                                    </Typography>
                                    <Typography fontSize="0.875rem" mb={4}>
                                        {PUBLIC + triggerID}
                                    </Typography>

                                    <Typography component="h3" variant="h3" color="text.primary" fontWeight="700" fontSize="0.875rem">
                                        Private -
                                        <span style={{ color: switches.privateLive ? theme.palette.success.main : '#F80000' }}>
                                            {switches.privateLive ? ' Live ' : ' Offline '}
                                        </span>
                                        - No key
                                    </Typography>
                                    <Typography fontSize="0.875rem" mb={6}>
                                        {PRIVATE + triggerID}
                                    </Typography>
                                    </>
                            ) : null}

                            </>


                            {nonDefaultWGNodes.get().map((a, index) => (


                            index === 1 && a.workerGroup !== pipeline.workerGroup ? (
                                <div>
                                <b>Assign specific process groups to pipeline steps</b><br />
                                Only required, if the default process group is not used for all pipeline steps.<br />
                                Default process group: {pipeline.workerGroup}<br /><br />
                                </div>
                            // eslint-disable-next-line
                            ) : null

                            ))}


                            {/* {console.log(deployment)} */}
                   

                            {availableWorkerGroups.length !== 0 && nonDefaultWGNodes.get().map(a => (

                                a.workerGroup !== pipeline.workerGroup ? (

                                    // 
                                <Box key={a.nodeID}>
                                    <Typography component="h3" variant="h3" color="text.primary" fontWeight="700" fontSize="0.875rem">
                                        Name: {a.name} 
                                    </Typography>
                                    <Typography mb={1} variant="body1" color="text.primary" fontWeight="400" fontSize="0.875rem" maxWidth={480}>
                                        Description: {a.description} <br />
                                        Process group: {a.workerGroup}
                                    </Typography>
                                    <Autocomplete
                                        options={availableWorkerGroups}
                                        defaultValue={null}
                                        getOptionLabel={(option) => option.label}
                                        // value={a.workerGroup}
                                        // getOptionLabel={(option) => option.WorkerGroup || option.name}
                                        // onInputChange={(event, newValue) => {
                                        //     let idx = nonDefaultWGNodes.get().findIndex((b) => b.name === a.name);
                                        //     if (a.nodeTypeDesc === 'rpa-python') {
                                        //         let workerGroup = availableWorkerGroups.find((a) => a.name === newValue).remoteProcessGroupID;
                                        //         nonDefaultWGNodes[idx].merge({ workerGroup });
                                        //     } else {
                                        //         nonDefaultWGNodes[idx].merge({ workerGroup: newValue });
                                        //     }
                                        // }}
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                {...register('workerGroup', { required: false })}
                                                label="Worker group"
                                                size="small"
                                                sx={{ fontSize: '.75rem', display: 'flex', width: '212px' }}
                                            />
                                        )}
                                    />
                                </Box>
                                ) : null
                            ))}


                        </Grid>
                    ) : null}
                </Grid>
                <Drawer
                    hideBackdrop
                    sx={{ width: 'calc(100% - 203px)', zIndex: 1099, [`& .MuiDrawer-paper`]: { width: 'calc(100% - 203px)', top: 82 } }}
                    anchor="right"
                    open={apiDrawerOpen}
                    onClose={() => setApiDrawerOpen(false)}>
                    <DeployAPITRiggerDrawer //
                        handleClose={() => setApiDrawerOpen(false)}
                        triggerID={triggerID}
                        switches={switches}
                        generateDeploymentTrigger={generateDeploymentTrigger}
                    />
                </Drawer>
            </Box>
        </form>
    );
};

export default Deploy;

// ----- Get a list of environments ----------
// Input state: setAvailableEnvironments that needs to be set below.
const useGetEnvironmentsHook = (setAvailableEnvironments) => {
    // GraphQL hook
    const getEnvironments = useGetEnvironments();

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    // Get environments on load
    return async () => {
        const response = await getEnvironments();

        if (response.r || response.error) {
            closeSnackbar();
            enqueueSnackbar("Can't get environments: " + (response.msg || response.r || response.error), { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            setAvailableEnvironments(response);
        }
    };
};

const useGetNonDefaultWGNodesHook = (nonDefaultWGNodes, selectedEnvironment) => {
    // GraphQL hook
    const getNonDefaultWGNodes = useGetNonDefaultWGNodes();

    const { enqueueSnackbar } = useSnackbar();

    // URI parameter
    const { pipelineId } = useParams();

    // Get non default worker groups
    return async (fromEnvironmentID, toEnvironmentID) => {
        const response = await getNonDefaultWGNodes({ toEnvironmentID, fromEnvironmentID, pipelineID: pipelineId });

        // console.log('worker groups set against nodes:', )

        if (response === null) {
            nonDefaultWGNodes.set([]);
        } else if (response.r || response.error) {
            enqueueSnackbar("Can't get worker groups: " + (response.msg || response.r || response.error), { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            console.log("GetNonDefaultWG", response)
            // let result = response.map(a => ({ label: a.WorkerGroup }));
            nonDefaultWGNodes.set(response);
        }
    };
};

const useAddDeploymentHook = () => {
    // GraphQL hook
    const addDeployment = useAddDeployment();

    const Environments = useGlobalEnvironmentsState();
    const Environment = useGlobalEnvironmentState();

    const history = useHistory();

    const { enqueueSnackbar } = useSnackbar();

    // Add deployment
    return async (input) => {
        const response = await addDeployment(input);

        if (response.r || response.error) {
            enqueueSnackbar("Can't add deployment: " + (response.msg || response.r || response.error), { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            enqueueSnackbar('Success', { variant: 'success' });
            const toEnvironmentName = Environments.get().filter((a) => a.id === input.toEnvironmentID)[0].name;
            Environment.set({ id: input.toEnvironmentID, name: toEnvironmentName });
            history.push('/deployments/');
        }
    };
};

const useGetDeploymentHook = (environmentID, pipelineID, setDeployment) => {
    // GraphQL hook
    const getActiveDeployment = useGetActiveDeployment();

    const { enqueueSnackbar } = useSnackbar();

    // Get active deployment
    return async () => {
        const response = await getActiveDeployment({ environmentID, pipelineID });

        if (response.r || response.error) {
            enqueueSnackbar("Can't get deployment: " + (response.msg || response.r || response.error), { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            console.log("response deployment:", response)
            setDeployment(response);
        }
    };
};

const useGetWorkerGroupsHook = (setWorkerGroups) => {
    // GraphQL hook
    const getWorkerGroups = useGetWorkerGroups();
    // const getRemoteProcessGroupsForAnEnvironment = useGetRemoteProcessGroupsForAnEnvironment();

    const { enqueueSnackbar } = useSnackbar();

    // if (nodeTypeDesc === 'rpa-python') {
    //     // Get remote process groups
    //     return async (environmentID) => {
    //         const response = await getRemoteProcessGroupsForAnEnvironment({ environmentID });

    //         if (response === null) {
    //             setWorkerGroups([]);
    //         } else if (response.r || response.error) {
    //             enqueueSnackbar("Can't get remote process groups: " + (response.msg || response.r || response.error), { variant: 'error' });
    //         } else if (response.errors) {
    //             response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
    //         } else {
    //             setWorkerGroups(response);
    //         }
    //     };
    // } else {
        // Get worker groups
        return async (environmentID) => {
            const response = await getWorkerGroups({ environmentID });

            if (response === null) {
                setWorkerGroups([]);
            } else if (response.r || response.error) {
                enqueueSnackbar("Can't get worker groups: " + (response.msg || response.r || response.error), { variant: 'error' });
            } else if (response.errors) {
                response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
            } else {
                // Only select the name of the worker. 
                let result = response.map(a => ({ label: a.WorkerGroup }));
                // console.log("result", result)
                setWorkerGroups(result);
            }
        };
    // }
};

// ----- Custom API Trigger hook
const useGetDeploymentTriggerHook = (environmentID, setTriggerID, dispatch) => {
    // GraphQL hook
    const getDeploymentTrigger = useGetDeploymentTrigger();

    const { enqueueSnackbar } = useSnackbar();

    // URI parameter
    const { pipelineId } = useParams();

    // Get access groups
    return async () => {
        const response = await getDeploymentTrigger({ deploymentID: 'd-' + pipelineId, environmentID });

        if (response.r || response.error) {
            enqueueSnackbar("Can't get api triggers: " + (response.msg || response.r || response.error), { variant: 'error' });
        } else if (response.errors) {
            if (response.errors[0].message === 'record not found') return;
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            const { triggerID, publicLive, privateLive, apiKeyActive } = response;
            setTriggerID(triggerID);
            dispatch({ publicLive, privateLive, apiKeyActive });
        }
    };
};

// ---------- Custom Hooks

const useGenerateDeploymentTriggerHook = (environmentID, triggerID, switches, dispatch) => {
    // GraphQL hook
    const generateDeploymentTrigger = useGenerateDeploymentTrigger();

    const { enqueueSnackbar } = useSnackbar();

    // URI parameter
    const { pipelineId } = useParams();

    const { apiKeyActive, publicLive, privateLive } = switches;

    // Get access groups
    return async (update) => {
        const response = await generateDeploymentTrigger({
            deploymentID: 'd-' + pipelineId,
            environmentID,
            triggerID,
            apiKeyActive,
            publicLive,
            privateLive,
            ...update,
        });

        if (response.r || response.error) {
            enqueueSnackbar("Can't generate api triggers: " + (response.msg || response.r || response.error), { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            // enqueueSnackbar('Success', { variant: 'success' });
            dispatch(update);
        }
    };
};

// ------ Get the pipeline details --------
export const useGetPipelineHook = (environmentID, setPipeline) => {
    // GraphQL hook
    // Calls getPipeline graphql to get this specific pipeline
    const getPipeline = useGetPipeline();

    // URI parameter
    const { pipelineId } = useParams();

    // const FlowState = useGlobalPipelineRun();

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    // Get pipeline data
    return async () => {
        const response = await getPipeline({ pipelineID: pipelineId, environmentID });

        if (response.r || response.error) {
            closeSnackbar();
            enqueueSnackbar("Can't get pipeline: " + (response.msg || response.r || response.error), { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            // Set local pipeline state
            setPipeline(response);
            

            // Set global pipeline state
            // FlowState.pipelineInfo.set(response);
        }
    };
};

const PatchInput = styled(TextField)(() => ({
    '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': {
        display: 'none',
    },
    '& input[type=number]': {
        MozAppearance: 'textfield',
    },
}));
