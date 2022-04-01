import { styled } from '@mui/system';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Autocomplete, Box, Button, Grid, TextField, Typography } from '@mui/material';
import { useSnackbar } from 'notistack';
import { useEffect, useState } from 'react';
import { IOSSwitch } from '../components/DrawerContent/SchedulerDrawer/IOSSwitch';
import { useGlobalEnvironmentState } from '../components/EnviromentDropdown';
import { useGetEnvironments } from '../graphql/getEnvironments';
import { useForm } from 'react-hook-form';
import { useGetNonDefaultWGNodes } from '../graphql/getNonDefaultWGNodes';
import { useHistory, useParams } from 'react-router-dom';
import { useAddDeployment } from '../graphql/addDeployment';
import { useState as useHookState } from '@hookstate/core';
import { useGetPipelineHook } from './View';
import { useGetDeployment } from '../graphql/getDeployment';
import { useGetWorkerGroups } from '../graphql/getWorkerGroups';

const Deploy = () => {
    // Environment global state
    const Environment = useGlobalEnvironmentState();

    // Local state
    const [deployment, setDeployment] = useState(null);
    const [selectedEnvironment, setSelectedEnvironment] = useState(null);
    const [availableEnvironments, setAvailableEnvironments] = useState([]);
    const [availableWorkerGroups, setAvailableWorkerGroups] = useState([]);
    const [pipeline, setPipeline] = useState(null);
    const [live, setLive] = useState(true);
    const [workerGroup, setWorkerGroup] = useState(null);
    const nonDefaultWGNodes = useHookState([]);

    // React hook form
    const { register, handleSubmit, reset } = useForm();

    // React router
    const { pipelineId } = useParams();
    const history = useHistory();

    // Graphql Hooks
    const getEnvironments = useGetEnvironmentsHook(setAvailableEnvironments);
    const getWorkerGroups = useGetWorkerGroupsHook(setAvailableWorkerGroups, selectedEnvironment);
    const getNonDefaultWGNodes = useGetNonDefaultWGNodesHook(nonDefaultWGNodes, selectedEnvironment);
    const addDeployment = useAddDeploymentHook();
    const getPipeline = useGetPipelineHook(Environment.id.get(), setPipeline);
    const getDeployment = useGetDeploymentHook(selectedEnvironment?.id, 'd-' + pipelineId, setDeployment);

    useEffect(() => {
        if (!Environment.id?.get()) return;
        getEnvironments();
        getPipeline();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [Environment.id?.get()]);

    useEffect(() => {
        if (!selectedEnvironment) return;
        getNonDefaultWGNodes(Environment.id?.get(), selectedEnvironment.id);
        getDeployment();
        getWorkerGroups(selectedEnvironment.id);

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedEnvironment]);

    // Populate values on load
    useEffect(() => {
        if (!deployment) return;

        if (deployment.environmentID === selectedEnvironment.id) {
            setWorkerGroup(deployment.workerGroup);
            reset({
                major: deployment.version.split('.')[0],
                minor: deployment.version.split('.')[1],
                patch: deployment.version.split('.')[2],
                workerGroup: deployment.workerGroup,
            });
            setLive(deployment.online);
        } else {
            setWorkerGroup(null);
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
        if (!selectedEnvironment) return;
        const nodeWorkerGroup = nonDefaultWGNodes.get().map((a) => ({
            NodeID: a.nodeID,
            WorkerGroup: a.workerGroup,
        }));
        let input = {
            pipelineID: pipelineId,
            fromEnvironmentID: Environment.id?.get(),
            toEnvironmentID: selectedEnvironment.id,
            version: `${data.major}.${data.minor}.${data.patch}`,
            workerGroup: data.workerGroup,
            liveactive: live,
            nodeWorkerGroup,
        };

        addDeployment(input);
        return;
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
                    <Grid item>
                        <Typography component="h3" variant="h3" color="text.primary" fontWeight="700" fontSize="0.875rem">
                            Deploy to environment
                        </Typography>

                        <Grid mt={2} display="flex" alignItems="center">
                            <Autocomplete
                                onChange={(event, newValue) => {
                                    setSelectedEnvironment(newValue);
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

                                <Grid container alignItems="center" flexWrap="nowrap" justifyContent="flex-start" mt={2}>
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

                                <Grid container alignItems="center" mt={4} mb={4}>
                                    {deployment.node_type_desc !== 'play' ? (
                                        <IOSSwitch onClick={() => setLive(!live)} checked={live} inputProps={{ 'aria-label': 'controlled' }} />
                                    ) : null}
                                    <Typography sx={{ ml: deployment.node_type_desc !== 'play' ? 2 : 0, fontSize: 16, color: live ? 'status.pipelineOnlineText' : 'error.main' }}>
                                        {live ? 'Online' : 'Offline'}
                                    </Typography>
                                </Grid>

                                {deployment ? (
                                    <Autocomplete
                                        options={availableWorkerGroups}
                                        value={workerGroup}
                                        getOptionLabel={(option) => option.WorkerGroup || option}
                                        onChange={(event, newValue) => {
                                            setWorkerGroup(newValue);
                                        }}
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                label="Default worker group"
                                                size="small"
                                                sx={{ fontSize: '.75rem', display: 'flex' }}
                                                {...register('workerGroup', { required: true })}
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

                    {nonDefaultWGNodes.get().length > 0 ? (
                        <Grid ml={20} mt={17}>
                            <Typography component="h3" variant="h3" color="text.primary" fontWeight="700" fontSize="0.875rem">
                                Node specific worker groups
                            </Typography>
                            <Typography mt={0.5} variant="body1" color="text.primary" fontWeight="400" fontSize="0.875rem" maxWidth={480}>
                                Node specific worker groups are any nodes in the pipeline that do not use the default worker group.
                            </Typography>

                            {nonDefaultWGNodes.get().map((a) => (
                                <Box key={a.name}>
                                    <Typography mt={3} component="h3" variant="h3" color="text.primary" fontWeight="700" fontSize="0.875rem">
                                        {a.name}
                                    </Typography>
                                    <Typography mb={1} variant="body1" color="text.primary" fontWeight="400" fontSize="0.875rem" maxWidth={480}>
                                        {a.description}
                                    </Typography>
                                    <Autocomplete
                                        options={availableWorkerGroups}
                                        getOptionLabel={(option) => option.WorkerGroup}
                                        onInputChange={(event, newValue) => {
                                            let idx = nonDefaultWGNodes.get().findIndex((b) => b.nodeID === a.nodeID);
                                            nonDefaultWGNodes[idx].merge({ workerGroup: newValue });
                                        }}
                                        renderInput={(params) => (
                                            <TextField {...params} label="Worker group" size="small" sx={{ fontSize: '.75rem', display: 'flex', width: '212px' }} />
                                        )}
                                    />
                                </Box>
                            ))}
                        </Grid>
                    ) : null}
                </Grid>
            </Box>
        </form>
    );
};

export default Deploy;

// ----- Custom Hooks
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

        if (response === null) {
            nonDefaultWGNodes.set([]);
        } else if (response.r || response.error) {
            enqueueSnackbar("Can't get worker groups: " + (response.msg || response.r || response.error), { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            nonDefaultWGNodes.set(response.filter((a) => a.environmentID === selectedEnvironment.id));
        }
    };
};

const useAddDeploymentHook = () => {
    // GraphQL hook
    const addDeployment = useAddDeployment();

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
        }
    };
};

const useGetDeploymentHook = (environmentID, pipelineID, setDeployment) => {
    // GraphQL hook
    const getDeployment = useGetDeployment();

    const { enqueueSnackbar } = useSnackbar();

    // Add deployment
    return async () => {
        const response = await getDeployment({ environmentID, pipelineID });

        if (response.r || response.error) {
            enqueueSnackbar("Can't get deployment: " + (response.msg || response.r || response.error), { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            setDeployment(response);
        }
    };
};

// ------- Custom Hooks
const useGetWorkerGroupsHook = (setWorkerGroups, selectedEnvironment) => {
    // GraphQL hook
    const getAccessGroupUsers = useGetWorkerGroups();

    const { enqueueSnackbar } = useSnackbar();

    // Get worker groups
    return async (environmentID) => {
        const response = await getAccessGroupUsers({ environmentID });

        if (response === null) {
            setWorkerGroups([]);
        } else if (response.r || response.error) {
            enqueueSnackbar("Can't get worker groups: " + (response.msg || response.r || response.error), { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            setWorkerGroups(response.filter((a) => a.Env === selectedEnvironment.name));
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
