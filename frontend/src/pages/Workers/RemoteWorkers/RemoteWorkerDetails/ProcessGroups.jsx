import { useRef, useState } from 'react';
import { Typography, Button, Grid, Autocomplete, TextField } from '@mui/material';
import { useSnackbar } from 'notistack';
import { useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useGlobalEnvironmentsState } from '../../../../components/EnviromentDropdown';
import { useAddRemoteWorkerToProcessGroup } from '../../../../graphql/addRemoteWorkerToProcessGroup';

export default function ProcessGroups({ allRemoteProcessGroups, workerEnvironment, setWorkerEnvironment, getRemoteWorkersProcessGroups }) {
    // Local State
    const [selectedProcessGroup, setSelectedProcessGroup] = useState(null);

    // Environments global state
    const globalEnvironments = useGlobalEnvironmentsState();

    const { register, handleSubmit } = useForm();

    // Custom hook
    const addRemoteWorkerToProcessGroup = useAddRemoteWorkerToProcessGroupHook(allRemoteProcessGroups, getRemoteWorkersProcessGroups, workerEnvironment);

    const autocomplete = useRef();

    return (
        <>
            <Typography component="h3" variant="h3" color="text.primary">
                Process groups
            </Typography>
            <Typography variant="subtitle1">Attach a process group and related environment to worker.</Typography>

            <Grid mt={2} display="flex" alignItems="center">
                <form style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }} onSubmit={handleSubmit(addRemoteWorkerToProcessGroup)}>
                    {workerEnvironment ? (
                        <Autocomplete
                            disablePortal
                            id="available_environments_autocomplete"
                            sx={{ minWidth: '280px' }}
                            options={globalEnvironments.get()}
                            disableClearable
                            getOptionLabel={(option) => option.name}
                            isOptionEqualToValue={(option, value) => option.id === value.id}
                            value={workerEnvironment}
                            onClose={() => autocomplete.current.click()}
                            onChange={(_, value) => setWorkerEnvironment(value)}
                            onOpen={() => setSelectedProcessGroup(null)}
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
                        openOnFocus={true}
                        ref={autocomplete}
                        // Filter out remote process groups per environment
                        options={allRemoteProcessGroups.filter((group) => group.environments.includes(workerEnvironment.name))}
                        getOptionLabel={(option) => option?.name}
                        value={selectedProcessGroup}
                        onChange={(_, value) => setSelectedProcessGroup(value)}
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
                    <Button onClick={() => setSelectedProcessGroup(null)} variant="contained" type="submit" color="primary" height="100%" sx={{ ml: 1 }}>
                        Add
                    </Button>
                </form>
            </Grid>
        </>
    );
}

// ** Custom Hooks
const useAddRemoteWorkerToProcessGroupHook = (availableRemoteProcessGroups, getRemoteWorkersProcessGroups, workerEnvironment) => {
    // GraphQL hook
    const addRemoteWorkerToProcessGroup = useAddRemoteWorkerToProcessGroup();

    const { enqueueSnackbar } = useSnackbar();

    const { workerId } = useParams();

    // Add remote worker environment
    return async (data) => {
        if (data?.remoteProcessGroupName === '') return; // If add button clicked while empty

        // Get process group's ID by its name
        const remoteProcessGroupID = availableRemoteProcessGroups.find((a) => a.name === data.remoteProcessGroupName).remoteProcessGroupID;

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
