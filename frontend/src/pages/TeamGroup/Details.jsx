import { Box, Typography, Button, TextField } from '@mui/material';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { useGetAccessGroup } from '../../graphql/getAccessGroup';
import { useForm } from 'react-hook-form';

export default function Details({ userId, environmentId }) {
    // Access group data loading state
    const [dataLoaded, setIsDataLoaded] = useState(false);

    // URI parameter
    const { accessId } = useParams();

    // React hook form
    const { register, reset } = useForm();

    // Custom Hook
    const getAccessGroup = useGetAccessGroup_(environmentId, userId, accessId, reset, setIsDataLoaded);

    // Get Access Group information on load
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
                    <TextField
                        label="Access group name"
                        id="access_group_name"
                        size="small"
                        required
                        sx={{ mb: '.45rem' }}
                        {...register('access_group_name', { required: true })}
                    />
                    <TextField label="Description" id="description" size="small" sx={{ mb: '.45rem' }} {...register('description')} />

                    <Button variant="contained" color="primary" sx={{ width: '100%', mt: '1.375rem' }}>
                        Save
                    </Button>
                </Box>
            ) : null}
        </>
    );
}

// -------------------- Custom Hooks --------------------------

const useGetAccessGroup_ = (environmentID, userID, access_group_id, reset, setIsAccessGroupDataLoaded) => {
    // GraphQL hook
    const getAccessGroup = useGetAccessGroup();

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    // Get access group data
    return async () => {
        const response = await getAccessGroup({ environmentID, userID, access_group_id });
        setIsAccessGroupDataLoaded(true);

        if (response.r === 'error') {
            closeSnackbar();
            enqueueSnackbar("Can't delete permission: " + response.msg, {
                variant: 'error',
            });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            // Reset form default values to incoming access group data
            reset({
                access_group_name: response.Name,
            });
        }
    };
};
