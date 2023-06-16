import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Box, Button, Grid, TextField, Typography } from '@mui/material';
import { useSnackbar } from 'notistack';
import { useForm } from 'react-hook-form';
import { useUpdateRemoteWorker } from '../../../graphql/updateRemoteWorker';

const EditRPAWorkerDrawer = ({ handleClose, remoteWorker, getRemoteWorkers, environmentID }) => {
    // React hook form
    const { register, handleSubmit } = useForm({
        defaultValues: {
            workerName: remoteWorker?.workerName,
        },
    });

    // GraphQL Hook
    const updateRemoteWorker = useUpdateRemoteWorkerHook(environmentID, remoteWorker, getRemoteWorkers, handleClose);

    async function onSubmit(data) {
        updateRemoteWorker(data);
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
                            Edit worker
                        </Typography>

                        <TextField
                            label="Worker name"
                            id="workerName"
                            size="small"
                            sx={{ mt: 2, mb: 2, fontSize: '.75rem', display: 'flex' }}
                            {...register('workerName', { required: true })}
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

export default EditRPAWorkerDrawer;

// -------------------- Custom Hook --------------------------
const useUpdateRemoteWorkerHook = (environmentID, remoteWorker, getSingleRemoteProcessGroup, handleClose) => {
    // GraphQL hook
    const updateRemoteWorker = useUpdateRemoteWorker();

    const { enqueueSnackbar } = useSnackbar();

    // Update remote worker
    return async ({ workerName }) => {
        remoteWorker.workerName = workerName;
        remoteWorker.environmentID = environmentID;

        const response = await updateRemoteWorker(remoteWorker);

        if (response.r || response.error) {
            enqueueSnackbar("Can't update remote worker: " + (response.msg || response.r || response.error), { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            enqueueSnackbar('Success', { variant: 'success' });
            getSingleRemoteProcessGroup();
            handleClose();
        }
    };
};
