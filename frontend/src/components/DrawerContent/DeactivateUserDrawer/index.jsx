import { useEffect } from 'react';
import { Box, Typography, Button, Grid } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { useUpdateDeactivateUser } from '../../../graphql/updateDeactivateUser';
import { useUpdateActivateUser } from '../../../graphql/updateActivateUser';
import { useSnackbar } from 'notistack';

const DeactivateUserDrawer = ({ user, handleClose, refreshData }) => {
    const { closeSnackbar } = useSnackbar();

    // Clear snackbar on load
    useEffect(() => {
        closeSnackbar();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Deactivate user hook
    const deactivate = useDeactivate(user.user_id, handleClose, refreshData);

    // Activate user hook
    const activate = useActivate(user.user_id, handleClose, refreshData);

    return (
        <Box position="relative">
            <Box sx={{ p: '4.125rem' }}>
                <Box position="absolute" top="26px" right="39px" display="flex" alignItems="center">
                    <Button variant="text" onClick={handleClose} style={{ paddingLeft: '16px', paddingRight: '16px' }} startIcon={<FontAwesomeIcon icon={faTimes} />}>
                        Close
                    </Button>
                </Box>

                <Typography component="h2" variant="h2">
                    {user.status === 'active' ? 'Deactivate' : 'Activate'} user - {user.first_name} {user.last_name}
                </Typography>

                <Typography variant="body2" sx={{ mt: 2 }}>
                    You are about to {user.status === 'active' ? 'deactivate' : 'activate'} a user, would you like to continue?
                </Typography>

                <Grid mt={4} display="flex" alignItems="center">
                    <Button onClick={user.status === 'active' ? deactivate : activate} variant="contained" color="primary" sx={{ mr: 2 }}>
                        Yes
                    </Button>
                    <Button onClick={handleClose} variant="contained" color="primary">
                        No
                    </Button>
                </Grid>
            </Box>
        </Box>
    );
};

export default DeactivateUserDrawer;

// ------ Custom hooks

const useDeactivate = (userid, handleClose, refreshData) => {
    // GraphQL hook
    const updateDeactivateUser = useUpdateDeactivateUser();

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    return async function () {
        let response = await updateDeactivateUser({ userid });

        if (response.r === 'error') {
            closeSnackbar();
            enqueueSnackbar("Can't deactivate user: " + response.msg, {
                variant: 'error',
            });
        } else if (response.errors) {
            closeSnackbar();
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            closeSnackbar();
            enqueueSnackbar(`Success`, { variant: 'success' });
            handleClose();
            refreshData();
        }
    };
};

const useActivate = (userid, handleClose, refreshData) => {
    // GraphQL hook
    const updateActivateUser = useUpdateActivateUser();

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    return async function () {
        let response = await updateActivateUser({ userid });

        if (response.r === 'error') {
            closeSnackbar();
            enqueueSnackbar("Can't Activate user: " + response.msg, {
                variant: 'error',
            });
        } else if (response.errors) {
            closeSnackbar();
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            closeSnackbar();
            enqueueSnackbar(`Success`, { variant: 'success' });
            handleClose();
            refreshData();
        }
    };
};
