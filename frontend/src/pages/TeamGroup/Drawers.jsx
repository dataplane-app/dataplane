import { Box, Typography, Button, Drawer, TextField } from '@mui/material';
import { useState, useEffect } from 'react';
import { useSnackbar } from 'notistack';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export default function Drawers() {
    const [isOpenDelete, setIsOpenDelete] = useState(false);
    return (
        <>
            <Box mt="3rem">
                <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    onClick={() => setIsOpenDelete(true)}
                    sx={{ fontWeight: '700', width: '100%', mt: '.78rem', fontSize: '.81rem', border: 2, '&:hover': { border: 2 } }}>
                    Delete access group
                </Button>

                <Typography color="rgba(248, 0, 0, 1)" lineHeight="15.23px" sx={{ mt: '.56rem' }} variant="subtitle2">
                    Warning: this action can't be undone.
                </Typography>
            </Box>
            <Drawer anchor="right" open={isOpenDelete} onClose={() => setIsOpenDelete(false)}>
                <DeleteAccessGroupDrawer handleClose={() => setIsOpenDelete(false)} />
            </Drawer>
        </>
    );
}

// ----------- DRAWERS -----------

function DeleteAccessGroupDrawer({ handleClose }) {
    // GraphQL hook
    // const updateChangeMyPassword = useUpdateChangeMyPassword();

    // State
    const [password, setPassword] = useState(null);
    const [confirmPassword, setConfirmPassword] = useState(null);

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    // Clear snackbar on load
    useEffect(() => {
        closeSnackbar();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Submit new password
    const handleSubmit = async () => {
        if (password !== confirmPassword) {
            enqueueSnackbar("Passwords don't match", { variant: 'error' });
        } else {
            // let response = await updateChangeMyPassword({ password });
            // if (response.r === 'error') {
            //     closeSnackbar();
            //     enqueueSnackbar("Can't change password: " + response.msg, {
            //         variant: 'error',
            //     });
            // } else if (response.errors) {
            //     closeSnackbar();
            //     response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
            // } else {
            //     closeSnackbar();
            //     enqueueSnackbar(`Success`, { variant: 'success' });
            //     // handleClose();
            // }
        }
    };

    return (
        <Box position="relative" style={{ maxWidth: '400px', margin: 'auto', marginTop: 0 }}>
            <Box sx={{ p: '4.125rem' }}>
                <Box position="absolute" top="26px" right="39px" display="flex" alignItems="center">
                    <Button variant="text" onClick={handleClose} style={{ paddingLeft: '16px', paddingRight: '16px' }} startIcon={<FontAwesomeIcon icon={faTimes} />}>
                        Close
                    </Button>
                </Box>

                <Typography component="h2" variant="h2" mt={2}>
                    Change password
                </Typography>

                <Box mt={3.4} display="flex" alignItems="center" flexDirection="column">
                    <TextField
                        label="New password"
                        id="new_password"
                        type="password"
                        size="small"
                        required
                        onChange={(e) => setPassword(e.target.value)}
                        sx={{ mb: 2, fontSize: '.75rem', display: 'flex' }}
                    />
                    <TextField
                        label="New password"
                        id="confirm_password"
                        type="password"
                        size="small"
                        required
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        sx={{ mb: 3, fontSize: '.75rem', display: 'flex' }}
                    />
                    <Button onClick={handleSubmit} variant="contained" color="primary" height="100%" style={{ width: '100%' }}>
                        Submit
                    </Button>
                </Box>
            </Box>
        </Box>
    );
}
