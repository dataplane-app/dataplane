import { useEffect, useState } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { useSnackbar } from 'notistack';
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
    }, [closeSnackbar]);

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
