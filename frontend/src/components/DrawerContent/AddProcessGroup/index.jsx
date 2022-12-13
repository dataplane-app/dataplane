import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Autocomplete, Box, Button, Grid, TextField, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useSnackbar } from 'notistack';
import { useGetEnvironments } from '../../../graphql/getEnvironments';
import { useAddRemoteProcessGroup } from '../../../graphql/addRemoteProcessGroup';
import { useGlobalEnvironmentState } from '../../EnviromentDropdown';

const AddProcessGroupDrawer = ({ handleClose, getRemoteProcessGroups }) => {
    // React hook form
    const { register, handleSubmit } = useForm();

    // Local State
    const [environments, setEnvironments] = useState([]);

    // Custom GraphQL hooks
    const getEnvironments = useGetEnvironmentsData(setEnvironments);
    const addRemoteProcessGroupHook = useAddRemoteProcessGroupHook(environments, getRemoteProcessGroups, handleClose);

    useEffect(() => {
        getEnvironments();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <form onSubmit={handleSubmit(addRemoteProcessGroupHook)}>
            <Box position="relative" width="100%">
                <Box sx={{ p: '4.125rem 3.81rem' }}>
                    <Box position="absolute" top="26px" right="39px" display="flex" alignItems="center">
                        <Button onClick={handleClose} style={{ paddingLeft: '16px', paddingRight: '16px' }} variant="text" startIcon={<FontAwesomeIcon icon={faTimes} />}>
                            Close
                        </Button>
                    </Box>

                    <Box mt={3} width="212px">
                        <Typography component="h2" variant="h2" mb={4}>
                            Add process group
                        </Typography>

                        <TextField
                            label="Process group name"
                            id="name"
                            size="small"
                            sx={{ mt: 2, mb: 2, fontSize: '.75rem', display: 'flex' }}
                            {...register('name', { required: true })}
                        />

                        <TextField label="Description" id="description" size="small" sx={{ mt: 2, mb: 2, fontSize: '.75rem', display: 'flex' }} {...register('description')} />

                        <Autocomplete
                            disablePortal
                            id="available_environments_autocomplete"
                            options={environments}
                            getOptionLabel={(option) => option.name}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Available environments"
                                    id="environment"
                                    size="small"
                                    {...register('environment', { required: true })}
                                    sx={{ fontSize: '.75rem', display: 'flex' }}
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

export default AddProcessGroupDrawer;

// ** Custom Hooks
const useGetEnvironmentsData = (setEnvironments) => {
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
            setEnvironments(response);
        }
    };
};

export const useAddRemoteProcessGroupHook = (environments, getRemoteProcessGroups, handleClose) => {
    // GraphQL hook
    const addRemoteProcessGroup = useAddRemoteProcessGroup();

    const { enqueueSnackbar } = useSnackbar();

    const Environment = useGlobalEnvironmentState();

    // Create pipeline
    return async (data) => {
        const { name, description } = data;
        const environmentID = Environment.id.get();
        const processGroupsEnvironmentID = environments.find((a) => a.name === data.environment).id;
        const response = await addRemoteProcessGroup({ name, description, environmentID, processGroupsEnvironmentID });

        if (response.r === 'error') {
            enqueueSnackbar("Can't add remote process group: " + response.msg, { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            enqueueSnackbar('Success', { variant: 'success' });
            getRemoteProcessGroups();
            handleClose();
        }
    };
};
