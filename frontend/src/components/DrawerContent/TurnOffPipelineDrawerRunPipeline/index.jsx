import { useEffect } from 'react';
import { Box, Typography, Button, Grid } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { useSnackbar } from 'notistack';
import { useTurnOnOffPipeline } from '../../../graphql/pipelines/turnOnOffPipeline.js';

const TurnOffPipelineDrawerRunPipeline = ({ handleClose, name, pipelineID, environmentID, setPipelines, getPipelines }) => {
    const { closeSnackbar } = useSnackbar();

    // Clear snackbar on load
    useEffect(() => {
        closeSnackbar();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Graphql hook
    const turnOnOffPipeline = useTurnOnOffPipelineHook(pipelineID, environmentID, handleClose, getPipelines);

    return (
        <Box position="relative">
            <Box sx={{ p: '4.125rem' }}>
                <Box position="absolute" top="26px" right="39px" display="flex" alignItems="center">
                    <Button variant="text" onClick={handleClose} style={{ paddingLeft: '16px', paddingRight: '16px' }} startIcon={<FontAwesomeIcon icon={faTimes} />}>
                        Close
                    </Button>
                </Box>

                <Typography component="h2" variant="h2">
                    Turn off pipeline - {name}
                </Typography>

                <Typography variant="body2" sx={{ mt: 2 }}>
                    You are about to turn off a pipeline, would you like to continue?
                </Typography>

                <Grid mt={4} display="flex" alignItems="center">
                    <Button onClick={() => turnOnOffPipeline(false)} variant="contained" color="primary" sx={{ mr: 2 }}>
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

export default TurnOffPipelineDrawerRunPipeline;

// ------ Custom hook
export const useTurnOnOffPipelineHook = (pipelineID, environmentID, handleClose, getPipelines) => {
    // GraphQL hook
    const turnOnOffPipeline = useTurnOnOffPipeline();

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    // Update trigger
    return async (online) => {
        const response = await turnOnOffPipeline({ environmentID, pipelineID, online });

        if (response.r === 'error') {
            closeSnackbar();
            enqueueSnackbar("Can't update trigger: " + response.msg, {
                variant: 'error',
            });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            enqueueSnackbar('Success', { variant: 'success' });
            handleClose();
            getPipelines();
        }
    };
};
