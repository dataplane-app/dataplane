import { Box, Typography, Button, TextField } from '@mui/material';
import { useSnackbar } from 'notistack';
import { useUpdateAccessGroup } from '../../graphql/updateAccessGroup';
import { useForm } from 'react-hook-form';

export default function Details({ environmentId, accessGroup, getAccessGroup }) {
    console.log('🚀 ~ file: Details.jsx ~ line 7 ~ Details ~ environmentId', environmentId);
    // React hook form
    const { register, handleSubmit } = useForm({
        defaultValues: {
            access_group_name: accessGroup.Name,
            description: accessGroup.Description,
        },
    });

    // Custom Hook
    const updateAccessGroup = useUpdateAccessGroup_(accessGroup, environmentId, getAccessGroup);

    return (
        <>
            <Typography component="h3" variant="h3" color="text.primary">
                Details
            </Typography>

            {accessGroup ? (
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

// -------------------- Custom Hook --------------------------

const useUpdateAccessGroup_ = (accessGroup, EnvironmentID, getAccessGroup) => {
    // GraphQL hook
    const updateAccessGroup = useUpdateAccessGroup();

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    // Update access group
    return async (data) => {
        const variables = {
            input: {
                AccessGroupID: accessGroup.AccessGroupID,
                EnvironmentID,
                Name: data.access_group_name,
                Description: data.description,
                Active: accessGroup.Active,
            },
        };

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
