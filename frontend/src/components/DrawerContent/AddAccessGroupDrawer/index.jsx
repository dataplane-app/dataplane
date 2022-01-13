import { useState, useContext } from 'react';
import { Box, Typography, Button, Grid, TextField } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { useCreateAccessGroup } from '../../../graphql/createAccessGroup';
import { useSnackbar } from 'notistack';
import { useForm } from 'react-hook-form';
// import { EnvironmentContext } from '../../../App';   <=======  Add

const AddAccessGroupDrawer = ({ handleClose }) => {
    // Context
    // const [globalEnvironment] = useContext(EnvironmentContext); <=======  Add

    const [environment] = useState('0423dade-d213-4897-abf6-f6da9a668b50'); // <====== Remove

    // const createAccessGroup = useCreateAccessGroup_(globalEnvironment?.id);
    const createAccessGroup = useCreateAccessGroup_(environment, handleClose);

    // React hook form
    const { register, handleSubmit } = useForm();

    return (
        <form onSubmit={handleSubmit(createAccessGroup)}>
            <Box position="relative" style={{ maxWidth: '400px', margin: 'auto', marginTop: 0 }}>
                <Box sx={{ p: '4.125rem' }}>
                    <Box position="absolute" top="26px" right="39px" display="flex" alignItems="center">
                        <Button onClick={handleClose} style={{ paddingLeft: '16px', paddingRight: '16px' }} variant="text" startIcon={<FontAwesomeIcon icon={faTimes} />}>
                            Close
                        </Button>
                    </Box>

                    <Typography component="h2" variant="h2">
                        Add access group
                    </Typography>

                    <TextField
                        label="Access group name"
                        id="name"
                        size="small"
                        required
                        sx={{ mt: 2, mb: 2, fontSize: '.75rem', display: 'flex' }}
                        {...register('name', { required: true })}
                    />

                    <Grid mt={4} display="flex" alignItems="center">
                        <Button type="submit" variant="contained" color="primary" style={{ width: '100%' }}>
                            Save
                        </Button>
                    </Grid>
                </Box>
            </Box>
        </form>
    );
};

export default AddAccessGroupDrawer;

// ---------- Custom Hooks

const useCreateAccessGroup_ = (environmentID, handleClose) => {
    // GraphQL hook
    const createAccessGroup = useCreateAccessGroup();

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    // Create access group
    return async (data) => {
        const response = await createAccessGroup({ name: data.name, environmentID });

        if (response.r === 'error') {
            closeSnackbar();
            enqueueSnackbar("Can't create access group: " + response.msg, { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            enqueueSnackbar('Success', { variant: 'success' });
            handleClose();
        }
    };
};
