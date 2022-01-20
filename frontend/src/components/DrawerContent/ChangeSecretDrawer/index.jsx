import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Box, Button, TextField, Typography } from '@mui/material';
import { useSnackbar } from 'notistack';
import { useEffect, useState } from 'react';

const ChangeSecretDrawer = ({ secretName, handleClose }) => {
    // State
    const [newSecretValue, setNewSecretValue] = useState(null);

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    // Clear snackbar on load
    useEffect(() => {
        closeSnackbar();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Submit new password
    const handleSubmit = async () => {
        if (!newSecretValue) {
            return;
        } else {
            // Mutation code here
            enqueueSnackbar(`Success`, { variant: 'success' });
            handleClose();
        }
    };

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
                        required
                        onChange={(e) => setNewSecretValue(e.target.value)}
                        sx={{ mb: 3.4, fontSize: '.75rem', display: 'flex', width: '100%' }}
                    />
                    <Button onClick={handleSubmit} variant="contained" color="primary" height="100%" style={{ width: '100%' }}>
                        Submit
                    </Button>
                </Box>
            </Box>
        </Box>
    );
};

export default ChangeSecretDrawer;
