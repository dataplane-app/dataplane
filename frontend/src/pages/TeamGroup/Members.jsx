import { useState, useEffect } from 'react';
import { Box, Typography, Button, Grid, Autocomplete, TextField } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrashAlt } from '@fortawesome/free-regular-svg-icons';
import { useSnackbar } from 'notistack';
import { useParams } from 'react-router-dom';
import { useGetUsers } from '../../graphql/getUsers';
import { useUpdateUserToAccessGroup } from '../../graphql/updateUserToAccessGroup';

export default function Members({ environmentId }) {
    // User states
    const [selectedUser, setSelectedUser] = useState(null);
    console.log('🚀 ~ file: Members.jsx ~ line 12 ~ Members ~ selectedMember', selectedUser);
    const [users, setUsers] = useState([]);
    console.log('🚀 ~ file: Members.jsx ~ line 14 ~ Members ~ users', users);
    const [clear, setClear] = useState(1);

    // Custom GraphQL hooks
    const getUsers = useGetUsers_(setUsers);
    const updateUserToAccessGroup = useUpdateUserToAccessGroup_(environmentId, selectedUser?.user_id);

    // Get members on load
    useEffect(() => {
        getUsers();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <>
            <Typography component="h3" variant="h3" color="text.primary">
                Members (10)
            </Typography>

            <Grid mt={2} display="flex" alignItems="center">
                <Autocomplete
                    disablePortal
                    // id="members_autocomplete"
                    key={clear} //Changing this value on submit clears the input field
                    onChange={(event, newValue) => {
                        setSelectedUser(newValue);
                    }}
                    sx={{ minWidth: '280px' }}
                    // Filter out user's permissions from available permissions
                    // options={filterPermissionsDropdown(availablePermissions, permissions, Environment.id.get())}
                    options={users}
                    getOptionLabel={(option) => option.first_name + ' ' + option.last_name}
                    renderInput={(params) => <TextField {...params} label="Find members" id="members" size="small" sx={{ fontSize: '.75rem', display: 'flex' }} />}
                />
                <Button
                    onClick={() => {
                        updateUserToAccessGroup();
                        setClear(clear * -1); // Clears autocomplete input field
                    }}
                    variant="contained"
                    color="primary"
                    height="100%"
                    sx={{ ml: 1 }}>
                    Add
                </Button>
            </Grid>

            <Box mt="1.31rem">
                <Grid display="flex" alignItems="center" mt={1.5} mb={1.5}>
                    <Box component={FontAwesomeIcon} sx={{ fontSize: '17px', mr: '7px', color: 'rgba(248, 0, 0, 1)' }} icon={faTrashAlt} />
                    <Typography variant="subtitle2" lineHeight="15.23px" color="primary" fontWeight="900">
                        Saul Frank
                    </Typography>
                </Grid>
            </Box>
        </>
    );
}

// ----------- Custom Hooks --------------------------------
const useGetUsers_ = (setUsers) => {
    // GraphQL hook
    const getUsers = useGetUsers();

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    // Get members
    return async () => {
        const response = await getUsers();

        if (response === null) {
            setUsers([]);
        } else if (response.r === 'error') {
            closeSnackbar();
            enqueueSnackbar("Can't get members: " + response.msg, { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message + ': get members', { variant: 'error' }));
        } else {
            setUsers(response);
        }
    };
};

const useUpdateUserToAccessGroup_ = (environmentID, user_id) => {
    // GraphQL hook
    const updateUserToAccessGroup = useUpdateUserToAccessGroup();

    // URI parameter
    const { accessId } = useParams();

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    // Get members
    return async () => {
        const response = await updateUserToAccessGroup({ environmentID, user_id, access_group_id: accessId });

        if (response.r === 'error') {
            closeSnackbar();
            enqueueSnackbar("Can't get members: " + response.msg, { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message + ': update member to access group', { variant: 'error' }));
        } else {
            enqueueSnackbar('Success', { variant: 'success' });
        }
    };
};
