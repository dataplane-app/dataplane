import { Box, Typography, Button, Grid } from '@mui/material';
import { useEffect } from 'react';
import { useSnackbar } from 'notistack';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useHistory } from 'react-router-dom';
import { useDeleteRemoteWorker } from '../../../graphql/deleteRemoteWorker';

export default function DeleteRemoteWorkerDrawer({ handleClose, remoteWorker, environmentID }) {
    // GraphQL hook
    const deleteRemoteWorker = useDeleteRemoteWorkerHook(environmentID, remoteWorker.WorkerID);

    const { closeSnackbar } = useSnackbar();

    // Clear snackbar on load
    useEffect(() => {
        closeSnackbar();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <Box position="relative">
            <Box sx={{ p: '4.125rem' }}>
                <Box position="absolute" top="26px" right="39px" display="flex" alignItems="center">
                    <Button variant="text" onClick={handleClose} style={{ paddingLeft: '16px', paddingRight: '16px' }} startIcon={<FontAwesomeIcon icon={faTimes} />}>
                        Close
                    </Button>
                </Box>

                <Typography component="h2" variant="h2">
                    Delete remote process group - {remoteWorker.WorkerName}
                </Typography>

                <Typography variant="body2" sx={{ mt: 2 }}>
                    You are about to delete a remote process group, would you like to continue?
                </Typography>

                <Grid mt={4} display="flex" alignItems="center">
                    <Button onClick={deleteRemoteWorker} variant="contained" color="primary" sx={{ mr: 2 }}>
                        Yes
                    </Button>
                    <Button onClick={handleClose} variant="contained" color="primary">
                        No
                    </Button>
                </Grid>

                <Typography variant="body2" sx={{ mt: 4 }} color="rgba(248, 0, 0, 1)">
                    Warning: this action can't be undone.
                </Typography>
            </Box>
        </Box>
    );
}

// ------------- Custom Hook

const useDeleteRemoteWorkerHook = (environmentID, workerID) => {
    // React router
    const history = useHistory();

    // GraphQL hook
    const deleteRemoteWorker = useDeleteRemoteWorker();

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    // Delete a remote process worker
    return async () => {
        const response = await deleteRemoteWorker({ environmentID, workerID });

        if (response.r === 'error') {
            closeSnackbar();
            enqueueSnackbar("Can't delete remote process worker: " + response.msg, {
                variant: 'error',
            });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            enqueueSnackbar('Success', { variant: 'success' });
            history.push('/remote/workers');
        }
    };
};
