import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Autocomplete, Box, Button, Grid, TextField, Typography } from '@mui/material';
import { useSnackbar } from 'notistack';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useGlobalEnvironmentState } from '../../EnviromentDropdown';
import { useGetWorkerGroups } from '../../../graphql/getWorkerGroups';
import { useDuplicatePipeline } from '../../../graphql/duplicatePipeline';
import { useGetPipelines } from '../../../graphql/getPipelines';

const DuplicatePipelineDrawer = ({ handleClose, environmentID, pipelineID, name, setPipelines }) => {
    // React hook form
    const { register, handleSubmit } = useForm();

    // Global environment state with hookstate
    const Environment = useGlobalEnvironmentState();

    // Local state
    const [workerGroups, setWorkerGroups] = useState([]);

    // Custom GraphQL hook
    const getPipelines = useGetPipelinesHook(setPipelines, environmentID);
    const duplicatePipeline = useDuplicatePipelineHook(pipelineID, environmentID, getPipelines, handleClose);
    const getWorkerGroups = useGetWorkerGroupsHook(Environment.id.get(), setWorkerGroups);

    // Get workers on load
    useEffect(() => {
        getWorkerGroups();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <form onSubmit={handleSubmit(duplicatePipeline)}>
            <Box position="relative">
                <Box sx={{ p: '4.125rem' }}>
                    <Box position="absolute" top="26px" right="39px" display="flex" alignItems="center">
                        <Button onClick={handleClose} style={{ paddingLeft: '16px', paddingRight: '16px' }} variant="text" startIcon={<FontAwesomeIcon icon={faTimes} />}>
                            Close
                        </Button>
                    </Box>

                    <Box mt={3} width="212px">
                        <Typography component="h2" variant="h2" width="200%">
                            Duplicate pipeline - {name}
                        </Typography>

                        <TextField
                            label="Title"
                            id="name"
                            size="small"
                            required
                            sx={{ mt: 4, mb: 2, fontSize: '.75rem', display: 'flex' }}
                            {...register('name', { required: true })}
                        />
                        <TextField label="Description" id="description" size="small" sx={{ mb: 2, fontSize: '.75rem', display: 'flex' }} {...register('description')} />

                        <Autocomplete
                            options={workerGroups}
                            getOptionLabel={(option) => option.WorkerGroup}
                            renderInput={(params) => (
                                <TextField
                                    {...params} //
                                    label="Worker group"
                                    required
                                    size="small"
                                    sx={{ fontSize: '.75rem', display: 'flex' }}
                                    {...register('workerGroup', { required: true })}
                                />
                            )}
                        />

                        <Grid mt={4} display="flex" alignItems="center">
                            <Button type="submit" required variant="contained" color="primary" style={{ width: '100%' }}>
                                Save
                            </Button>
                        </Grid>
                    </Box>
                </Box>
            </Box>
        </form>
    );
};

export default DuplicatePipelineDrawer;

// ------ Custom hooks
const useDuplicatePipelineHook = (pipelineID, environmentID, getPipelines, handleClose) => {
    // GraphQL hook
    const duplicatePipeline = useDuplicatePipeline();

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    // Duplicate pipeline
    return async () => {
        const response = await duplicatePipeline({ environmentID, pipelineID });

        if (response.r || response.error) {
            closeSnackbar();
            enqueueSnackbar("Can't duplicate pipeline: " + (response.msg || response.r || response.error), { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            enqueueSnackbar('Success', { variant: 'success' });
            getPipelines();
            handleClose();
        }
    };
};

export const useGetWorkerGroupsHook = (environmentID, setWorkerGroups) => {
    // GraphQL hook
    const getAccessGroupUsers = useGetWorkerGroups();

    const { enqueueSnackbar } = useSnackbar();

    // Get worker groups
    return async () => {
        const response = await getAccessGroupUsers({ environmentID });

        if (response === null) {
            setWorkerGroups([]);
        } else if (response.r || response.error) {
            enqueueSnackbar("Can't get worker groups: " + (response.msg || response.r || response.error), { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            setWorkerGroups(response);
        }
    };
};

function useGetPipelinesHook(setPipelines, environmentID) {
    // GraphQL hook
    const getPipelines = useGetPipelines();

    const { enqueueSnackbar } = useSnackbar();

    // Get pipelines
    return async () => {
        const response = await getPipelines({ environmentID });

        if (response.r || response.error) {
            enqueueSnackbar("Can't get pipelines: " + (response.msg || response.r || response.error), { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            setPipelines(response);
        }
    };
}
