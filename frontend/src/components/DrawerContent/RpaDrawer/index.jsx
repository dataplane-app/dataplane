import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Autocomplete, Box, Button, TextField, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useGlobalFlowState } from '../../../pages/PipelineEdit';
import { Downgraded } from '@hookstate/core';
import { useSnackbar } from 'notistack';
import { useGetRemoteProcessGroupsForAnEnvironment } from '../../../graphql/getRemoteProcessGroupsForAnEnvironment';
import { useGetRemoteWorkers } from '../../../graphql/getRemoteWorkers';

const RpaDrawer = ({ handleClose, elements, setElements, environmentID }) => {
    // React hook form
    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm({ mode: 'onBlur' });

    // Flow state
    const FlowState = useGlobalFlowState();

    // Local state
    const [selectedElement, setSelectedElement] = useState('-');
    const [processGroups, setRemoteProcessGroups] = useState('');
    const [selectedProcessGroup, setSelectedProcessGroup] = useState(null);
    const [remoteWorkers, setRemoteWorkers] = useState(null);

    // Graphql hook
    const getRemoteProcessGroupsForAnEnvironment = useGetRemoteProcessGroupsForAnEnvironmentHook(environmentID, setRemoteProcessGroups, setSelectedProcessGroup);
    const getRemoteWorkers = useGetRemoteWorkersHook(environmentID, setRemoteWorkers, selectedProcessGroup?.remoteProcessGroupID);

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
        setElements((els) =>
            els.map((el) => {
                if (el.id === selectedElement.id) {
                    el.data = {
                        ...el.data,
                        name: data.name,
                        description: data.description,
                        workerGroup: data.workerGroup === 'default' ? '' : data.workerGroup,
                    };
                }
                return el;
            })
        );
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

                        <Typography variant="h3" sx={{ mt: 5, mb: 2, fontWeight: 700 }}>
                            RPA Worker
                        </Typography>

                        <Autocomplete
                            options={processGroups}
                            value={selectedProcessGroup}
                            disableClearable
                            getOptionLabel={(option) => option.remoteProcessGroupID || ''}
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
    const FlowState = useGlobalFlowState();

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
            // if (FlowState.selectedElement.data?.workerGroup.get()) {
            //     setSelectedProcessGroup(response.find((a) => a.name === FlowState.selectedElement.data?.workerGroup.get()));
            // }
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
