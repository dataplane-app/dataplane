import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Box, Button, Grid, Typography } from '@mui/material';
import { useSnackbar } from 'notistack';
import { useEffect } from 'react';

const DeleteEnvironmentDrawer = ({ envName, handleClose }) => {
    const { closeSnackbar } = useSnackbar();

    // Clear snackbar on load
    useEffect(() => {
        closeSnackbar();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <Box position="relative">
            <Box sx={{ p: '4.125rem 2.5rem 4.125rem 4.125rem' }}>
                <Box position="absolute" top="26px" right="39px" display="flex" alignItems="center">
                    <Button variant="text" startIcon={<FontAwesomeIcon icon={faTimes} onClick={handleClose} />}>
                        Close
                    </Button>
                </Box>

                <Typography component="h2" variant="h2">
                    Delete environment - {envName}
                </Typography>

                <Typography variant="body2" sx={{ mt: 2 }}>
                    Are you are about to delete an environment, would you like to continue?
                </Typography>

                <Grid mt={4} display="flex" alignItems="center">
                    <Button variant="contained" color="primary" sx={{ mr: 2 }}>
                        Yes
                    </Button>
                    <Button variant="contained" color="primary">
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
