import { useState } from 'react';
import { Box, Grid, Typography, IconButton, Chip, Button, Drawer } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsisV } from '@fortawesome/free-solid-svg-icons';
import { useMemo } from 'react';
import Search from '../components/Search';
import { useTable, useGlobalFilter } from 'react-table';
import { useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import CustomChip from '../components/CustomChip';
import { useGetUsers } from '../graphql/getUsers';
import { useSnackbar } from 'notistack';
import AddAccessGroupDrawer from '../components/DrawerContent/AddAccessGroupDrawer';

const drawerWidth = 507;
const drawerStyles = {
    width: drawerWidth,
    flexShrink: 0,
    zIndex: 9998,
    [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
};

const AccessGroups = () => {
    let history = useHistory();
    const { enqueueSnackbar } = useSnackbar();

    // Users state
    const [data, setData] = useState([
        { access_group_id: 1, name: 'Data engineering team', description: 'To build data pipelines', active: true, environment_id: '10' },
        { access_group_id: 2, name: 'BAU run team', description: 'To perform the daily run of data pipelines', active: true, environment_id: '10' },
    ]);

    // Sidebar states
    const [isOpenAddAccessGroup, setIsOpenAddAccessGroup] = useState(false);

    // Get users on load                      <==
    // const getUsers = useGetUsers();
    // useEffect(() => {
    //     retrieveUsers();
    // }, []);

    // Get users                              <==
    // const retrieveUsers = async () => {
    //     let users = await getUsers();
    //     !users.errors ? setData(users) : enqueueSnackbar('Unable to retrieve users', { variant: 'error' });
    // };

    const columns = useMemo(
        () => [
            {
                Header: 'Access group',
                accessor: (row) => [row.name, row.description],
                Cell: (row) => <CustomAccessGroup row={row} onClick={() => history.push(`/teams/${row.row.original.user_id}`)} />,
            },
            {
                Header: 'Status',
                accessor: 'active',
                Cell: (row) => (row.value === true ? <CustomChip label="Active" customColor="green" /> : <CustomChip label="Inactive" customColor="red" />),
            },
        ],
        []
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
                Access Groups
            </Typography>

            <Box mt={4} sx={{ width: '640px' }}>
                <Grid container mt={4} direction="row" alignItems="center" justifyContent="flex-start">
                    <Grid item display="flex" alignItems="center" sx={{ alignSelf: 'center' }}>
                        <CustomChip amount={rows.length} label="Access groups" margin={2} customColor="orange" />
                    </Grid>

                    <Grid item display="flex" alignItems="center" sx={{ alignSelf: 'center' }}>
                        <Search placeholder="Find access groups" onChange={setGlobalFilter} />
                    </Grid>

                    <Grid display="flex" sx={{ marginLeft: 'auto', marginRight: '2px' }}>
                        <Button onClick={() => setIsOpenAddAccessGroup(true)} variant="contained" color="primary" width="3.81rem">
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
                            sx={{ '*:first-child': { ml: '22px' }, '*:last-child': { textAlign: 'center' } }}
                            gridTemplateColumns="repeat(2, 1fr)"
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
                                gridTemplateColumns="repeat(2, 1fr)"
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

            <Drawer anchor="right" open={isOpenAddAccessGroup} onClose={() => setIsOpenAddAccessGroup(!isOpenAddAccessGroup)} sx={drawerStyles}>
                <AddAccessGroupDrawer
                    user="Saul Frank"
                    handleClose={() => {
                        setIsOpenAddAccessGroup(false);
                        // retrieveUsers();                <==
                    }}
                />
            </Drawer>
        </Box>
    );
};

const CustomAccessGroup = ({ row, onClick }) => {
    const [name, description] = row.value;

    return (
        <Grid container direction="column" mx="22px" alignItems="left" justifyContent="flex-start" onClick={onClick}>
            <Typography component="h4" variant="h3" color="primary" className="text-blue font-black text-lg ">
                {name}
            </Typography>
            <Typography component="h5" variant="subtitle1">
                {description}
            </Typography>
        </Grid>
    );
};

export default AccessGroups;
