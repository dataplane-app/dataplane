import { useEffect } from 'react';
import { Box, Typography, Button, Grid } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { useUpdateDeactivateEnvironment } from '../../../graphql/environments/updateDeactivateEnvironment.js';
import { useUpdateActivateEnvironment } from '../../../graphql/environments/updateActivateEnvironment.js';
import { useSnackbar } from 'notistack';

const DeactivateEnvironmentDrawer = ({ environment, handleClose, refreshData }) => {
    const { closeSnackbar } = useSnackbar();

    // Clear snackbar on load
    useEffect(() => {
        closeSnackbar();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Deactivate environment hook
    const deactivate = useDeactivate(environment.id, handleClose, refreshData);

    // Activate environment hook
    const activate = useActivate(environment.id, handleClose, refreshData);

    return (
        <Box position="relative">
            <Box sx={{ p: '4.125rem' }}>
                <Box position="absolute" top="26px" right="39px" display="flex" alignItems="center">
                    <Button variant="text" onClick={handleClose} style={{ paddingLeft: '16px', paddingRight: '16px' }} startIcon={<FontAwesomeIcon icon={faTimes} />}>
                        Close
                    </Button>
                </Box>

                <Typography component="h2" variant="h2">
                    {environment.active === true ? 'Deactivate' : 'Activate'} environment - {environment.name}
                </Typography>

                <Typography variant="body2" sx={{ mt: 2 }}>
                    You are about to {environment.active === true ? 'deactivate' : 'activate'} a environment, would you like to continue?
                </Typography>

                <Grid mt={4} display="flex" alignItems="center">
                    <Button onClick={environment.active === true ? deactivate : activate} variant="contained" color="primary" sx={{ mr: 2 }}>
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

export default DeactivateEnvironmentDrawer;

// ------ Custom hooks

const useDeactivate = (environment_id, handleClose, refreshData) => {
    // GraphQL hook
    const updateDeactivateEnvironment = useUpdateDeactivateEnvironment();

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    return async function () {
        let response = await updateDeactivateEnvironment({ environment_id });

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

const useActivate = (environment_id, handleClose, refreshData) => {
    // GraphQL hook
    const updateActivateEnvironment = useUpdateActivateEnvironment();

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    return async function () {
        let response = await updateActivateEnvironment({ environment_id });

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
