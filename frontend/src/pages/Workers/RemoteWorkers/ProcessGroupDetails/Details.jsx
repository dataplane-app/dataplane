import { Box, Button, TextField } from '@mui/material';
import { useSnackbar } from 'notistack';
import { useForm } from 'react-hook-form';
import { useParams } from 'react-router-dom';
import { useUpdateRemoteProcessGroup } from '../../../../graphql/remoteworkers/updateRemoteProcessGroup.js';

export default function Details({ environmentId, remoteProcessGroup, getSingleRemoteProcessGroup }) {
    // React hook form
    const { register, handleSubmit } = useForm({
        defaultValues: {
            name: remoteProcessGroup.name,
            description: remoteProcessGroup.description,
        },
    });

    // Custom Hook
    const updateRemoteProcessGroup = useUpdateRemoteProcessGroupHook(environmentId, remoteProcessGroup, getSingleRemoteProcessGroup);

    return (
        <form onSubmit={handleSubmit(updateRemoteProcessGroup)}>
            <Box mt={2} display="grid" flexDirection="row">
                <TextField label="Name" id="name" size="small" sx={{ mb: '.45rem' }} {...register('name', { required: true })} />
                <TextField label="Description" id="description" size="small" sx={{ mb: '.45rem' }} {...register('description')} />

                <Button type="submit" variant="contained" color="primary" sx={{ width: '100%', mt: '1.375rem' }}>
                    Save
                </Button>
            </Box>
        </form>
    );
}

// -------------------- Custom Hook --------------------------
export const useUpdateRemoteProcessGroupHook = (environmentID, remoteProcessGroup, getSingleRemoteProcessGroup) => {
    // GraphQL hook
    const updateRemoteProcessGroup = useUpdateRemoteProcessGroup();

    const { enqueueSnackbar } = useSnackbar();

    const { groupId } = useParams();

    // Update pipeline
    return async (data) => {
        data.remoteProcessGroupID = groupId;
        data.environmentID = environmentID;
        data.active = remoteProcessGroup.active;
        data.packages = remoteProcessGroup.packages;
        data.language = remoteProcessGroup.language;

        const response = await updateRemoteProcessGroup(data);

        if (response.r || response.error) {
            enqueueSnackbar("Can't update remote process group: " + (response.msg || response.r || response.error), { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            enqueueSnackbar('Success', { variant: 'success' });
            getSingleRemoteProcessGroup();
        }
    };
};
