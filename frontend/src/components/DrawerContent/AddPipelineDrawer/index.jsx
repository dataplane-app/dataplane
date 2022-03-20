import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Autocomplete, Box, Button, Grid, TextField, Typography } from '@mui/material';
import { useSnackbar } from 'notistack';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAddPipeline } from '../../../graphql/addPipeline';
import { useGlobalEnvironmentState } from '../../EnviromentDropdown';
import { useGetWorkerGroups } from '../../../graphql/getWorkerGroups';
import { useHistory } from 'react-router-dom';

const AddPipelineDrawer = ({ handleClose, environmentID }) => {
    // React hook form
    const { register, handleSubmit } = useForm();

    // Global environment state with hookstate
    const Environment = useGlobalEnvironmentState();

    // Local state
    const [workerGroups, setWorkerGroups] = useState([]);

    // Custom GraphQL hook
    const addPipeline = useAddPipeline_(environmentID);
    const getWorkerGroups = useGetWorkerGroupsHook(Environment.id.get(), setWorkerGroups);

    // Get workers on load
    useEffect(() => {
        getWorkerGroups();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <form onSubmit={handleSubmit(addPipeline)}>
            <Box position="relative">
                <Box sx={{ p: '4.125rem' }}>
                    <Box position="absolute" top="26px" right="39px" display="flex" alignItems="center">
                        <Button onClick={handleClose} style={{ paddingLeft: '16px', paddingRight: '16px' }} variant="text" startIcon={<FontAwesomeIcon icon={faTimes} />}>
                            Close
                        </Button>
                    </Box>

                    <Box mt={3} width="212px">
                        <Typography component="h2" variant="h2">
                            Create pipeline
                        </Typography>

                        <TextField
                            label="Title"
                            id="name"
                            size="small"
                            required
                            sx={{ mt: 2, mb: 2, fontSize: '.75rem', display: 'flex' }}
                            {...register('name', { required: true })}
                        />
                        <TextField label="Description" id="description" size="small" sx={{ mb: 2, fontSize: '.75rem', display: 'flex' }} {...register('description')} />

                        <Autocomplete
                            options={workerGroups}
                            getOptionLabel={(option) => option.WorkerGroup}
                            renderInput={(params) => (
                                <TextField
                                    {...params} //
                                    label="Worker group"
                                    required
                                    size="small"
                                    sx={{ fontSize: '.75rem', display: 'flex' }}
                                    {...register('workerGroup', { required: true })}
                                />
                            )}
                        />

                        <Grid mt={4} display="flex" alignItems="center">
                            <Button type="submit" required variant="contained" color="primary" style={{ width: '100%' }}>
                                Save
                            </Button>
                        </Grid>
                    </Box>
                </Box>
            </Box>
        </form>
    );
};

export default AddPipelineDrawer;

// ---------- Custom Hook

export const useAddPipeline_ = (environmentID) => {
    // GraphQL hook
    const addPipeline = useAddPipeline();

    // React router
    const history = useHistory();

    const { enqueueSnackbar } = useSnackbar();

    // Create pipeline
    return async (data) => {
        const { name, description, workerGroup } = data;
        const response = await addPipeline({ name, description, environmentID, workerGroup });

        if (response.r === 'error') {
            enqueueSnackbar("Can't create pipeline: " + response.msg, { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            history.push(`/pipelines/flow/${response}`);
        }
    };
};

// ------- Custom Hooks
export const useGetWorkerGroupsHook = (environmentID, setWorkerGroups) => {
    // GraphQL hook
    const getAccessGroupUsers = useGetWorkerGroups();

    const { enqueueSnackbar } = useSnackbar();

    // Get worker groups
    return async () => {
        const response = await getAccessGroupUsers({ environmentID });

        if (response === null) {
            setWorkerGroups([]);
        } else if (response.r === 'error') {
            enqueueSnackbar("Can't get worker groups: " + response.msg, { variant: 'error' });
        } else if (response.r === 'Unauthorized') {
            enqueueSnackbar('Idle: not polling', { variant: 'warning' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            setWorkerGroups(response);
        }
    };
};
