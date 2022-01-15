import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Box, Button, Grid, Typography } from '@mui/material';
import { useSnackbar } from 'notistack';
import { useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { useUpdateDeleteEnvironment } from '../../../graphql/updateDeleteEnvironment';

const DeleteEnvironmentDrawer = ({ environment, handleClose }) => {
    const { closeSnackbar } = useSnackbar();

    // Clear snackbar on load
    useEffect(() => {
        closeSnackbar();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Delete environment hook
    const deleteEnvironment = useDelete(environment.id);

    return (
        <Box position="relative">
            <Box sx={{ p: '4.125rem 2.5rem 4.125rem 4.125rem' }}>
                <Box position="absolute" top="26px" right="39px" display="flex" alignItems="center">
                    <Button variant="text" startIcon={<FontAwesomeIcon icon={faTimes} onClick={handleClose} />}>
                        Close
                    </Button>
                </Box>

                <Typography component="h2" variant="h2">
                    Delete environment - {environment.name}
                </Typography>

                <Typography variant="body2" sx={{ mt: 2 }}>
                    Are you are about to delete an environment, would you like to continue?
                </Typography>

                <Grid mt={4} display="flex" alignItems="center">
                    <Button variant="contained" color="primary" sx={{ mr: 2 }} onClick={deleteEnvironment}>
                        Yes
                    </Button>
                    <Button variant="contained" color="primary" onClick={handleClose}>
                        No
                    </Button>
                </Grid>

                <Typography color="rgba(248, 0, 0, 1)" lineHeight="15.23px" sx={{ mt: '2.56rem' }} variant="subtitle2">
                    Warning: this action can’t be undone.
                </Typography>
            </Box>
        </Box>
    );
};

export default DeleteEnvironmentDrawer;

const useDelete = (environment_id) => {
    // GraphQL hook
    const updateDeleteEnvironment = useUpdateDeleteEnvironment();

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    // React router
    const history = useHistory();

    return async function () {
        let response = await updateDeleteEnvironment({ environment_id });

        if (response.r === 'error') {
            closeSnackbar();
            enqueueSnackbar("Can't delete environment: " + response.msg, {
                variant: 'error',
            });
        } else if (response.errors) {
            closeSnackbar();
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            closeSnackbar();
            enqueueSnackbar(`Success`, { variant: 'success' });
            history.push('/settings');
        }
    };
};
