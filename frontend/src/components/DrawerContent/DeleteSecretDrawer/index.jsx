import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Box, Button, Grid, Typography } from '@mui/material';
import { useSnackbar } from 'notistack';
import { useHistory } from 'react-router-dom';
import { useEffect } from 'react';
import { useUpdateDeleteSecret } from '../../../graphql/secrets/updateDeleteSecret.js';

const DeleteSecretDrawer = ({ secretName, handleClose, environmentId }) => {
    const { closeSnackbar } = useSnackbar();

    // Custom GraphQL hooks
    const deleteSecret = useUpdateDeleteSecret_(environmentId, secretName);

    // Clear snackbar on load
    useEffect(() => {
        closeSnackbar();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <Box position="relative">
            <Box sx={{ p: '4.125rem 2.5rem 4.125rem 4.125rem' }}>
                <Box position="absolute" top="26px" right="39px" display="flex" alignItems="center">
                    <Button onClick={handleClose} style={{ paddingLeft: '16px', paddingRight: '16px' }} variant="text" startIcon={<FontAwesomeIcon icon={faTimes} />}>
                        Close
                    </Button>
                </Box>

                <Typography component="h2" variant="h2">
                    Delete secret - {secretName}
                </Typography>

                <Typography variant="body2" sx={{ mt: 2 }}>
                    Are you are about to delete a secret, would you like to continue?
                </Typography>

                <Grid mt={4} display="flex" alignItems="center">
                    <Button onClick={deleteSecret} variant="contained" color="primary" sx={{ mr: 2 }}>
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

export default DeleteSecretDrawer;

const useUpdateDeleteSecret_ = (environmentId, secret) => {
    // GraphQL hook
    const deleteSecret = useUpdateDeleteSecret();

    // React router
    const history = useHistory();

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    // Delete secret
    return async () => {
        const response = await deleteSecret({ environmentId, secret });

        if (response.r === 'error') {
            closeSnackbar();
            enqueueSnackbar("Can't delete secrets: " + response.msg, { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            enqueueSnackbar('Success', { variant: 'success' });
            history.push(`/secrets`);
        }
    };
};
