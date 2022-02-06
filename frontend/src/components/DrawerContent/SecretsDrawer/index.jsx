import { useEffect, useState } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { useSnackbar } from 'notistack';
import CustomChip from '../../../components/CustomChip';
import { useGetWorkerGroupSecrets } from '../../../graphql/getWorkerGroupSecrets';

const SecretsDrawer = ({ handleClose, secretDrawerWorkGroup, environmentName }) => {
    // Local state
    const [secrets, setSecrets] = useState([]);

    // Custom hook
    const getWorkerGroupSecrets = useGetWorkerGroupSecrets_(environmentName, secretDrawerWorkGroup, setSecrets);

    // Get secrets on load
    useEffect(() => {
        getWorkerGroupSecrets();

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

                {secrets.map((secret) => (
                    <Box mt={3} key={secret.id} sx={{ borderBottom: '1px solid #9B9B9B' }}>
                        <Typography component="h2" mb={2} variant="body1" sx={{ fontSize: ' 1.0625rem' }}>
                            {secret.Secret}
                            <CustomChip label={secret.Active ? 'Active' : 'Inactive'} style={{ marginLeft: 16 }} size="small" customColor="green" />
                        </Typography>

                        <Typography component="h5" mb={1} variant="subtitle1">
                            Environment variable: {secret.EnvVar}
                        </Typography>

                        <Typography component="h5" mb={2} variant="subtitle1">
                            {secret.Description}
                        </Typography>
                    </Box>
                ))}
            </Box>
        </Box>
    );
};

export default SecretsDrawer;

// ------- Custom Hook
const useGetWorkerGroupSecrets_ = (environmentName, WorkerGroup, setSecrets) => {
    // GraphQL hook
    const getWorkerGroupSecrets = useGetWorkerGroupSecrets();

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    // Clear snackbar on load
    useEffect(() => {
        closeSnackbar();
    }, [closeSnackbar]);

    // Get secrets
    return async () => {
        const response = await getWorkerGroupSecrets({ environmentName, WorkerGroup });

        if (response === null) {
            setSecrets([]);
        } else if (response.r === 'error') {
            enqueueSnackbar("Can't get secrets: " + response.msg, { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message + ': get secrets failed', { variant: 'error' }));
        } else {
            setSecrets(response);
        }
    };
};
