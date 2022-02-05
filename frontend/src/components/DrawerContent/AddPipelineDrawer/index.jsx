import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Box, Button, Grid, TextField, Typography } from '@mui/material';
import { useSnackbar } from 'notistack';
import { useForm } from 'react-hook-form';
import { useAddPipeline } from '../../../graphql/addPipeline';

const AddPipelineDrawer = ({ handleClose, environmentID, getPipelines }) => {
    // React hook form
    const { register, handleSubmit } = useForm();

    // Custom GraphQL hook
    const addPipeline = useAddPipeline_(environmentID, handleClose, getPipelines);

    return (
        <form onSubmit={handleSubmit(addPipeline)}>
            <Box position="relative" style={{ maxWidth: '400px', margin: 'auto' }}>
                <Box sx={{ p: '4.125rem' }}>
                    <Box position="absolute" top="26px" right="39px" display="flex" alignItems="center">
                        <Button onClick={handleClose} style={{ paddingLeft: '16px', paddingRight: '16px' }} variant="text" startIcon={<FontAwesomeIcon icon={faTimes} />}>
                            Close
                        </Button>
                    </Box>

                    <Box mt={3}>
                        <Typography component="h2" variant="h2">
                            Create pipeline
                        </Typography>

                        <TextField
                            label="Title"
                            id="name"
                            size="small"
                            required
                            sx={{ mt: 2, mb: 2, fontSize: '.75rem', display: 'flex' }}
                            {...register('name', { required: true })}
                        />
                        <TextField label="Description" id="description" size="small" sx={{ mb: 2, fontSize: '.75rem', display: 'flex' }} {...register('description')} />

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

export default AddPipelineDrawer;

// ---------- Custom Hook

const useAddPipeline_ = (environmentID, handleClose, getPipelines) => {
    // GraphQL hook
    const addPipeline = useAddPipeline();

    const { enqueueSnackbar } = useSnackbar();

    // Create pipeline
    return async (data) => {
        const response = await addPipeline({ name: data.name, description: data.description, environmentID });

        if (response.r === 'error') {
            enqueueSnackbar("Can't create pipeline: " + response.msg, { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message + ': add pipeline', { variant: 'error' }));
        } else {
            enqueueSnackbar('Success', { variant: 'success' });
            handleClose();
            getPipelines();
        }
    };
};
