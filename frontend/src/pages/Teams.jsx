import { useState, useMemo, useEffect } from 'react';
import { Box, Grid, Typography, Button, Drawer } from '@mui/material';
import Search from '../components/Search';
import { useTable, useGlobalFilter } from 'react-table';
import { useHistory } from 'react-router-dom';
import CustomChip from '../components/CustomChip';
import { useGetUsers } from '../graphql/getUsers';
import { useSnackbar } from 'notistack';
import AddUserDrawer from '../components/DrawerContent/AddUserDrawer';
import { useGlobalAuthState } from '../Auth/UserAuth';

const Teams = () => {
    let history = useHistory();
    const { enqueueSnackbar } = useSnackbar();

    // Users state
    const [data, setData] = useState([]);

    // Sidebar states
    const [isOpenDeleteUser, setIsOpenDeleteUser] = useState(false);

    // Custom GraphQL hooks
    const getUsers = useGetUsersHook(setData);

    const authState = useGlobalAuthState();
    const jwt = authState.authToken.get();

    // Get users on load
    useEffect(() => {
        getUsers();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // // Get users
    // const retrieveUsers = async () => {
    //     let users = await getUsers();
    //     !users.errors ? setData(users) : enqueueSnackbar('Unable to retrieve users', { variant: 'error' });
    // };

    const columns = useMemo(
        () => [
            {
                Header: 'Member',
                accessor: (row) => [row.first_name + ' ' + row.last_name, row.job_title],
                Cell: (row) => <CustomMember row={row} onClick={() => history.push(`/teams/${row.row.original.user_id}`)} />,
            },
            {
                Header: 'Email',
                accessor: 'email',
                Cell: (row) => <CustomEmail row={row} />,
            },
            {
                Header: 'Status',
                accessor: 'status',
                Cell: (row) => (row.value === 'active' ? <CustomChip label="Active" customColor="green" /> : <CustomChip label="Inactive" customColor="red" />),
            },
        ],
        [history, jwt]
    );

    // Use the state and functions returned from useTable to build your UI
    const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow, state, setGlobalFilter } = useTable(
        {
            columns,
            data,
        },
        useGlobalFilter
    );

    const { globalFilter } = state;

    useEffect(() => {
        console.log(globalFilter);
    }, [globalFilter]);

    return (
        <Box className="page">
            <Typography component="h2" variant="h2" color="text.primary">
                Team
            </Typography>

            <Box mt={4} sx={{ width: '640px' }}>
                <Grid container mt={4} direction="row" alignItems="center" justifyContent="flex-start">
                    <Grid item display="flex" alignItems="center" sx={{ alignSelf: 'center' }}>
                        <CustomChip amount={rows.length} label="Members" margin={2} customColor="orange" />
                    </Grid>

                    <Grid item display="flex" alignItems="center" sx={{ alignSelf: 'center' }}>
                        <Search placeholder="Find members" onChange={setGlobalFilter} />
                    </Grid>

                    <Grid display="flex" sx={{ marginLeft: 'auto', marginRight: '2px' }}>
                        <Button onClick={() => setIsOpenDeleteUser(true)} variant="contained" color="primary" width="3.81rem">
                            Add
                        </Button>
                    </Grid>
                </Grid>
            </Box>

            <Box component="table" mt={4} sx={{ width: '640px' }} {...getTableProps()}>
                <thead>
                    {headerGroups.map((headerGroup) => (
                        <Box
                            component="tr"
                            display="grid"
                            sx={{ '*:first-of-type': { ml: '22px' }, '*:last-child': { textAlign: 'center' } }}
                            gridTemplateColumns="repeat(3, 1fr)"
                            justifyContent="flex-start"
                            {...headerGroup.getHeaderGroupProps()}>
                            {headerGroup.headers.map((column) => (
                                <Box component="td" color="text.primary" fontWeight="600" fontSize="15px" textAlign="left" {...column.getHeaderProps()}>
                                    {column.render('Header')}
                                </Box>
                            ))}
                        </Box>
                    ))}
                </thead>
                <Box component="tbody" display="flex" sx={{ flexDirection: 'column' }} {...getTableBodyProps()}>
                    {rows.map((row, i) => {
                        prepareRow(row);
                        return (
                            <Box
                                component="tr"
                                {...row.getRowProps()}
                                display="grid"
                                gridTemplateColumns="repeat(3, 1fr)"
                                alignItems="start"
                                borderRadius="5px"
                                backgroundColor="background.secondary"
                                mt={2}
                                sx={{
                                    border: 1,
                                    borderColor: 'divider',
                                    padding: '15px 0',
                                    cursor: 'pointer',
                                    '&:hover': { background: 'background.hoverSecondary' },
                                    'td:last-child': { textAlign: 'center' },
                                }}>
                                {row.cells.map((cell) => {
                                    return (
                                        <Box component="td" {...cell.getCellProps()} textAlign="left">
                                            {cell.render('Cell')}
                                        </Box>
                                    );
                                })}
                            </Box>
                        );
                    })}
                </Box>
            </Box>

            <Drawer anchor="right" open={isOpenDeleteUser} onClose={() => setIsOpenDeleteUser(!isOpenDeleteUser)}>
                <AddUserDrawer
                    user="Saul Frank"
                    handleClose={() => {
                        setIsOpenDeleteUser(false);
                        getUsers();
                    }}
                />
            </Drawer>
        </Box>
    );
};

const CustomMember = ({ row, onClick }) => {
    const [name, job_title] = row.value;

    return (
        <Grid container direction="column" mx="22px" alignItems="left" justifyContent="flex-start" onClick={onClick}>
            <Typography component="h4" variant="h3" sx={{ color: 'cyan.main' }}>
                {name}
            </Typography>
            <Typography component="h5" variant="subtitle1">
                {job_title}
            </Typography>
        </Grid>
    );
};

const CustomEmail = ({ row }) => {
    return (
        <Grid container direction="column" alignItems="flex-start">
            <Typography component="h4" variant="subtitle1" color="text.primary" mb={0.7}>
                {row.value}
            </Typography>
        </Grid>
    );
};

export default Teams;

// ----------- Custom Hooks --------------------------------
const useGetUsersHook = (setUsers) => {
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
