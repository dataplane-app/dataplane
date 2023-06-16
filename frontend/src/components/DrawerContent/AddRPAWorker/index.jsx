import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Autocomplete, Box, Button, Grid, TextField, Typography } from '@mui/material';
import { useForm } from 'react-hook-form';
import { useSnackbar } from 'notistack';
import { useAddRemoteWorker } from '../../../graphql/addRemoteWorker';
import { useGlobalEnvironmentState } from '../../EnviromentDropdown';
import { useGetRemoteProcessGroupsForAnEnvironment } from '../../../graphql/getRemoteProcessGroupsForAnEnvironment';
import { useEffect, useState } from 'react';

const AddRPAWorkerDrawer = ({ handleClose, getRemoteWorkers }) => {
    // React hook form
    const { register, handleSubmit } = useForm();

    // Global environment state with hookstate
    const Environment = useGlobalEnvironmentState();

    // Local state
    const [processGroups, setProcessGroups] = useState(null);
    const [selectedProcessGroupID, setSelectedProcessGroupID] = useState(null);

    // Custom GraphQL hooks
    const addRemoteWorker = useAddRemoteWorkerHook(Environment.id.get(), getRemoteWorkers, selectedProcessGroupID, handleClose);
    const getRemoteProcessGroupsForAnEnvironment = useGetRemoteProcessGroupsForAnEnvironmentHook(Environment.id.get(), setProcessGroups);

    async function onSubmit(data) {
        addRemoteWorker(data);
    }

    useEffect(() => {
        if (!Environment.id.get()) return;
        getRemoteProcessGroupsForAnEnvironment();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [Environment.id.get()]);

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
                        <Typography component="h2" variant="h2" mb={4}>
                            Add worker
                        </Typography>

                        {processGroups?.length > 0 ? (
                            <>
                                <TextField
                                    label="Worker name"
                                    id="name"
                                    size="small"
                                    sx={{ mt: 2, mb: 2, fontSize: '.75rem', display: 'flex' }}
                                    {...register('name', { required: true })}
                                />

                                <Autocomplete
                                    id="autocomplete_process_groups"
                                    options={processGroups}
                                    getOptionLabel={(option) => option.name}
                                    onChange={(_, value) => setSelectedProcessGroupID(value.remoteProcessGroupID)}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Process group"
                                            id="process_groups"
                                            size="small"
                                            {...register('remoteProcessGroupName')}
                                            sx={{ fontSize: '.75rem', display: 'flex' }}
                                        />
                                    )}
                                />

                                <Grid mt={4} display="flex" alignItems="center">
                                    <Button type="submit" variant="contained" color="primary" style={{ width: '100%' }}>
                                        Save
                                    </Button>
                                </Grid>
                            </>
                        ) : (
                            <Typography>Add a process group for {Environment.name.get()} environment before creating a worker. </Typography>
                        )}
                    </Box>
                </Box>
            </Box>
        </form>
    );
};

export default AddRPAWorkerDrawer;

// ** Custom Hooks
export const useAddRemoteWorkerHook = (environmentID, getRemoteWorkers, remoteProcessGroupID, handleClose) => {
    // GraphQL hook
    const addRemoteWorker = useAddRemoteWorker();

    const { enqueueSnackbar } = useSnackbar();

    // Add remote worker pipeline
    return async (data) => {
        const { name } = data;

        const response = await addRemoteWorker({ name, environmentID, remoteProcessGroupID });

        if (response.r === 'error') {
            enqueueSnackbar("Can't add remote worker: " + response.msg, { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            enqueueSnackbar('Success', { variant: 'success' });
            getRemoteWorkers();
            handleClose();
        }
    };
};

const useGetRemoteProcessGroupsForAnEnvironmentHook = (environmentID, setProcessGroups) => {
    // GraphQL hook
    const getRemoteProcessGroupsForAnEnvironment = useGetRemoteProcessGroupsForAnEnvironment();

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    // Get environments on load
    return async () => {
        const response = await getRemoteProcessGroupsForAnEnvironment({ environmentID });

        if (response.r || response.error) {
            closeSnackbar();
            enqueueSnackbar("Can't get process groups: " + (response.msg || response.r || response.error), { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            setProcessGroups(response);
        }
    };
};
