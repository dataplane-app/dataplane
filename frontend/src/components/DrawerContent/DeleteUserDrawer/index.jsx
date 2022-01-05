import { useEffect } from 'react';
import { Box, Typography, Button, Grid } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { useUpdateDeleteUser } from '../../../graphql/updateDeleteUser';
import { useSnackbar } from 'notistack';
import { useHistory } from 'react-router-dom';

const DeleteUserDrawer = ({ user, handleClose }) => {
    const { closeSnackbar } = useSnackbar();

    // Clear snackbar on load
    useEffect(() => {
        closeSnackbar();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Delete user hook
    const deleteUser = useDelete(user.user_id);

    return (
        <Box position="relative">
            <Box sx={{ p: '4.125rem' }}>
                <Box position="absolute" top="26px" right="39px" display="flex" alignItems="center">
                    <Button variant="text" onClick={handleClose} style={{ paddingLeft: '16px', paddingRight: '16px' }} startIcon={<FontAwesomeIcon icon={faTimes} />}>
                        Close
                    </Button>
                </Box>

                <Typography component="h2" variant="h2">
                    Delete user - {user.first_name} {user.last_name}
                </Typography>

                <Typography variant="body2" sx={{ mt: 2 }}>
                    You are about to delete a user, would you like to continue?
                </Typography>

                <Grid mt={4} display="flex" alignItems="center">
                    <Button onClick={deleteUser} variant="contained" color="primary" sx={{ mr: 2 }}>
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
};

export default DeleteUserDrawer;

// ------ Custom hooks

const useDelete = (userid) => {
    // GraphQL hook
    const updateDeleteUser = useUpdateDeleteUser();

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    // React router
    const history = useHistory();

    return async function () {
        let response = await updateDeleteUser({ userid });

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
            history.push('/teams');
        }
    };
};
