import { useEffect } from 'react';
import { Box, Typography, Button, Grid } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { useSnackbar } from 'notistack';
import { useTurnOnOffDeployment } from '../../graphql/turnOnOffDeployment';
import { useGetDeployments } from '../../graphql/getDeployments';

const TurnOffDeploymentDrawer = ({ handleClose, name, pipelineID, environmentID, setDeployments }) => {
    const { closeSnackbar } = useSnackbar();

    // Clear snackbar on load
    useEffect(() => {
        closeSnackbar();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Graphql hook
    const getDeployments = useGetDeploymentsHook(setDeployments, environmentID);
    const turnOnOffDeployment = useTurnOnOffDeploymentHook(pipelineID, environmentID, handleClose, getDeployments);

    return (
        <Box position="relative">
            <Box sx={{ p: '4.125rem' }}>
                <Box position="absolute" top="26px" right="39px" display="flex" alignItems="center">
                    <Button variant="text" onClick={handleClose} style={{ paddingLeft: '16px', paddingRight: '16px' }} startIcon={<FontAwesomeIcon icon={faTimes} />}>
                        Close
                    </Button>
                </Box>

                <Typography component="h2" variant="h2">
                    Turn off deployment - {name}
                </Typography>

                <Typography variant="body2" sx={{ mt: 2 }}>
                    You are about to turn off a deployment, would you like to continue?
                </Typography>

                <Grid mt={4} display="flex" alignItems="center">
                    <Button onClick={() => turnOnOffDeployment(false)} variant="contained" color="primary" sx={{ mr: 2 }}>
                        Yes
                    </Button>
                    <Button onClick={handleClose} variant="contained" color="primary">
                        No
                    </Button>
                </Grid>

                <Typography fontSize="0.8125rem" fontWeight={700} sx={{ mt: 4 }} color="cyan.main">
                    Note:
                </Typography>
                <Typography fontSize="0.8125rem" color="cyan.main" mt={0.2}>
                    Play trigger pipelines will remain online.
                </Typography>
                <Typography fontSize="0.8125rem" color="cyan.main" mt={0.2}>
                    Offline will turn off a scheduled trigger.
                </Typography>
            </Box>
        </Box>
    );
};

export default TurnOffDeploymentDrawer;

// ------ Custom hook
export const useTurnOnOffDeploymentHook = (pipelineID, environmentID, handleClose, getDeployments) => {
    // GraphQL hook
    const turnOnOffDeployment = useTurnOnOffDeployment();

    const { enqueueSnackbar } = useSnackbar();

    // Update trigger
    return async (online) => {
        const response = await turnOnOffDeployment({ environmentID, pipelineID, online });

        if (response.r || response.error) {
            enqueueSnackbar("Can't update trigger: " + (response.msg || response.r || response.error), { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            enqueueSnackbar('Success', { variant: 'success' });
            getDeployments();
            handleClose();
        }
    };
};

function useGetDeploymentsHook(setDeployments, environmentID) {
    // GraphQL hook
    const getPipelines = useGetDeployments();

    const { enqueueSnackbar } = useSnackbar();

    // Get deployments
    return async () => {
        const response = await getPipelines({ environmentID });
        if (response.r || response.error) {
            enqueueSnackbar("Can't get deployments: " + (response.msg || response.r || response.error), { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            setDeployments(response);
        }
    };
}
