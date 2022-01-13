import { useEffect, useState } from 'react';
import { Box, Typography, Button, Grid, TextField } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { useCreateAccessGroup } from '../../../graphql/createAccessGroup';
import { useSnackbar } from 'notistack';

const AddAccessGroupDrawer = ({ handleClose }) => {
    const [environment] = useState('0423dade-d213-4897-abf6-f6da9a668b50');
    const [name, setName] = useState('');
    // const getUserEnvironments = useCreateAccessGroupData(globalEnvironment?.id);
    const getUserEnvironments = useCreateAccessGroupData(environment, name);

    return (
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
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    label="Access group name"
                    id="name"
                    size="small"
                    required
                    sx={{ mt: 2, mb: 2, fontSize: '.75rem', display: 'flex' }}
                />

                <Grid mt={4} display="flex" alignItems="center">
                    <Button onClick={getUserEnvironments} variant="contained" color="primary" style={{ width: '100%' }}>
                        Save
                    </Button>
                </Grid>
            </Box>
        </Box>
    );
};

export default AddAccessGroupDrawer;

// ---------- Custom Hooks

const useCreateAccessGroupData = (environment_id, name) => {
    // GraphQL hook
    const createAccessGroup = useCreateAccessGroup();

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    // Get environments on load
    return async () => {
        const response = await createAccessGroup({ name, environment_id });

        if (response.r === 'error') {
            closeSnackbar();
            enqueueSnackbar("Can't get me data: " + response.msg, { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            // setUserEnvironments(response);
        }
    };
};
