import { useState, useMemo, useEffect } from 'react';
import { Box, Grid, Typography } from '@mui/material';
import Search from '../../components/Search';
import { useTable, useGlobalFilter } from 'react-table';
import CustomChip from '../../components/CustomChip';
import { formatDate } from '../../utils/formatDate';
import { useSnackbar } from 'notistack';
import { useGlobalEnvironmentState } from '../../components/EnviromentDropdown';
import { useGetWorkers } from '../../graphql/getWorkers';
import WorkerDetailCPU from './WorkerDetailCPU';
import WorkerDetailMemory from './WorkerDetailMemory';
import useWebSocket from './useWebSocket';
import { useHistory, useParams } from 'react-router-dom';
import { balancerDict } from './Workers';
import { useGlobalMeState } from '../../components/Navbar';

const tableWidth = '1140px';

export default function WorkerDetail() {
    // URI parameter
    const { workerId } = useParams();
    const history = useHistory();

    // Global environment state with hookstate
    const Environment = useGlobalEnvironmentState();
    const MeData = useGlobalMeState();

    // Instantiate websocket connection
    const socketResponse = useWebSocket(workerId);

    // Users state
    const [data, setData] = useState([]);

    // Custom hook
    const getWorkers = useGetWorkersHook(Environment.id.get(), setData, workerId);

    // Get workers on load and environment change
    useEffect(() => {
        if (data.length > 0) {
            history.push('/workers/');
        }
        getWorkers();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [Environment.name.get()]);

    // Polling on websocket
    useEffect(() => {
        let arr = [];
        for (let i in socketResponse) {
            arr.push(socketResponse[i]);
        }
        setData(arr);

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [socketResponse]);

    const timezone = MeData.timezone.get();
    const columns = useMemo(
        () => [
            {
                Header: 'Worker',
                accessor: (row) => [row.WorkerID, row.Status, formatDate(row.T, timezone)],
                Cell: (row) => <CustomWorker row={row} />,
            },
            {
                Header: 'CPU',
                accessor: (row) => [row.CPUPerc, row.Load, row.T, timezone],
                Cell: (row) => <WorkerDetailCPU row={row} />,
            },
            {
                Header: 'Memory',
                accessor: (row) => [row.MemoryPerc, formatMemory(row.MemoryUsed), row.T, timezone],
                Cell: (row) => <WorkerDetailMemory row={row} />,
            },
        ],
        [timezone]
    );

    // Use the state and functions returned from useTable to build your UI
    const { getTableProps, getTableBodyProps, rows, prepareRow, setGlobalFilter } = useTable(
        {
            columns,
            data,
            autoResetGlobalFilter: false,
        },
        useGlobalFilter
    );

    return (
        <Box className="page">
            <Typography component="h2" variant="h2" color="text.primary">
                Workers
            </Typography>

            <Typography variant="subtitle2" mt=".20rem">
                Environment: {Environment.name.get()}
            </Typography>

            <Box mt={4} sx={{ width: tableWidth }}>
                <Grid container mt={4} direction="row" alignItems="center" justifyContent="flex-start">
                    <Grid item display="flex" alignItems="center" sx={{ alignSelf: 'center' }}>
                        <CustomChip amount={rows.length} label="Workers" margin={2} customColor="orange" />
                    </Grid>

                    <Grid item display="flex" alignItems="center" sx={{ marginLeft: 'auto', marginRight: '2px' }}>
                        <Search placeholder="Find workers" onChange={setGlobalFilter} width="290px" />
                    </Grid>
                </Grid>
            </Box>

            <Box mt={4} sx={{ width: tableWidth }}>
                <Grid container mt={4} direction="row" alignItems="center" justifyContent="flex-start">
                    <Grid>
                        <Grid item display="flex" alignItems="center" flexDirection="row">
                            <Typography component="div" variant="body1" sx={{ fontSize: '1.0625rem' }}>
                                Worker group: {data[0]?.WorkerGroup}
                            </Typography>

                            <Box display="flex" ml={4} alignItems="center">
                                <Typography variant="subtitle1" fontWeight={'bold'} mr={1}>
                                    Worker type:
                                </Typography>
                                <Typography variant="subtitle1" style={{ display: 'inline' }}>
                                    {data[0]?.WorkerType}
                                </Typography>
                            </Box>

                            <Box display="flex" ml={4} flexDirection="row" alignItems="center">
                                <Typography variant="subtitle1" fontWeight="700">
                                    Load balancer:
                                </Typography>
                                <Typography variant="subtitle1" align="left" sx={{ lineHeight: 1, marginLeft: 1 }}>
                                    {balancerDict[data[0]?.LB]}
                                </Typography>
                            </Box>
                        </Grid>
                        <Grid item>
                            <Typography variant="subtitle1">Python workers for generic work loads.</Typography>
                        </Grid>
                    </Grid>

                    {/* <Grid item display="flex" alignItems="center" sx={{ marginLeft: 'auto', marginRight: '2px' }}>
                        <div>
                            <Typography component="h2" variant="h2" align="right" sx={{ fontWeight: 900 }}>
                                6
                            </Typography>
                            <Typography variant="body1" sx={{ fontSize: '1.0625rem' }}>
                                Queue
                            </Typography>
                        </div>

                        <div style={{ marginLeft: 38 }}>
                            <Typography component="h2" variant="h2" align="right" sx={{ fontWeight: 900 }}>
                                6
                            </Typography>
                            <Typography variant="body1" sx={{ fontSize: '1.0625rem' }}>
                                Running
                            </Typography>
                        </div>

                        <div style={{ marginLeft: 38 }}>
                            <Typography component="h2" variant="h2" align="right" sx={{ fontWeight: 900 }}>
                                6
                            </Typography>
                            <Typography variant="body1" sx={{ fontSize: '1.0625rem' }}>
                                Succeeded
                            </Typography>
                        </div>

                        <div style={{ marginLeft: 38 }}>
                            <Typography component="h2" variant="h2" align="right" sx={{ fontWeight: 900 }}>
                                6
                            </Typography>
                            <Typography variant="body1" sx={{ fontSize: '1.0625rem' }}>
                                Failed
                            </Typography>
                        </div>
                    </Grid> */}
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
                                gridTemplateColumns="350px 1fr 1fr"
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
        </Box>
    );
}

const CustomWorker = ({ row }) => {
    const [WorkerID, Status, T] = row.value;

    return (
        <Grid container direction="column" mx="22px" alignItems="left" justifyContent="flex-start">
            <div>
                <Typography component="h4" variant="h3" sx={{ display: 'inline' }}>
                    {WorkerID}
                </Typography>
            </div>
            <Typography component="h5" mt={0.5} variant="subtitle1" mb={1}>
                Last updated: {T}
            </Typography>
            {Status === 'Online' ? (
                <CustomChip label={'Online'} customColor="green" style={{ width: 'fit-content' }} />
            ) : (
                <CustomChip label="Offline" customColor="red" style={{ width: 'fit-content' }} />
            )}
            {/* <Grid item display="flex" alignItems="center" mt={2} sx={{ alignSelf: 'flex-start' }}>
                <CustomChip amount={queue} label="Queue" margin={2} customColor="purple" />
                <CustomChip amount={running} label="Running" margin={1} customColor="orange" />
                <CustomChip amount={succeeded} label="Succeeded" margin={1} customColor="green" />
                <CustomChip amount={failed} label="Failed" margin={1} customColor="red" />
            </Grid> */}
        </Grid>
    );
};

// ------- Custom Hooks
const useGetWorkersHook = (environmentID, setData, workerId) => {
    // GraphQL hook
    const getWorkers = useGetWorkers();

    const { enqueueSnackbar } = useSnackbar();

    // Get workers
    return async () => {
        const response = await getWorkers({ environmentID });

        if (response === null) {
            setData([]);
        } else if (response.r === 'error') {
            enqueueSnackbar("Can't get workers: " + response.msg, { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            setData(response.filter((a) => a.WorkerGroup === workerId));
        }
    };
};

// -------- Utility function
/**
 * @example 8821968896 => 8.8GB
 *          882196889  => 882MB
 */
function formatMemory(memory) {
    const GB = 1000000000;
    if (memory < GB) {
        return (memory / Math.pow(1024, 2)).toFixed() + 'MB';
    } else {
        return (memory / Math.pow(1024, 3)).toFixed(1) + 'GB';
    }
}

// function sortObjectByName(a, b) {
//     if (a.WorkerID < b.WorkerID) {
//         return -1;
//     }
//     if (a.WorkerID > b.WorkerID) {
//         return 1;
//     }
//     return 0;
// }
