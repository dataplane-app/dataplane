import { useState, useEffect } from 'react';
import { Box, Typography, Button, Grid, Autocomplete, TextField } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrashAlt } from '@fortawesome/free-regular-svg-icons';
import { useHistory } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { useParams } from 'react-router-dom';
import { useGetRemoteProcessGroups } from '../../../../graphql/getRemoteProcessGroups';
import { useForm } from 'react-hook-form';
import { useGetRemoteWorkersProcessGroups } from '../../../../graphql/getRemoteWorkersProcessGroups';
import { useAddRemoteWorkerEnvironment } from '../../../../graphql/addRemoteWorkerEnvironment';
import { useGlobalEnvironmentState } from '../../../../components/EnviromentDropdown';
import { useRemoveRemoteWorkerFromProcessGroup } from '../../../../graphql/removeRemoteWorkerFromProcessGroup';

export default function ProcessGroups({ environmentId }) {
    // User states
    const [workersProcessGroups, setWorkersProcessGroups] = useState([]);
    const [availableRemoteProcessGroups, setAvailableRemoteProcessGroups] = useState([]);

    // Control state
    const [clear, setClear] = useState(1);

    // React router
    let history = useHistory();

    // Global environment state with hookstate
    const Environment = useGlobalEnvironmentState();

    const { register, handleSubmit } = useForm();

    // Custom hook
    const getRemoteProcessGroups = useGetRemoteProcessGroupsHook(environmentId, setAvailableRemoteProcessGroups);
    const getRemoteWorkersProcessGroups = useGetRemoteWorkersProcessGroupsHook(environmentId, setWorkersProcessGroups);
    const addRemoteWorkerEnvironment = useAddRemoteWorkerEnvironmentHook(availableRemoteProcessGroups, getRemoteWorkersProcessGroups);
    const removeRemoteWorkerFromProcessGroup = useRemoveRemoteWorkerFromProcessGroupHook(getRemoteWorkersProcessGroups);

    // Get members on load
    useEffect(() => {
        if (!environmentId) return;
        getRemoteProcessGroups();
        getRemoteWorkersProcessGroups();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [environmentId]);

    return (
        <>
            <Typography component="h3" variant="h3" color="text.primary">
                Process groups
            </Typography>

            <Grid mt={2} display="flex" alignItems="center">
                <form style={{ marginTop: '16px', display: 'flex', alignItems: 'center' }} onSubmit={handleSubmit(addRemoteWorkerEnvironment)}>
                    <Autocomplete
                        disablePortal
                        id="autocomplete_process_groups"
                        key={clear} //Changing this value on submit clears the input field
                        sx={{ minWidth: '280px' }}
                        // Filter out worker's remote process groups from all remote process groups
                        options={availableRemoteProcessGroups.filter((group) => !workersProcessGroups.map((a) => a.ID).includes(group.ID))}
                        getOptionLabel={(option) => option.Name}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Process group"
                                id="process_groups"
                                size="small"
                                {...register('remoteProcessGroupName')}
                                sx={{ fontSize: '.75rem', display: 'flex' }}
                            />
                        )}
                    />
                    <Button
                        onClick={() => {
                            setClear(clear * -1); // Clears autocomplete input field
                        }}
                        variant="contained"
                        type="submit"
                        color="primary"
                        height="100%"
                        sx={{ ml: 1 }}>
                        Add
                    </Button>
                </form>
            </Grid>

            <Box mt="1.31rem">
                {workersProcessGroups.map((row) => (
                    <Grid display="flex" alignItems="flex-start" key={row.ID} mt={1.5} mb={1.5}>
                        <Box
                            onClick={() => {
                                removeRemoteWorkerFromProcessGroup(row);
                            }}
                            component={FontAwesomeIcon}
                            sx={{ fontSize: '17px', mr: '7px', color: 'rgba(248, 0, 0, 1)', cursor: 'pointer' }}
                            icon={faTrashAlt}
                        />
                        <Box>
                            <Typography
                                onClick={() => history.push(`/remote/processgroups/${row.ID}`)}
                                variant="subtitle2"
                                lineHeight="15.23px"
                                color="primary"
                                fontWeight="900"
                                sx={{ cursor: 'pointer' }}>
                                {row.Name}
                            </Typography>
                            <Typography variant="subtitle2" mt={1} lineHeight={1.1}>
                                {row.Description}
                            </Typography>
                            <Typography variant="subtitle2" lineHeight={1.1} fontWeight="bold">
                                Environment: {Environment.name.get()}
                            </Typography>
                        </Box>
                    </Grid>
                ))}
            </Box>
        </>
    );
}

