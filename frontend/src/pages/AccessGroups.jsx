import { useState, useMemo } from 'react';
import { Box, Grid, Typography, Button, Drawer } from '@mui/material';
import Search from '../components/Search';
import { useTable, useGlobalFilter } from 'react-table';
import { useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import CustomChip from '../components/CustomChip';
import { useGetAccessGroups } from '../graphql/getAccessGroups';
import { useSnackbar } from 'notistack';
import AddAccessGroupDrawer from '../components/DrawerContent/AddAccessGroupDrawer';
import { useGlobalMeState } from '../components/Navbar';
import { useGlobalEnvironmentState } from '../components/EnviromentDropdown';

const AccessGroups = () => {
    let history = useHistory();

    // Global user states with hookstate
    const MeData = useGlobalMeState();
    const Environment = useGlobalEnvironmentState();

    // Users state
    const [data, setData] = useState([]);

    // Sidebar states
    const [isOpenAddAccessGroup, setIsOpenAddAccessGroup] = useState(false);

    // Custom hook
    const getAccessGroups = useGetAccessGroups_(MeData.user_id.get(), setData);

    // Get access groups on load
    useEffect(() => {
        if (Environment.id.get()) {
            getAccessGroups(Environment.id.get());
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [Environment.id.get()]);

    const columns = useMemo(
        () => [
            {
                Header: 'Access group',
                accessor: (row) => [row.Name, row.Description],
                Cell: (row) => <CustomAccessGroup row={row} onClick={() => history.push(`/teams/access/${row.row.original.AccessGroupID}`)} />,
            },
            {
                Header: 'Status',
                accessor: 'Active',
                Cell: (row) => (row.value === true ? <CustomChip label="Active" customColor="green" /> : <CustomChip label="Inactive" customColor="red" />),
            },
        ],
        [history]
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

            <Typography variant="subtitle2" mt=".20rem">
                Environment: {Environment.name.get()}
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

            {data.length ? (
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
                                    <Box component="td" color="text.primary" fontWeight="600" fontSize="17px" textAlign="left" {...column.getHeaderProps()}>
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
            ) : (
                <Typography mt={3} variant="h3" color="text.primary" fontWeight="600" fontSize="17px">
                    No access groups
                </Typography>
            )}

            <Drawer anchor="right" open={isOpenAddAccessGroup} onClose={() => setIsOpenAddAccessGroup(!isOpenAddAccessGroup)}>
                <AddAccessGroupDrawer
                    handleClose={() => {
                        setIsOpenAddAccessGroup(false);
                    }}
                    environmentID={Environment.id.get()}
                    getAccessGroups={getAccessGroups}
                />
            </Drawer>
        </Box>
    );
};

const CustomAccessGroup = ({ row, onClick }) => {
    const [name, description] = row.value;

    return (
        <Grid container direction="column" mx="22px" alignItems="left" justifyContent="flex-start" onClick={onClick}>
            <Typography component="h4" variant="h3" sx={{ color: 'cyan.main' }}>
                {name}
            </Typography>
            <Typography component="h5" variant="subtitle1">
                {description}
            </Typography>
        </Grid>
    );
};

export default AccessGroups;

// ------- Custom Hooks
const useGetAccessGroups_ = (userID, setAccessGroups) => {
    // GraphQL hook
    const getAccessGroups = useGetAccessGroups();

    const { enqueueSnackbar } = useSnackbar();

    // Get access groups on load
    return async (environmentID) => {
        const response = await getAccessGroups({ environmentID, userID });

        if (response.r === 'error') {
            enqueueSnackbar("Can't get access groups: " + response.msg, { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            setAccessGroups(response.filter((a) => a.EnvironmentID === environmentID));
        }
    };
};
