import { useEffect, useState } from 'react';
import { Typography, Button, Grid, Autocomplete, TextField } from '@mui/material';
import { useSnackbar } from 'notistack';
import { useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAddRemoteWorkerToProcessGroup } from '../../../../graphql/remoteworkers/addRemoteWorkerToProcessGroup.js';
import { useGetUserEnvironments } from '../../../../graphql/environments/getUserEnvironments.js';
import { useGlobalMeState } from '../../../../components/Navbar';
import { useGlobalEnvironmentState } from '../../../../components/EnviromentDropdown';

export default function ProcessGroups({ allRemoteProcessGroups, workerEnvironment, setWorkerEnvironment, getRemoteWorkersProcessGroups, workersProcessGroups }) {
    // Local State
    const [userEnvironments, setUserEnvironments] = useState(null);
    const [key, setKey] = useState(1);

    const { register, handleSubmit } = useForm();

    // Custom hook
    const addRemoteWorkerToProcessGroup = useAddRemoteWorkerToProcessGroupHook(allRemoteProcessGroups, getRemoteWorkersProcessGroups, workerEnvironment, workersProcessGroups);
    const getUserEnvironments = useGetUserEnvironmentsHook(setUserEnvironments);

    useEffect(() => {
        getUserEnvironments();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <>
            <Typography component="h3" variant="h3" color="text.primary">
                Process groups
            </Typography>
            <Typography variant="subtitle1">Attach a process group and related environment to worker.</Typography>

            <Grid mt={2} display="flex" alignItems="center">
                <form style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }} onSubmit={handleSubmit(addRemoteWorkerToProcessGroup)}>
                    {workerEnvironment && userEnvironments ? (
                        <Autocomplete
                            disablePortal
                            id="available_environments_autocomplete"
                            sx={{ minWidth: '280px' }}
                            options={userEnvironments}
                            disableClearable
                            getOptionLabel={(option) => option.name}
                            isOptionEqualToValue={(option, value) => option.id === value.id}
                            value={workerEnvironment}
                            onChange={(_, value) => {
                                setKey((v) => v * -1);
                                return setWorkerEnvironment(value);
                            }}
                            renderInput={(params) => (
                                <TextField
                                    {...params} //
                                    label="Environments"
                                    id="environment"
                                    size="small"
                                    sx={{ fontSize: '.75rem', display: 'flex' }}
                                />
                            )}
                        />
                    ) : null}

                    <Autocomplete
                        disablePortal
                        id="autocomplete_process_groups"
                        sx={{ minWidth: '280px' }}
                        key={key}
                        openOnFocus={true}
                        // Filter out remote process groups per environment
                        options={allRemoteProcessGroups.filter((group) => group.environments.includes(workerEnvironment.name))}
                        getOptionLabel={(option) => option?.name}
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
                    <Button variant="contained" type="submit" color="primary" height="100%" sx={{ ml: 1 }}>
                        Add
                    </Button>
                </form>
            </Grid>
        </>
    );
}

// ** Custom Hooks
const useAddRemoteWorkerToProcessGroupHook = (availableRemoteProcessGroups, getRemoteWorkersProcessGroups, workerEnvironment, workersProcessGroups) => {
    // GraphQL hook
    const addRemoteWorkerToProcessGroup = useAddRemoteWorkerToProcessGroup();

    const { enqueueSnackbar } = useSnackbar();

    const { workerId } = useParams();

    // Add remote worker environment
    return async (data) => {
        if (data?.remoteProcessGroupName === '') return; // If add button clicked while empty

        // Get process group's ID by its name
        const remoteProcessGroupID = availableRemoteProcessGroups.find((a) => a.name === data.remoteProcessGroupName).remoteProcessGroupID;

        // If the process group is already attached return error
        if (workersProcessGroups.find((a) => a.remoteProcessGroupID === remoteProcessGroupID && a.environmentID === workerEnvironment.id)) {
            return enqueueSnackbar('Process group is already attached', { variant: 'error' });
        }

        const dataFinal = {
            environmentID: workerEnvironment.id,
            remoteProcessGroupID,
            workerID: workerId,
        };

        const response = await addRemoteWorkerToProcessGroup(dataFinal);

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

const useGetUserEnvironmentsHook = (setUserEnvironments) => {
    // GraphQL hook
    const getUserEnvironments = useGetUserEnvironments();

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    const Environment = useGlobalEnvironmentState();
    const MeData = useGlobalMeState();

    const user_id = MeData.user_id.get();
    const environment_id = Environment.id.get();

    // Get user environments
    return async () => {
        const response = await getUserEnvironments({ user_id, environment_id });

        if (response.r || response.error) {
            closeSnackbar();
            enqueueSnackbar("Can't get user environments: " + (response.msg || response.r || response.error), { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            setUserEnvironments(response);
        }
    };
};
