import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Box, Button, Grid, TextField, Typography } from '@mui/material';
import { useForm } from 'react-hook-form';
import { useSnackbar } from 'notistack';
import { useAddRemoteWorker } from '../../../graphql/addRemoteWorker';
import { useGlobalEnvironmentState } from '../../EnviromentDropdown';

const AddRPAWorkerDrawer = ({ handleClose, getRemoteWorkers }) => {
    // React hook form
    const { register, handleSubmit, reset } = useForm();

    // Global environment state with hookstate
    const Environment = useGlobalEnvironmentState();

    // Custom GraphQL hooks
    const addRemoteWorker = useAddRemoteWorkerHook(Environment.id.get(), getRemoteWorkers, handleClose);

    async function onSubmit(data) {
        addRemoteWorker(data);
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
                        <Typography component="h2" variant="h2" mb={4}>
                            Add worker
                        </Typography>

                        <TextField
                            label="Worker name"
                            id="name"
                            size="small"
                            sx={{ mt: 2, mb: 2, fontSize: '.75rem', display: 'flex' }}
                            {...register('name', { required: true })}
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

export default AddRPAWorkerDrawer;

// ** Custom Hooks
export const useAddRemoteWorkerHook = (environmentID, getRemoteWorkers, handleClose) => {
    // GraphQL hook
    const addRemoteWorker = useAddRemoteWorker();

    const { enqueueSnackbar } = useSnackbar();

    // Add remote worker pipeline
    return async (data) => {
        const { name } = data;

        const response = await addRemoteWorker({ name, environmentID });

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
