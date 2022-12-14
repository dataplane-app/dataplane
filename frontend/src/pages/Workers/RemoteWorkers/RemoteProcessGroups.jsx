import { Box, Button, Drawer, Grid, Tooltip, Typography } from '@mui/material';
import React, { useEffect, useMemo, useState } from 'react';
import { useGlobalFilter, useTable } from 'react-table';
import CustomChip from '../../../components/CustomChip';
import Chip from '@mui/material/Chip';
import Search from '../../../components/Search';
import { useHistory } from 'react-router-dom';
import pythonLogo from '../../../assets/images/pythonLogo.png';
import AddProcessGroupDrawer from '../../../components/DrawerContent/AddProcessGroup';
import { useGetRemoteProcessGroups } from '../../../graphql/getRemoteProcessGroups';
import { useSnackbar } from 'notistack';
import { useGlobalAuthState } from '../../../Auth/UserAuth';
import decode from 'jwt-decode';
import { useGlobalEnvironmentState } from '../../../components/EnviromentDropdown';

const tableWidth = '850px';

export default function RemoteProcessGroups() {
    const [showAddProcessGroupDrawer, setShowAddProcessGroupDrawer] = useState(false);
    const [remoteProcessGroups, setRemoteProcessGroups] = useState([]);

    // Global environment state with hookstate
    const Environment = useGlobalEnvironmentState();

    // Custom hook
    const getRemoteProcessGroups = useGetRemoteProcessGroupsHook(Environment.id.get(), setRemoteProcessGroups);

    useEffect(() => {
        if (!Environment.id.get()) return;

        getRemoteProcessGroups();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [Environment.id.get()]);

    const columns = useMemo(
        () => [
            {
                Header: 'Member',
                accessor: (row) => [row.name, row.description, row.language, row.remoteProcessGroupID, row.environments],
                Cell: (row) => <CustomWorker row={row} />,
            },
        ],

        []
    );

    // Use the state and functions returned from useTable to build your UI
    const { getTableProps, getTableBodyProps, rows, prepareRow, setGlobalFilter } = useTable(
        {
            columns,
            data: remoteProcessGroups,
        },

        useGlobalFilter
    );

    const history = useHistory();

    return (
        <Box className="page">
            <Box display="flex" alignItems="center" width={tableWidth}>
                <Typography id="test" component="h2" variant="h2" color="text.primary">
                    Process groups
                </Typography>
                <Button onClick={() => history.push('/remote/workers')} variant="text" sx={{ marginLeft: 'auto', marginRight: 2 }}>
                    Manage workers
                </Button>
                <Button onClick={() => setShowAddProcessGroupDrawer(true)} variant="contained" size="small">
                    Add process group
                </Button>
            </Box>

            <Box mt={'45px'} sx={{ width: tableWidth }}>
                <Grid container mt={4} direction="row" alignItems="center" justifyContent="flex-start">
                    <Grid item display="flex" alignItems="center" sx={{ alignSelf: 'center' }}>
                        <CustomChip amount={rows.length} label="Process groups" margin={2} customColor="orange" />
                    </Grid>

                    <Grid item display="flex" alignItems="center" sx={{ marginLeft: 'auto', marginRight: '2px' }}>
                        <Search placeholder="Find workers" onChange={setGlobalFilter} width="290px" />
                    </Grid>
                </Grid>
            </Box>

            <Box component="table" mt={2} sx={{ width: tableWidth }} {...getTableProps()}>
                <Box component="tbody" display="flex" sx={{ flexDirection: 'column' }} {...getTableBodyProps()}>
                    {rows.map((row, i) => {
                        prepareRow(row);
                        return (
                            <Box
                                component="tr"
                                {...row.getRowProps()}
                                display="grid"
                                gridTemplateColumns="1fr"
                                alignItems="start"
                                borderRadius="5px"
                                backgroundColor="background.secondary"
                                mt={2}
                                sx={{
                                    border: 1,
                                    borderColor: 'divider',
                                    padding: '15px 0',
                                    '&:hover': { background: 'background.hoverSecondary' },
                                    '& td > div': { width: 'unset' },
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

            {/* Add process group drawer */}
            <Drawer anchor="right" open={showAddProcessGroupDrawer} onClose={() => setShowAddProcessGroupDrawer(false)}>
                <AddProcessGroupDrawer handleClose={() => setShowAddProcessGroupDrawer(false)} getRemoteProcessGroups={getRemoteProcessGroups} />
            </Drawer>
        </Box>
    );
}

const CustomWorker = ({ row }) => {
    const [name, description, type, id, environments] = row.value;

    const history = useHistory();

    return (
        <Grid container flexDirection="column" mx="22px" alignItems="left" justifyContent="flex-start">
            <Box display="flex">
                <Tooltip title={id} placement="top-start">
                    <Typography component="h4" variant="h3" mb={1} sx={{ color: 'cyan.main' }}>
                        {name}
                    </Typography>
                </Tooltip>
                <Typography component="h5" variant="subtitle1">
                    {description}
                </Typography>

                <Typography
                    component="h5"
                    sx={{ color: 'cyan.main', fontSize: ' 0.875rem', display: 'inline', cursor: 'pointer', ml: 'auto' }}
                    onClick={() => history.push(`/remote/processgroups/${id}`)}>
                    Configure
                </Typography>

                <Typography
                    component="h5"
                    ml={4}
                    sx={{ color: 'cyan.main', fontSize: ' 0.875rem', display: 'inline', cursor: 'pointer' }}
                    onClick={() => history.push(`/remote/workers?filter=${id}&name=${name}`)}>
                    Workers
                </Typography>

                {type === 'python' ? (
                    <Box position="relative">
                        <img src={pythonLogo} alt="python logo" style={{ height: '32px', alignSelf: 'end', right: '-15px', position: 'relative' }} />
                    </Box>
                ) : null}
            </Box>

            <Box display="flex">
                {environments.map((a) => (
                    <Chip label={a} size="small" variant="outlined" sx={{ width: 'fit-content', mr: 1 }} />
                ))}
            </Box>
        </Grid>
    );
};

// ** Custom Hooks
const useGetRemoteProcessGroupsHook = (environmentID, setRemoteProcessGroups) => {
    // GraphQL hook
    const getRemoteProcessGroups = useGetRemoteProcessGroups();

    const { enqueueSnackbar } = useSnackbar();

    const auth = useGlobalAuthState();
    let { exp } = decode(auth.authToken.get());

    // Get worker groups
    return async () => {
        // Check if the token expired
        if (exp * 1000 < new Date().valueOf()) {
            return;
        }

        const response = await getRemoteProcessGroups({ environmentID, processGroupsEnvironmentID: environmentID });

        if (response === null) {
            setRemoteProcessGroups([]);
        } else if (response.r || response.error) {
            enqueueSnackbar("Can't get remote process groups: " + (response.msg || response.r || response.error), { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            // Convert string of environments to an array
            response.forEach((a) => (a.environments = a.environments.replace('{', '').replace('}', '').split(',')));
            setRemoteProcessGroups(response);
        }
    };
};
