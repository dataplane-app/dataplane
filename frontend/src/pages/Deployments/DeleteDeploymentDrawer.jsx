import { useEffect } from 'react';
import { Box, Typography, Button, Grid } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { useSnackbar } from 'notistack';
import { useDeleteDeployment } from '../../graphql/deleteDeployment';
import { useGlobalEnvironmentState } from '../../components/EnviromentDropdown';
import { useGetDeployments } from '../../graphql/getDeployments';

const DeleteDeploymentDrawer = ({ pipelineName, handleClose, setDeployments, pipelineID, version, environmentID }) => {
    const { closeSnackbar } = useSnackbar();

    // Clear snackbar on load
    useEffect(() => {
        closeSnackbar();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Graphql hook
    const getDeployments = useGetDeploymentsHook(setDeployments, environmentID);
    const deleteDeployment = useDeleteDeploymentHook(pipelineID, handleClose, getDeployments, version);

    return (
        <Box position="relative">
            <Box sx={{ p: '4.125rem' }}>
                <Box position="absolute" top="26px" right="39px" display="flex" alignItems="center">
                    <Button variant="text" onClick={handleClose} style={{ paddingLeft: '16px', paddingRight: '16px' }} startIcon={<FontAwesomeIcon icon={faTimes} />}>
                        Close
                    </Button>
                </Box>

                <Typography component="h2" variant="h2">
                    Delete deployment - {pipelineName}
                </Typography>

                <Typography variant="body2" sx={{ mt: 2 }}>
                    You are about to delete a deployment, would you like to continue?
                </Typography>

                <Grid mt={4} display="flex" alignItems="center">
                    <Button onClick={deleteDeployment} variant="contained" color="primary" sx={{ mr: 2 }}>
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

export default DeleteDeploymentDrawer;

// ------ Custom hooks
const useDeleteDeploymentHook = (pipelineID, handleClose, getDeployments, version) => {
    // GraphQL hook
    const deleteDeployment = useDeleteDeployment();

    // Global environment state
    const Environment = useGlobalEnvironmentState();

    const { enqueueSnackbar } = useSnackbar();

    // Delete deployment
    return async () => {
        const response = await deleteDeployment({ environmentID: Environment.id.get(), pipelineID, version });

        if (response.r || response.error) {
            enqueueSnackbar("Can't delete deployment: " + (response.msg || response.r || response.error), { variant: 'error' });
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
