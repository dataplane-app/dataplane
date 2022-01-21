import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Box, Button, TextField, Typography } from '@mui/material';
import { useSnackbar } from 'notistack';
import { useEffect, useState } from 'react';
import { useUpdateSecretValue } from '../../../graphql/updateSecretValue';

const ChangeSecretDrawer = ({ secretName, handleClose, environmentId }) => {
    // State
    const [newSecretValue, setNewSecretValue] = useState(null);

    const { closeSnackbar } = useSnackbar();

    // Clear snackbar on load
    useEffect(() => {
        closeSnackbar();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Custom GraphQL hook
    const updateScretValue = useUpdateSecretValue_(secretName, environmentId, newSecretValue, handleClose);

    return (
        <Box position="relative">
            <Box sx={{ p: '4.125rem 2.5rem 4.125rem 4.125rem' }}>
                <Box position="absolute" top="26px" right="39px" display="flex" alignItems="center">
                    <Button variant="text" onClick={handleClose} style={{ paddingLeft: '16px', paddingRight: '16px' }} startIcon={<FontAwesomeIcon icon={faTimes} />}>
                        Close
                    </Button>
                </Box>

                <Typography component="h2" variant="h2" mt={2}>
                    Change secret - {secretName}
                </Typography>

                <Box mt={3.4} display="flex" alignItems="center" flexDirection="column">
                    <TextField
                        label="New secret"
                        id="new_secret"
                        size="small"
                        type="password"
                        required
                        onChange={(e) => setNewSecretValue(e.target.value)}
                        sx={{ mb: 3.4, fontSize: '.75rem', display: 'flex', width: '100%' }}
                    />
                    <Button onClick={updateScretValue} variant="contained" color="primary" height="100%" style={{ width: '100%' }}>
                        Submit
                    </Button>
                </Box>
            </Box>
        </Box>
    );
};

export default ChangeSecretDrawer;

// ------ Custom Hook
const useUpdateSecretValue_ = (secret, environmentId, value, handleClose) => {
    // GraphQL hook
    const updateSecretValue = useUpdateSecretValue();

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    // Update secret value
    return async () => {
        const response = await updateSecretValue({ secret, environmentId, value });

        if (response.r === 'error') {
            closeSnackbar();
            enqueueSnackbar("Can't update secret value: " + response.msg, { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message + ': update secret value failed', { variant: 'error' }));
        } else {
            enqueueSnackbar('Success', { variant: 'success' });
            handleClose();
        }
    };
};
