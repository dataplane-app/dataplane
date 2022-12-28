import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Autocomplete, Box, Button, TextField, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Downgraded } from '@hookstate/core';
import { useSnackbar } from 'notistack';
import { useGetRemoteProcessGroupsForAnEnvironment } from '../../../graphql/getRemoteProcessGroupsForAnEnvironment';
import { useGetRemoteWorkers } from '../../../graphql/getRemoteWorkers';
import { useGlobalPipelineRun } from '../../../pages/PipelineRuns/GlobalPipelineRunUIState';
import { useGetPipelineFlowHook } from '../SchedulerDrawerRunPage';
import { prepareInputForBackend } from '../../../pages/PipelineEdit';
import { useAddUpdatePipelineFlow } from '../../../graphql/addUpdatePipelineFlow';
import { useParams } from 'react-router-dom/cjs/react-router-dom.min';

const RpaDrawer = ({ handleClose, elements, setElements, environmentID }) => {
    // React hook form
    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm({ mode: 'onBlur' });

    // Flow state
    const FlowState = useGlobalPipelineRun();

    // Local state
    const [selectedElement, setSelectedElement] = useState('-');
    const [processGroups, setRemoteProcessGroups] = useState('');
    const [selectedProcessGroup, setSelectedProcessGroup] = useState(null);
    const [remoteWorkers, setRemoteWorkers] = useState(null);

    // Graphql hook
    const getRemoteProcessGroupsForAnEnvironment = useGetRemoteProcessGroupsForAnEnvironmentHook(environmentID, setRemoteProcessGroups, setSelectedProcessGroup);
    const getRemoteWorkers = useGetRemoteWorkersHook(environmentID, setRemoteWorkers, selectedProcessGroup?.remoteProcessGroupID);
    const getPipelineFlow = useGetPipelineFlowHook(environmentID);
    const updatePipelineFlow = useAddUpdatePipelineFlowHook(environmentID, getPipelineFlow);

    // Get worker's process groups on load
    useEffect(() => {
        getRemoteProcessGroupsForAnEnvironment();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [environmentID]);

    // Get remote workers once a process groups is selected
    useEffect(() => {
        getRemoteWorkers();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedProcessGroup]);

    // Fill the form with selected element information
    useEffect(() => {
        setSelectedElement(FlowState.selectedElement.attach(Downgraded).get());

        reset({
            name: FlowState.selectedElement.data?.name.get(),
            description: FlowState.selectedElement.data?.description.get(),
        });

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [FlowState.selectedElement?.data?.name.get()]);

    async function onSubmit(data) {
        const elements = JSON.parse(JSON.stringify(FlowState.elements.value));

        const elementsNew = elements.map((el) => {
            if (el.id === selectedElement.id) {
                el.data = {
                    ...el.data,
                    name: data.name,
                    description: data.description,
                    workerGroup: data.workerGroup === 'default' ? '' : data.workerGroup,
                };
            }
            return el;
        });

        FlowState.elements.set(elementsNew);
        updatePipelineFlow(elementsNew);

        handleClose();
    }

    /**
     * Returns false if the name is taken
     */
    function checkNameTaken(name) {
        if (name === selectedElement.data.name) return true;

        // Name is taken
        if (FlowState.elements.get().some((a) => a?.data?.name === name)) return false;
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <Box position="relative" width="100%">
                <Box sx={{ p: '2rem 3rem' }}>
                    <Box position="absolute" gap={3} top="26px" right="39px" display="flex" alignItems="center">
                        <Button type="submit" variant="contained" color="primary" style={{ width: '100%' }}>
                            Save
                        </Button>
                        <Button onClick={handleClose} style={{ paddingLeft: '16px', paddingRight: '16px' }} variant="text" startIcon={<FontAwesomeIcon icon={faTimes} />}>
                            Close
                        </Button>
                    </Box>

                    <Box width="350px">
                        <Typography component="h2" variant="h2">
                            RPA - Python
                        </Typography>

                        <TextField
                            label="Name"
                            id="name"
                            size="small"
                            required
                            sx={{ mt: 3, fontSize: '.75rem', display: 'flex' }}
                            {...register('name', { required: true, validate: (name) => checkNameTaken(name) })}
                        />
                        {errors.name?.type === 'validate' && (
                            <Typography variant="subtitle1" color="error">
                                A node with that name already exists.
                            </Typography>
                        )}
                        <TextField label="Description" id="description" size="small" sx={{ mt: 2, mb: 2, fontSize: '.75rem', display: 'flex' }} {...register('description')} />

                        {selectedProcessGroup ? (
                            <>
                                <Typography variant="h3" sx={{ mt: 5, mb: 2, fontWeight: 700 }}>
                                    RPA Worker
                                </Typography>

                                <Autocomplete
                                    options={processGroups}
                                    value={selectedProcessGroup}
                                    disableClearable
                                    getOptionLabel={(option) => option.name}
                                    onChange={(event, newValue) => {
                                        setSelectedProcessGroup(newValue);
                                    }}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params} //
                                            label="Process Group"
                                            size="small"
                                            sx={{ fontSize: '.75rem', display: 'flex' }}
                                            {...register('workerGroup')}
                                        />
                                    )}
                                />

                                <Typography fontWeight={700} sx={{ mt: 2, fontSize: '0.8125rem' }}>
                                    Workers found in environment Production:
                                </Typography>

                                <ul>
                                    {remoteWorkers?.map((a) => (
                                        <li key={a.workerName} style={{ fontSize: '0.8125rem' }}>
                                            {a.workerName}
                                        </li>
                                    ))}
                                </ul>
                            </>
                        ) : null}
                    </Box>
                </Box>
            </Box>
        </form>
    );
};

