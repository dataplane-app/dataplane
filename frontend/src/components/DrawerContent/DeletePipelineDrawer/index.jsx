import { useEffect } from 'react';
import { Box, Typography, Button, Grid } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { useSnackbar } from 'notistack';
import { useDeletePipeline } from '../../../graphql/deletePipeline';
import { useGlobalEnvironmentState } from '../../EnviromentDropdown';

const DeletePipelineDrawer = ({ pipelineName, handleClose, getPipelines, pipelineID }) => {
    const { closeSnackbar } = useSnackbar();

    // Clear snackbar on load
    useEffect(() => {
        closeSnackbar();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Graphql hook
    const deletePipeline = useDeletePipelineHook(pipelineID, handleClose, getPipelines);

    return (
        <Box position="relative">
            <Box sx={{ p: '4.125rem' }}>
                <Box position="absolute" top="26px" right="39px" display="flex" alignItems="center">
                    <Button variant="text" onClick={handleClose} style={{ paddingLeft: '16px', paddingRight: '16px' }} startIcon={<FontAwesomeIcon icon={faTimes} />}>
                        Close
                    </Button>
                </Box>

                <Typography component="h2" variant="h2">
                    Delete pipeline - {pipelineName}
                </Typography>

                <Typography variant="body2" sx={{ mt: 2 }}>
                    You are about to delete a pipeline, would you like to continue?
                </Typography>

                <Grid mt={4} display="flex" alignItems="center">
                    <Button onClick={deletePipeline} variant="contained" color="primary" sx={{ mr: 2 }}>
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

export default DeletePipelineDrawer;

// ------ Custom hooks
const useDeletePipelineHook = (pipelineID, handleClose, getPipelines) => {
    // GraphQL hook
    const deletePipeline = useDeletePipeline();

    // Global environment state
    const Environment = useGlobalEnvironmentState();

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    // Delete pipeline
    return async () => {
        const response = await deletePipeline({ environmentID: Environment.id.get(), pipelineID });

        if (response.r === 'error') {
            closeSnackbar();
            enqueueSnackbar("Can't delete pipeline: " + response.msg, {
                variant: 'error',
            });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            enqueueSnackbar('Success', { variant: 'success' });
            getPipelines();
            handleClose();
        }
    };
};
