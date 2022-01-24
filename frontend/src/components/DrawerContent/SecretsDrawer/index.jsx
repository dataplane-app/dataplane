import { useEffect, useState } from 'react';
import { Box, Typography, Button, Grid } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { useUpdateDeleteUser } from '../../../graphql/updateDeleteUser';
import { useSnackbar } from 'notistack';
import { useHistory } from 'react-router-dom';
import CustomChip from '../../../components/CustomChip';

const SecretsDrawer = ({ handleClose }) => {
    const { closeSnackbar } = useSnackbar();

    // Secrets state
    const [state, setState] = useState([
        {
            id: 1,
            name: 'Squirrel',
            envVar: 'secret_dp_squirrel',
            status: 'Active',
            description: 'The secret squirrel is for connectivity to AWS S3 buckets.',
        },
        {
            id: 2,
            name: 'Squirrel',
            envVar: 'secret_dp_squirrel',
            status: 'Active',
            description: 'The secret squirrel is for connectivity to AWS S3 buckets.',
        },
    ]);

    // Clear snackbar on load
    useEffect(() => {
        closeSnackbar();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <Box position="relative">
            <Box sx={{ p: '3rem', marginTop: '2rem' }}>
                <Box position="absolute" top="26px" right="35px" display="flex" alignItems="center">
                    <Button variant="text" onClick={handleClose} style={{ paddingLeft: '16px', paddingRight: '16px' }} startIcon={<FontAwesomeIcon icon={faTimes} />}>
                        Close
                    </Button>
                </Box>

                <Box display="flex" alignItems="center" mb={5} justifyContent="space-between">
                    <Typography component="h2" variant="h2">
                        Secrets
                    </Typography>
                    <Button variant="contained" onClick={handleClose} style={{ paddingLeft: '16px', paddingRight: '16px' }}>
                        Manage
                    </Button>
                </Box>

                {state.map((secret) => (
                    <Box mt={3} key={secret.id} sx={{ borderBottom: '1px solid #9B9B9B' }}>
                        <Typography component="h2" mb={2} variant="body1" sx={{ fontSize: ' 1.0625rem' }}>
                            {secret.name}
                            <CustomChip label={secret.status} style={{ marginLeft: 16 }} size="small" customColor="green" />
                        </Typography>

                        <Typography component="h5" mb={1} variant="subtitle1">
                            Environment variable: {secret.envVar}
                        </Typography>

                        <Typography component="h5" mb={2} variant="subtitle1">
                            {secret.description}
                        </Typography>
                    </Box>
                ))}
            </Box>
        </Box>
    );
};

export default SecretsDrawer;

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
