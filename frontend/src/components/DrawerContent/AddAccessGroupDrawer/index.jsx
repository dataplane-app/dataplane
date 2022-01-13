import { useEffect, useState } from 'react';
import { Box, Typography, Button, Grid, TextField } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { useCreateAccessGroup } from '../../../graphql/createAccessGroup';
import { useSnackbar } from 'notistack';

const AddAccessGroupDrawer = ({ handleClose }) => {
    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

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

                <TextField label="Access group name" id="name" size="small" required sx={{ mt: 2, mb: 2, fontSize: '.75rem', display: 'flex' }} />

                <Grid mt={4} display="flex" alignItems="center">
                    <Button type="submit" variant="contained" color="primary" style={{ width: '100%' }}>
                        Save
                    </Button>
                </Grid>
            </Box>
        </Box>
    );
};

export default AddAccessGroupDrawer;
