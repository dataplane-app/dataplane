import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Autocomplete, Box, Button, Grid, TextField, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useGlobalFlowState } from '../../../pages/PipelineEdit';
import { Downgraded } from '@hookstate/core';
import { useGetWorkerGroups } from '../../../graphql/getWorkerGroups';
import { useSnackbar } from 'notistack';

const ProcessTypeDrawer = ({ handleClose, setElements, environmentID, workerGroup }) => {
    // React hook form
    const { register, handleSubmit, reset } = useForm();

    // Flow state
    const FlowState = useGlobalFlowState();

    // Local state
    const [selectedElement, setSelectedElement] = useState('-');
    const [workerGroups, setWorkerGroups] = useState([]);
    const [selectedWorkerGroup, setSelectedWorkerGroup] = useState({ WorkerGroup: 'default' });

    // Custom GraphQL hook
    const getWorkerGroups = useGetWorkerGroupsHook(environmentID, setWorkerGroups);

    // Fill the form with selected element information
    useEffect(() => {
        setSelectedElement(FlowState.selectedElement.attach(Downgraded).get());
        if (FlowState.selectedElement.data.workerGroup.get()) {
            setSelectedWorkerGroup({ WorkerGroup: FlowState.selectedElement.data.workerGroup.get() });
        }

        reset({
            name: FlowState.selectedElement.data?.name.get(),
            description: FlowState.selectedElement.data?.description.get(),
        });

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [FlowState.selectedElement?.data?.name.get()]);

    // Get workers on load
    useEffect(() => {
        getWorkerGroups();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function onSubmit(data) {
        setElements((els) =>
            els.map((el) => {
                if (el.id === selectedElement.id) {
                    el.data = {
                        ...el.data,
                        name: data.name,
                        description: data.description,
                        workerGroup: data.workerGroup === 'default' ? '' : data.workerGroup,
                    };
                }
                return el;
            })
        );
        handleClose();
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <Box position="relative" width="100%">
                <Box sx={{ p: '4.125rem 3.81rem' }}>
                    <Box position="absolute" top="26px" right="39px" display="flex" alignItems="center">
                        <Button onClick={handleClose} style={{ paddingLeft: '16px', paddingRight: '16px' }} variant="text" startIcon={<FontAwesomeIcon icon={faTimes} />}>
                            Close
                        </Button>
                    </Box>

                    <Box mt={3} width="212px">
                        <Typography component="h2" variant="h2">
                            Processor - {selectedElement?.data?.name}
                        </Typography>

                        <TextField
                            label="Title"
                            id="title"
                            size="small"
                            required
                            sx={{ mt: 2, mb: 2, fontSize: '.75rem', display: 'flex' }}
                            {...register('name', { required: true })}
                        />
                        <TextField label="Description" id="description" size="small" sx={{ mb: 2, fontSize: '.75rem', display: 'flex' }} {...register('description')} />

                        <Autocomplete
                            options={workerGroups}
                            value={selectedWorkerGroup}
                            disableClearable
                            getOptionLabel={(option) => (option.WorkerGroup === workerGroup || option.WorkerGroup === '' ? 'default' : option.WorkerGroup)}
                            onChange={(event, newValue) => {
                                setSelectedWorkerGroup(newValue);
                            }}
                            renderInput={(params) => (
                                <TextField
                                    {...params} //
                                    label="Worker group"
                                    size="small"
                                    sx={{ fontSize: '.75rem', display: 'flex' }}
                                    {...register('workerGroup')}
                                />
                            )}
                        />

                        <Grid mt={4} display="flex" alignItems="center">
                            <Button type="submit" variant="contained" color="primary" style={{ width: '100%' }}>
                                Save
                            </Button>
                        </Grid>
                    </Box>
                </Box>
            </Box>
        </form>
    );
};

export default ProcessTypeDrawer;

const useGetWorkerGroupsHook = (environmentID, setWorkerGroups) => {
    // GraphQL hook
    const getWorkerGroups = useGetWorkerGroups();

    const { enqueueSnackbar } = useSnackbar();

    // Get worker groups
    return async () => {
        const response = await getWorkerGroups({ environmentID });

        if (response === null) {
            setWorkerGroups([]);
        } else if (response.r === 'error') {
            enqueueSnackbar("Can't get worker groups: " + response.msg, { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            setWorkerGroups(response);
        }
    };
};
