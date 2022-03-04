import { useState, useEffect } from 'react';
import { Box, Typography, Button, Grid, Autocomplete, TextField } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrashAlt } from '@fortawesome/free-regular-svg-icons';
import { useHistory } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { useParams } from 'react-router-dom';
import { useGetUsers } from '../../graphql/getUsers';
import { useUpdateUserToAccessGroup } from '../../graphql/updateUserToAccessGroup';
import { useGetAccessGroupUsers } from '../../graphql/getAccessGroupUsers';
import { useRemoveUserFromAccessGroup } from '../../graphql/removeUserFromAccessGroup';

export default function Members({ environmentId }) {
    // User states
    const [selectedUser, setSelectedUser] = useState(null);
    const [users, setUsers] = useState([]);
    const [accessGroupUsers, setAccessGroupUsers] = useState([]);

    // Control state
    const [clear, setClear] = useState(1);

    // React router
    let history = useHistory();

    // Custom GraphQL hooks
    const getUsers = useGetUsers_(setUsers);
    const getAccessGroupUsers = useGetAccessGroupUsers_(environmentId, setAccessGroupUsers);
    const updateUserToAccessGroup = useUpdateUserToAccessGroup_(environmentId, selectedUser, getAccessGroupUsers);
    const removeUserFromAccessGroup = useRemoveUserFromAccessGroup_(environmentId, getAccessGroupUsers);

    // Get members on load
    useEffect(() => {
        getUsers();
        getAccessGroupUsers();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <>
            <Typography component="h3" variant="h3" color="text.primary">
                Members ({accessGroupUsers.length})
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
                    // Filter out users from access group members
                    options={users.filter((row) => !accessGroupUsers.map((a) => a.user_id).includes(row.user_id))}
                    getOptionLabel={(option) => option.first_name + ' ' + option.last_name}
                    renderInput={(params) => <TextField {...params} label="Find members" id="members" size="small" sx={{ fontSize: '.75rem', display: 'flex' }} />}
                />
                <Button
                    onClick={() => {
                        updateUserToAccessGroup();
                        setClear(clear * -1); // Clears autocomplete input field
                        setSelectedUser(null);
                    }}
                    variant="contained"
                    color="primary"
                    height="100%"
                    sx={{ ml: 1 }}>
                    Add
                </Button>
            </Grid>

            <Box mt="1.31rem">
                {accessGroupUsers.map((row) => (
                    <Grid display="flex" alignItems="center" key={row.user_id} mt={1.5} mb={1.5}>
                        <Box
                            onClick={() => {
                                removeUserFromAccessGroup(row.user_id);
                            }}
                            component={FontAwesomeIcon}
                            sx={{ fontSize: '17px', mr: '7px', color: 'rgba(248, 0, 0, 1)', cursor: 'pointer' }}
                            icon={faTrashAlt}
                        />
                        <Typography
                            onClick={() => history.push(`/teams/${row.user_id}`)}
                            variant="subtitle2"
                            lineHeight="15.23px"
                            color="primary"
                            fontWeight="900"
                            sx={{ cursor: 'pointer' }}>
                            {row.first_name} {row.last_name}
                        </Typography>
                    </Grid>
                ))}
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
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            setUsers(response);
        }
    };
};

const useGetAccessGroupUsers_ = (environmentID, setAccessGroupUsers) => {
    // GraphQL hook
    const getAccessGroupUsers = useGetAccessGroupUsers();

    // URI parameter
    const { accessId } = useParams();

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    // Get access group members
    return async () => {
        const response = await getAccessGroupUsers({ environmentID, access_group_id: accessId });

        if (response === null) {
            setAccessGroupUsers([]);
        } else if (response.r === 'error') {
            closeSnackbar();
            enqueueSnackbar("Can't get members: " + response.msg, { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            setAccessGroupUsers(response);
        }
    };
};

const useUpdateUserToAccessGroup_ = (environmentID, selectedUser, getAccessGroupUsers) => {
    // GraphQL hook
    const updateUserToAccessGroup = useUpdateUserToAccessGroup();

    // URI parameter
    const { accessId } = useParams();

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    if (selectedUser === null) return; // If add button is clicked without a selection

    // Get members
    return async () => {
        const response = await updateUserToAccessGroup({ environmentID, user_id: selectedUser.user_id, access_group_id: accessId });

        if (response.r === 'error') {
            closeSnackbar();
            enqueueSnackbar("Can't get members: " + response.msg, { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            enqueueSnackbar('Success', { variant: 'success' });
            getAccessGroupUsers();
        }
    };
};

const useRemoveUserFromAccessGroup_ = (environmentID, getAccessGroupUsers) => {
    // GraphQL hook
    const removeUserFromAccessGroup = useRemoveUserFromAccessGroup();

    // URI parameter
    const { accessId } = useParams();

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    // Remove member
    return async (user_id) => {
        const response = await removeUserFromAccessGroup({ environmentID, user_id, access_group_id: accessId });

        if (response.r === 'error') {
            closeSnackbar();
            enqueueSnackbar("Can't remove member: " + response.msg, { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            enqueueSnackbar('Success', { variant: 'success' });
            getAccessGroupUsers();
        }
    };
};
