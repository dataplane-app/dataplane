import { useState, useMemo, useEffect } from 'react';
import { Box, Grid, Typography, Drawer } from '@mui/material';
import Search from '../../components/Search';
import { useTable, useGlobalFilter } from 'react-table';
import { useHistory } from 'react-router-dom';
import CustomChip from '../../components/CustomChip';
import { useGlobalEnvironmentState } from '../../components/EnviromentDropdown';
import SecretsDrawer from '../../components/DrawerContent/SecretsDrawer';
import { useGetWorkerGroups } from '../../graphql/getWorkerGroups';
import { useSnackbar } from 'notistack';
import { useGlobalAuthState } from '../../Auth/UserAuth';
import decode from 'jwt-decode';

const tableWidth = '570px';

export default function Workers() {
    // React router
    let history = useHistory();

    // Global environment state with hookstate
    const Environment = useGlobalEnvironmentState();

    // Local state
    const [data, setData] = useState([]);

    // Sidebar state
    const [isOpenSecrets, setIsOpenSecrets] = useState(false);
    const [secretDrawerWorkGroup, setSecretDrawerWorkGroup] = useState(null);

    // Control state
    const [triggerRefresh, setTriggerRefresh] = useState(1);

    // Custom hook
    const getWorkerGroups = useGetWorkerGroups_(Environment.name.get(), setData);

    // Get workers on load, on environment change and every 5 seconds
    useEffect(() => {
        getWorkerGroups();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [Environment.name.get(), triggerRefresh]);

    // Trigger refresh on get worker groups
    useEffect(() => {
        let triggerRefreshTimer = setInterval(() => {
            setTriggerRefresh(triggerRefresh * -1);
        }, 5000);

        return () => clearInterval(triggerRefreshTimer);
    }, [triggerRefresh]);

    const columns = useMemo(
        () => [
            {
                Header: 'Member',
                accessor: (row) => [properCase(row.WorkerGroup), properCase(row.WorkerType), row.WorkerGroup],
                Cell: (row) => (
                    <CustomWorker
                        row={row}
                        onClick={() => history.push(`/workers/${row.row.original.WorkerGroup}`)}
                        setIsOpenSecrets={setIsOpenSecrets}
                        setSecretDrawerWorkGroup={setSecretDrawerWorkGroup}
                    />
                ),
            },
            {
                Header: 'Status',
                accessor: (row) => [row.Status, balancerDict[row.LB]],
                Cell: (row) => <CustomStatus row={row} />,
            },
        ],
        [history]
    );

    // Use the state and functions returned from useTable to build your UI
    const { getTableProps, getTableBodyProps, rows, prepareRow, state, setGlobalFilter } = useTable(
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
            <Typography id="test" component="h2" variant="h2" color="text.primary">
                Worker groups
            </Typography>

            <Typography variant="subtitle2" mt=".20rem">
                Environment: {Environment.name.get()}
            </Typography>

            <Box mt={4} sx={{ width: tableWidth }}>
                <Grid container mt={4} direction="row" alignItems="center" justifyContent="flex-start">
                    <Grid item display="flex" alignItems="center" sx={{ alignSelf: 'center' }}>
                        <CustomChip amount={rows.length} label="Worker groups" margin={2} customColor="orange" />
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
                                gridTemplateColumns="repeat(2, 1fr)"
                                alignItems="start"
                                borderRadius="5px"
                                backgroundColor="background.secondary"
                                mt={2}
                                sx={{
                                    border: 1,
                                    borderColor: 'divider',
                                    padding: '15px 0',
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

            <Drawer anchor="right" open={isOpenSecrets} onClose={() => setIsOpenSecrets(!isOpenSecrets)}>
                <SecretsDrawer
                    handleClose={() => {
                        setIsOpenSecrets(false);
                        setSecretDrawerWorkGroup(null);
                    }}
                    secretDrawerWorkGroup={secretDrawerWorkGroup}
                    environmentName={Environment.name.get()}
                />
            </Drawer>
        </Box>
    );
}

const CustomWorker = ({ row, onClick, setIsOpenSecrets, setSecretDrawerWorkGroup }) => {
    const [name, type, workerGroup] = row.value;

    return (
        <Grid container direction="column" mx="22px" alignItems="left" justifyContent="flex-start">
            <Typography component="h4" variant="h3" mb={1} sx={{ color: 'cyan.main', cursor: 'pointer' }} onClick={onClick}>
                {name}
            </Typography>
            <Typography component="h5" variant="subtitle1" onClick={onClick} sx={{ cursor: 'pointer' }}>
                Python workers for generic work loads.
            </Typography>
            <div style={{ display: 'flex', flexDirection: 'row' }}>
                <Typography component="h5" mt={2} variant="subtitle1" style={{ fontSize: '17px', cursor: 'pointer' }} onClick={onClick}>
                    {type}
                </Typography>
                <Typography
                    component="h5"
                    ml={4}
                    mt={2}
                    variant="subtitle1"
                    sx={{ color: 'cyan.main', fontSize: ' 1.0625rem', display: 'inline', cursor: 'pointer' }}
                    onClick={() => {
                        setIsOpenSecrets(true);
                        setSecretDrawerWorkGroup(workerGroup);
                    }}>
                    Secrets
                </Typography>
            </div>
        </Grid>
    );
};

const CustomStatus = ({ row }) => {
    const [status, LB] = row.value;
    return (
        <Grid container direction="column" alignItems="flex-end" pr={5}>
            {status === 'Online' ? <CustomChip label={'Online'} customColor="green" /> : <CustomChip label="Offline" customColor="red" />}

            <div>
                <Typography mt={3} variant="subtitle1" fontWeight="700">
                    Load balancer:
                </Typography>
                <Typography variant="subtitle1" align="left" sx={{ lineHeight: 1 }}>
                    {LB}
                </Typography>
            </div>
        </Grid>
    );
};

// ------- Custom Hooks
const useGetWorkerGroups_ = (environmentName, setWorkerGroups) => {
    // GraphQL hook
    const getAccessGroupUsers = useGetWorkerGroups();

    const { enqueueSnackbar } = useSnackbar();

    const auth = useGlobalAuthState();
    let { exp } = decode(auth.authToken.get());

    // Get worker groups
    return async () => {
        // Check if the token expired
        if (exp * 1000 < new Date().valueOf()) {
            return;
        }

        const response = await getAccessGroupUsers({ environmentName });

        if (response === null) {
            setWorkerGroups([]);
        } else if (response.r === 'error') {
            enqueueSnackbar("Can't get worker groups: " + response.msg, { variant: 'error' });
        } else if (response.r === 'Unauthorized') {
            enqueueSnackbar('Idle: not polling', { variant: 'warning' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            setWorkerGroups(response);
        }
    };
};

// -------- Utility function
/**
 * @param {string} text
 * @example 'python_1' => 'Python 1'
 */
function properCase(text) {
    return (text[0].toUpperCase() + text.slice(1)).replace('_', ' ');
}

export const balancerDict = {
    roundrobin: 'Round robin',
};
