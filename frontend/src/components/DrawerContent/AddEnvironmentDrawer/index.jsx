import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Box, Button, Grid, TextField, Typography } from '@mui/material';
import { useSnackbar } from 'notistack';
import { useForm } from 'react-hook-form';
import { useAddEnvironment } from '../../../graphql/addEnvironment';

const AddEnvironmentDrawer = ({ handleClose }) => {
    // Hooks
    const addEnvironment = useAddEnvironment();

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();
    const { register, handleSubmit } = useForm();

    async function onSubmit(data) {
        const allData = {
            input: {
                name: data.name,
            },
        };

        let response = await addEnvironment(allData);
        if (response && response.name) {
            handleClose();
            closeSnackbar();
            enqueueSnackbar(`Environment added: ${data.name}`, { variant: 'success' });
        } else {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        }
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <Box position="relative" style={{ maxWidth: '400px', margin: 'auto' }}>
                <Box sx={{ p: '4.125rem' }}>
                    <Box position="absolute" top="26px" right="39px" display="flex" alignItems="center">
                        <Button onClick={handleClose} style={{ paddingLeft: '16px', paddingRight: '16px' }} variant="text" startIcon={<FontAwesomeIcon icon={faTimes} />}>
                            Close
                        </Button>
                    </Box>

                    <Box mt={3}>
                        <Typography component="h2" variant="h2">
                            Add environment
                        </Typography>

                        <TextField
                            label="Name"
                            id="name"
                            size="small"
                            required
                            sx={{ mt: 2, mb: 2, fontSize: '.75rem', display: 'flex' }}
                            {...register('name', { required: true })}
                        />
                        <TextField
                            label="Description"
                            id="description"
                            size="small"
                            required
                            sx={{ mb: 2, fontSize: '.75rem', display: 'flex' }}
                            {...register('description', { required: true })}
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

export default AddEnvironmentDrawer;
