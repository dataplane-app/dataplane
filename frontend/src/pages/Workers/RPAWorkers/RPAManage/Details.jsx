import { Box, Typography, Button, TextField } from '@mui/material';
import { useSnackbar } from 'notistack';
// import { useUpdateAccessGroup } from '../../graphql/updateAccessGroup';
import { useForm } from 'react-hook-form';

export default function Details({ environmentId, accessGroup, getAccessGroup }) {
    // React hook form
    const { register, handleSubmit } = useForm({
        // defaultValues: {
        //     name: 'accessGroup.Name',
        //     description: 'accessGroup.Description',
        // },
    });

    // Custom Hook
    // const updateAccessGroup = useUpdateAccessGroup_(accessGroup, environmentId, getAccessGroup);

    return (
        <>
            {true ? (
                <form onSubmit={() => {}}>
                    <Box mt={2} display="grid" flexDirection="row">
                        <TextField label="Name" id="name" size="small" sx={{ mb: '.45rem' }} {...register('name', { required: true })} />
                        <TextField label="Description" id="description" size="small" sx={{ mb: '.45rem' }} {...register('description')} />

                        <Button type="submit" variant="contained" color="primary" sx={{ width: '100%', mt: '1.375rem' }}>
                            Save
                        </Button>
                    </Box>
                </form>
            ) : null}
        </>
    );
}

// -------------------- Custom Hook --------------------------