export default RpaDrawer;

// ** Custom Hook
const useGetRemoteProcessGroupsForAnEnvironmentHook = (environmentID, setRemoteProcessGroups, setSelectedProcessGroup) => {
    // GraphQL hook
    const getRemoteProcessGroupsForAnEnvironment = useGetRemoteProcessGroupsForAnEnvironment();

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    // Flow state
    const FlowState = useGlobalPipelineRun();

    // Get environments on load
    return async () => {
        const response = await getRemoteProcessGroupsForAnEnvironment({ environmentID });

        if (response.r || response.error) {
            closeSnackbar();
            enqueueSnackbar("Can't get process groups: " + (response.msg || response.r || response.error), { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            setRemoteProcessGroups(response);
            setSelectedProcessGroup(response.find((a) => a.name === FlowState.selectedElement.data?.workerGroup.get()));
        }
    };
};

const useGetRemoteWorkersHook = (environmentID, setRemoteWorkers, remoteProcessGroupID) => {
    // GraphQL hook
    const getRemoteWorkers = useGetRemoteWorkers();

    const { enqueueSnackbar } = useSnackbar();

    // Get worker groups
    return async (filter) => {
        const input = { environmentID, remoteProcessGroupID };
        if (filter) {
            input.remoteProcessGroupID = filter;
        }

        const response = await getRemoteWorkers(input);

        if (response === null) {
            setRemoteWorkers([]);
        } else if (response.r || response.error) {
            enqueueSnackbar("Can't get remote process groups: " + (response.msg || response.r || response.error), { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            setRemoteWorkers(response);
        }
    };
};

const useAddUpdatePipelineFlowHook = (environmentID, getPipelineFlow) => {
    // GraphQL hook
    const addUpdatePipelineFlow = useAddUpdatePipelineFlow();

    // URI parameter
    const { pipelineId } = useParams();

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    // Update pipeline flow
    return async (rawInput) => {
        // Prepare input to match the structure in the backend
        const input = prepareInputForBackend(rawInput);

        const response = await addUpdatePipelineFlow({ input, pipelineID: pipelineId, environmentID });

        if (response.r || response.error) {
            closeSnackbar();
            enqueueSnackbar(`Can't update flow: ` + (response.msg || response.r || response.error), { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            enqueueSnackbar('Success', { variant: 'success' });
            getPipelineFlow();
        }
    };
};
