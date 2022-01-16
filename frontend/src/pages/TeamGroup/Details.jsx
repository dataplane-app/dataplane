import { Box, Typography, Button, TextField } from '@mui/material';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { useGetAccessGroup } from '../../graphql/getAccessGroup';
import { useUpdateAccessGroup } from '../../graphql/updateAccessGroup';
import { useForm } from 'react-hook-form';

export default function Details({ userId, environmentId, setName }) {
    // Access group state
    const [dataLoaded, setIsDataLoaded] = useState(false);
    const [accessGroup, setAccessGroup] = useState();

    // URI parameter
    const { accessId } = useParams();

    // React hook form
    const { register, handleSubmit, reset } = useForm();

    // Custom Hooks
    const getAccessGroup = useGetAccessGroup_(environmentId, userId, accessId, reset, setIsDataLoaded, setName, setAccessGroup);
    const updateAccessGroup = useUpdateAccessGroup_(accessId, environmentId, accessGroup?.Active, getAccessGroup);

    // Get Access Group data on load
    useEffect(() => {
        getAccessGroup();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <>
            <Typography component="h3" variant="h3" color="text.primary">
                Details
            </Typography>

            {dataLoaded ? (
                <Box mt={2} display="grid" flexDirection="row">
                    <form onSubmit={handleSubmit(updateAccessGroup)}>
                        <TextField
                            label="Access group name"
                            id="access_group_name"
                            size="small"
                            required
                            sx={{ mb: '.45rem' }}
                            {...register('access_group_name', { required: true })}
                        />
                        <TextField label="Description" id="description" size="small" sx={{ mb: '.45rem' }} {...register('description')} />

                        <Button type="submit" variant="contained" color="primary" sx={{ width: '100%', mt: '1.375rem' }}>
                            Save
                        </Button>
                    </form>
                </Box>
            ) : null}
        </>
    );
}

// -------------------- Custom Hooks --------------------------

const useGetAccessGroup_ = (environmentID, userID, access_group_id, reset, setIsAccessGroupDataLoaded, setName, setAccessGroup) => {
    // GraphQL hook
    const getAccessGroup = useGetAccessGroup();

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    // Get access group data
    return async () => {
        const response = await getAccessGroup({ environmentID, userID, access_group_id });
        setIsAccessGroupDataLoaded(true);

        if (response.r === 'error') {
            closeSnackbar();
            enqueueSnackbar("Can't get access group data: " + response.msg, {
                variant: 'error',
            });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            setName(response.Name);
            setAccessGroup(response);

            // Reset form default values to incoming access group data
            reset({
                access_group_name: response.Name,
                description: response.Description,
            });
        }
    };
};

const useUpdateAccessGroup_ = (AccessGroupID, EnvironmentID, Active, getAccessGroup) => {
    // GraphQL hook
    const updateAccessGroup = useUpdateAccessGroup();

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    // Update access group
    return async (data) => {
        const variables = { input: { AccessGroupID, EnvironmentID, Name: data.access_group_name, Description: data.description, Active } };

        const response = await updateAccessGroup(variables);

        if (response.r === 'error') {
            closeSnackbar();
            enqueueSnackbar("Can't update access group: " + response.msg, {
                variant: 'error',
            });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            enqueueSnackbar(`Success`, { variant: 'success' });
            getAccessGroup();
        }
    };
};
