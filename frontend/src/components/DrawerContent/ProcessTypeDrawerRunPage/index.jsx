import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Autocomplete, Box, Button, Grid, TextField, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Downgraded } from '@hookstate/core';
import { useGetWorkerGroups } from '../../../graphql/getWorkerGroups';
import { useSnackbar } from 'notistack';
import { useGlobalPipelineRun } from '../../../pages/PipelineRuns/GlobalPipelineRunUIState';
import { useAddUpdatePipelineFlow } from '../../../graphql/addUpdatePipelineFlow';
import { useParams } from 'react-router-dom';
import { prepareInputForBackend } from '../../../pages/PipelineEdit';
import { useGetPipelineFlowHook } from '../SchedulerDrawerRunPage';

const ProcessTypeDrawer = ({ handleClose, environmentID, workerGroup }) => {
    // React hook form
    const {
        register,
        handleSubmit,
        getValues,
        formState: { errors },
        reset,
    } = useForm({ mode: 'onBlur' });

    // Flow state
    const FlowState = useGlobalPipelineRun();

    // Local state
    const [selectedElement, setSelectedElement] = useState('-');
    const [workerGroups, setWorkerGroups] = useState([]);
    const [selectedWorkerGroup, setSelectedWorkerGroup] = useState({ WorkerGroup: workerGroup });

    // Custom GraphQL hook
    const getWorkerGroups = useGetWorkerGroupsHook(environmentID, setWorkerGroups);
    const getPipelineFlow = useGetPipelineFlowHook(environmentID);
    const updatePipelineFlow = useAddUpdatePipelineFlowHook(environmentID, getPipelineFlow);

    // Fill the form with selected element information
    useEffect(() => {
        setSelectedElement(FlowState.selectedElement.attach(Downgraded).get());
        if (FlowState.selectedElement.data.workerGroup.get()) {
            setSelectedWorkerGroup({ WorkerGroup: FlowState.selectedElement.data.workerGroup.get() });
        }

        reset({
            name: FlowState.selectedElement.data?.name.get(),
            description: FlowState.selectedElement.data?.description.get(),
        });

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [FlowState.selectedElement?.data?.name.get()]);

    // Get workers on load
    useEffect(() => {
        getWorkerGroups();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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
        if (name === FlowState.selectedElement.data.name.get()) return true;

        // Name is taken
        if (FlowState.elements.get().some((a) => a?.data?.name === name)) return false;
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <Box position="relative" width="100%">
                <Box sx={{ p: '4.125rem 3.81rem' }}>
                    <Box position="absolute" top="26px" right="39px" display="flex" alignItems="center">
                        <Button onClick={handleClose} style={{ paddingLeft: '16px', paddingRight: '16px' }} variant="text" startIcon={<FontAwesomeIcon icon={faTimes} />}>
                            Close
                        </Button>
                    </Box>

                    <Box mt={3} width="212px">
                        <Typography component="h2" variant="h2">
                            Processor - {selectedElement?.data?.name}
                        </Typography>

                        <TextField
                            label="Title"
                            id="title"
                            size="small"
                            required
                            sx={{ mt: 2, fontSize: '.75rem', display: 'flex' }}
                            {...register('name', { required: true, validate: (name) => checkNameTaken(name) })}
                        />
                        {errors.name?.type === 'validate' && (
                            <Typography variant="subtitle1" color="error">
                                Each node needs unique naming, {getValues('name')} has already been used.
                            </Typography>
                        )}

                        <TextField label="Description" id="description" size="small" sx={{ mb: 2, mt: 2, fontSize: '.75rem', display: 'flex' }} {...register('description')} />

                        <Autocomplete
                            options={workerGroups}
                            value={selectedWorkerGroup}
                            disableClearable
                            getOptionLabel={(option) => option.WorkerGroup}
                            onChange={(event, newValue) => {
                                setSelectedWorkerGroup(newValue);
                            }}
                            isOptionEqualToValue={(option, value) => option.WorkerGroup === value.WorkerGroup}
                            renderInput={(params) => (
                                <TextField
                                    {...params} //
                                    label="Worker group"
                                    size="small"
                                    sx={{ fontSize: '.75rem', display: 'flex' }}
                                    {...register('workerGroup')}
                                />
                            )}
                        />

                        <Grid mt={4} display="flex" alignItems="center">
                            <Button type="submit" variant="contained" color="primary" style={{ width: '100%' }}>
                                Save
                            </Button>
                        </Grid>
                    </Box>
                </Box>
            </Box>
        </form>
    );
};

export default ProcessTypeDrawer;

const useGetWorkerGroupsHook = (environmentID, setWorkerGroups) => {
    // GraphQL hook
    const getWorkerGroups = useGetWorkerGroups();

    const { enqueueSnackbar } = useSnackbar();

    // Get worker groups
    return async () => {
        const response = await getWorkerGroups({ environmentID });

        if (response === null) {
            setWorkerGroups([]);
        } else if (response.r === 'error') {
            enqueueSnackbar("Can't get worker groups: " + response.msg, { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            setWorkerGroups(response);
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
