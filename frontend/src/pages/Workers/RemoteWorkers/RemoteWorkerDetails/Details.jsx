import { Box, Button, TextField } from '@mui/material';
import { useSnackbar } from 'notistack';
import { useUpdateRemoteWorker } from '../../../../graphql/remoteworkers/updateRemoteWorker.js';
import { useForm } from 'react-hook-form';
import { useParams } from 'react-router-dom';

export default function Details({ environmentId, remoteWorker, getSingleRemoteWorker }) {
    // React hook form
    const { register, handleSubmit } = useForm({
        defaultValues: {
            workerName: remoteWorker?.workerName,
            description: remoteWorker?.description,
        },
    });

    // Custom Hook
    const updateRemoteWorker = useUpdateRemoteWorkerHook(environmentId, remoteWorker, getSingleRemoteWorker);

    return (
        <form onSubmit={handleSubmit(updateRemoteWorker)}>
            <Box mt={2} display="grid" flexDirection="row">
                <TextField label="Name" id="workerName" size="small" sx={{ mb: '.45rem' }} {...register('workerName', { required: true })} />
                <TextField label="Description" id="description" size="small" sx={{ mb: '.45rem' }} {...register('description')} />

                <Button type="submit" variant="contained" color="primary" sx={{ width: '100%', mt: '1.375rem' }}>
                    Save
                </Button>
            </Box>
        </form>
    );
}

// -------------------- Custom Hook --------------------------
const useUpdateRemoteWorkerHook = (environmentID, remoteWorker, getSingleRemoteProcessGroup) => {
    // GraphQL hook
    const updateRemoteWorker = useUpdateRemoteWorker();

    const { enqueueSnackbar } = useSnackbar();

    const { workerId } = useParams();

    // Update pipeline
    return async (data) => {
        data.workerID = workerId;
        data.environmentID = environmentID;
        data.active = remoteWorker.active;
        data.status = remoteWorker.status;

        const response = await updateRemoteWorker(data);

        if (response.r || response.error) {
            enqueueSnackbar("Can't update remote process group: " + (response.msg || response.r || response.error), { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            enqueueSnackbar('Success', { variant: 'success' });
            getSingleRemoteProcessGroup();
        }
    };
};
