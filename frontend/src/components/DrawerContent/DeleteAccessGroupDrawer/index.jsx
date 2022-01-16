import { Box, Typography, Button, Grid } from '@mui/material';
import { useEffect } from 'react';
import { useSnackbar } from 'notistack';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useDeleteAccessGroup } from '../../../graphql/updateDeleteAccessGroup';
import { useHistory } from 'react-router-dom';

export default function DeleteAccessGroupDrawer({ handleClose, accessGroup, environmentID }) {
    // GraphQL hook
    const deleteAccessGroup = useDeleteAccessGroup_(environmentID, accessGroup.AccessGroupID);

    const { closeSnackbar } = useSnackbar();

    // Clear snackbar on load
    useEffect(() => {
        closeSnackbar();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <Box position="relative">
            <Box sx={{ p: '4.125rem' }}>
                <Box position="absolute" top="26px" right="39px" display="flex" alignItems="center">
                    <Button variant="text" onClick={handleClose} style={{ paddingLeft: '16px', paddingRight: '16px' }} startIcon={<FontAwesomeIcon icon={faTimes} />}>
                        Close
                    </Button>
                </Box>

                <Typography component="h2" variant="h2">
                    Delete access group - {accessGroup.Name}
                </Typography>

                <Typography variant="body2" sx={{ mt: 2 }}>
                    You are about to delete an access group, would you like to continue?
                </Typography>

                <Grid mt={4} display="flex" alignItems="center">
                    <Button onClick={deleteAccessGroup} variant="contained" color="primary" sx={{ mr: 2 }}>
                        Yes
                    </Button>
                    <Button onClick={handleClose} variant="contained" color="primary">
                        No
                    </Button>
                </Grid>

                <Typography variant="body2" sx={{ mt: 4 }} color="rgba(248, 0, 0, 1)">
                    Warning: this action can't be undone.
                </Typography>
            </Box>
        </Box>
    );
}

// ------------- Custom Hook

const useDeleteAccessGroup_ = (environmentID, access_group_id) => {
    // React router
    const history = useHistory();

    // GraphQL hook
    const deleteAccessGroup = useDeleteAccessGroup();

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    // Delete an access group
    return async () => {
        const response = await deleteAccessGroup({ environmentID, access_group_id });

        if (response.r === 'error') {
            closeSnackbar();
            enqueueSnackbar("Can't delete permission: " + response.msg, {
                variant: 'error',
            });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            enqueueSnackbar('Success', { variant: 'success' });
            history.push('/access_groups');
        }
    };
};