// ** Custom Hooks
const useGetRemoteProcessGroupsHook = (environmentID, setRemoteProcessGroups) => {
    // GraphQL hook
    const getRemoteProcessGroups = useGetRemoteProcessGroups();

    const { enqueueSnackbar } = useSnackbar();

    // Get worker groups
    return async () => {
        const response = await getRemoteProcessGroups({ environmentID });

        if (response === null) {
            setRemoteProcessGroups([]);
        } else if (response.r || response.error) {
            enqueueSnackbar("Can't get remote process groups: " + (response.msg || response.r || response.error), { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            setRemoteProcessGroups(response);
        }
    };
};

const useGetRemoteWorkersProcessGroupsHook = (environmentID, setWorkersProcessGroups) => {
    // GraphQL hook
    const getRemoteWorkersProcessGroups = useGetRemoteWorkersProcessGroups();

    const { workerId } = useParams();

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    // Get environments on load
    return async () => {
        const response = await getRemoteWorkersProcessGroups({ environmentID, workerID: workerId });

        if (response.r || response.error) {
            closeSnackbar();
            enqueueSnackbar("Can't get process groups: " + (response.msg || response.r || response.error), { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            setWorkersProcessGroups(response);
        }
    };
};

const useAddRemoteWorkerEnvironmentHook = (availableRemoteProcessGroups, getRemoteWorkersProcessGroups) => {
    // GraphQL hook
    const addRemoteWorkerEnvironment = useAddRemoteWorkerEnvironment();

    const { enqueueSnackbar } = useSnackbar();

    // Global environment state with hookstate
    const Environment = useGlobalEnvironmentState();

    const { workerId } = useParams();

    // Add remote worker environment
    return async (data) => {
        // Get process group's ID by its name
        const remoteProcessGroupID = availableRemoteProcessGroups.find((a) => a.Name === data.remoteProcessGroupName).ID;

        const dataFinal = {
            environmentID: Environment.id.get(),
            remoteProcessGroupID,
            workerID: workerId,
        };

        const response = await addRemoteWorkerEnvironment(dataFinal);

        if (response.r || response.error) {
            enqueueSnackbar("Can't add remote environment: " + (response.msg || response.r || response.error), { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            enqueueSnackbar('Success', { variant: 'success' });
            getRemoteWorkersProcessGroups();
        }
    };
};

const useRemoveRemoteWorkerFromProcessGroupHook = (getRemoteWorkersProcessGroups) => {
    // GraphQL hook
    const removeRemoteWorkerFromProcessGroup = useRemoveRemoteWorkerFromProcessGroup();

    const { enqueueSnackbar } = useSnackbar();

    // Global environment state with hookstate
    const Environment = useGlobalEnvironmentState();

    const { workerId } = useParams();

    // Delete a remote environment
    return async (data) => {
        const environmentID = Environment.id.get();
        const remoteProcessGroupID = data.ID;
        const response = await removeRemoteWorkerFromProcessGroup({ environmentID, remoteProcessGroupID, workerID: workerId });

        if (response.r || response.error) {
            enqueueSnackbar("Can't delete remote environment: " + (response.msg || response.r || response.error), { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            enqueueSnackbar('Success', { variant: 'success' });
            getRemoteWorkersProcessGroups();
        }
    };
};
