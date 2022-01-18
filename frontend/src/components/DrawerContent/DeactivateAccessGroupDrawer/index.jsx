import { Box, Typography, Button, Grid } from '@mui/material';
import { useEffect } from 'react';
import { useSnackbar } from 'notistack';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useDeactivateAccessGroup } from '../../../graphql/updateDeactivateAccessGroup';
import { useActivateAccessGroup } from '../../../graphql/updateActivateAccessGroup';

export default function DeactivateAccessGroupDrawer({ handleClose, accessGroup, environmentID, getAccessGroup }) {
    // GraphQL hooks
    const deactivateAccessGroup = useDeactivateAccessGroup_(environmentID, accessGroup.AccessGroupID, handleClose, getAccessGroup);
    const activateAccessGroup = useActivateAccessGroup_(environmentID, accessGroup.AccessGroupID, handleClose, getAccessGroup);

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
                    {accessGroup.Active ? 'Deactivate' : 'Activate'} access group - {accessGroup.Name}
                </Typography>

                <Typography variant="body2" sx={{ mt: 2 }}>
                    You are about to {accessGroup.Active ? 'deactivate' : 'activate'} an access group, would you like to continue?
                </Typography>

                <Grid mt={4} display="flex" alignItems="center">
                    <Button onClick={accessGroup.Active ? deactivateAccessGroup : activateAccessGroup} variant="contained" color="primary" sx={{ mr: 2 }}>
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

// ------------- Custom Hooks

const useDeactivateAccessGroup_ = (environmentID, access_group_id, handleClose, getAccessGroup) => {
    // GraphQL hook
    const deactivateAccessGroup = useDeactivateAccessGroup();

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    // Deactivate an access group
    return async () => {
        const response = await deactivateAccessGroup({ environmentID, access_group_id });

        if (response.r === 'error') {
            closeSnackbar();
            enqueueSnackbar("Can't deactivate access group: " + response.msg, {
                variant: 'error',
            });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            enqueueSnackbar('Success', { variant: 'success' });
            handleClose();
            getAccessGroup();
        }
    };
};

const useActivateAccessGroup_ = (environmentID, access_group_id, handleClose, getAccessGroup) => {
    // GraphQL hook
    const activateAccessGroup = useActivateAccessGroup();

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    // Activate an access group
    return async () => {
        const response = await activateAccessGroup({ environmentID, access_group_id });

        if (response.r === 'error') {
            closeSnackbar();
            enqueueSnackbar("Can't activate access group: " + response.msg, {
                variant: 'error',
            });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            enqueueSnackbar('Success', { variant: 'success' });
            handleClose();
            getAccessGroup();
        }
    };
};
