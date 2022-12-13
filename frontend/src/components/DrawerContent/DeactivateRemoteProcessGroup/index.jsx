import { Box, Typography, Button, Grid } from '@mui/material';
import { useEffect } from 'react';
import { useSnackbar } from 'notistack';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useUpdateRemoteProcessGroup } from '../../../graphql/updateRemoteProcessGroup';

export default function DeactivateRemoteProcessGroup({ handleClose, remoteProcessGroup, environmentID, getSingleRemoteProcessGroup }) {
    const { active, name } = remoteProcessGroup;

    // GraphQL hooks
    const updateRemoteProcessGroup = useUpdateRemoteProcessGroupHook(environmentID, getSingleRemoteProcessGroup, handleClose);

    const { closeSnackbar } = useSnackbar();

    // Clear snackbar on load
    useEffect(() => {
        closeSnackbar();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const deactivateAccessGroup = () => updateRemoteProcessGroup({ ...remoteProcessGroup }, false);
    const activateAccessGroup = () => updateRemoteProcessGroup({ ...remoteProcessGroup }, true);

    return (
        <Box position="relative">
            <Box sx={{ p: '4.125rem' }}>
                <Box position="absolute" top="26px" right="39px" display="flex" alignItems="center">
                    <Button variant="text" onClick={handleClose} style={{ paddingLeft: '16px', paddingRight: '16px' }} startIcon={<FontAwesomeIcon icon={faTimes} />}>
                        Close
                    </Button>
                </Box>

                <Typography component="h2" variant="h2">
                    {active ? 'Deactivate' : 'Activate'} remote process group - {name}
                </Typography>

                <Typography variant="body2" sx={{ mt: 2 }}>
                    You are about to {active ? 'deactivate' : 'activate'} a remote process group, would you like to continue?
                </Typography>

                <Grid mt={4} display="flex" alignItems="center">
                    <Button onClick={active ? deactivateAccessGroup : activateAccessGroup} variant="contained" color="primary" sx={{ mr: 2 }}>
                        Yes
                    </Button>
                    <Button onClick={handleClose} variant="contained" color="primary">
                        No
                    </Button>
                </Grid>
            </Box>
        </Box>
    );
}

// -------------------- Custom Hook --------------------------
export const useUpdateRemoteProcessGroupHook = (environmentID, getSingleRemoteProcessGroup, handleClose) => {
    // GraphQL hook
    const updateRemoteProcessGroup = useUpdateRemoteProcessGroup();

    const { enqueueSnackbar } = useSnackbar();

    // Update pipeline
    return async (data, isActive) => {
        data.active = isActive;
        data.environmentID = environmentID;

        const response = await updateRemoteProcessGroup(data);

        if (response.r || response.error) {
            enqueueSnackbar("Can't update remote process group: " + (response.msg || response.r || response.error), { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            enqueueSnackbar('Success', { variant: 'success' });
            getSingleRemoteProcessGroup();
            handleClose();
        }
    };
};
