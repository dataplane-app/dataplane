import { useState, useMemo, useEffect } from 'react';
import { Box, Grid, Typography } from '@mui/material';
import Search from '../../components/Search';
import { useTable, useGlobalFilter } from 'react-table';
import CustomChip from '../../components/CustomChip';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDocker } from '@fortawesome/free-brands-svg-icons';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import { formatDate } from '../../utils/formatDate';
import { useSnackbar } from 'notistack';
import { useGlobalEnvironmentState } from '../../components/EnviromentDropdown';
import { useGetWorkers } from '../../graphql/getWorkers';
import WorkerDetailCPU from './WorkerDetailCPU';
import WorkerDetailMemory from './WorkerDetailMemory';
import useWebSocket from './useWebSocket';
import { useParams } from 'react-router-dom';
import { balancerDict } from './Workers';

const tableWidth = '1140px';

export default function WorkerDetail() {
    // URI parameter
    const { workerId } = useParams();

    // Instantiate websocket connection
    const socketResponse = useWebSocket(workerId);

    // Global environment state with hookstate
    const Environment = useGlobalEnvironmentState();

    // Users state
    const [data, setData] = useState([]);

    // Custom hook
    const getWorkers = useGetWorkers_(Environment.name.get(), setData, workerId);

    // Get workers on load and environment change
    useEffect(() => {
        getWorkers();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [Environment.name.get()]);

    // Polling on websocket
    useEffect(() => {
        // Keep workers that are incoming response
        let keep = data.filter((a) => a.WorkerID !== socketResponse.WorkerID);

        socketResponse.T && setData([...keep, socketResponse].sort(sortObjectByName));

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [socketResponse.T]);

    const columns = useMemo(
        () => [
            {
                Header: 'Worker',
                accessor: (row) => [row.WorkerID, row.Status, formatDate(row.T)],
                Cell: (row) => <CustomWorker row={row} />,
            },
            {
                Header: 'CPU',
                accessor: (row) => [row.CPUPerc, row.Load, row.T],
                Cell: (row) => <WorkerDetailCPU row={row} />,
            },
            {
                Header: 'Memory',
                accessor: (row) => [row.MemoryPerc, (row.MemoryUsed / 1000000).toFixed(), row.T],
                Cell: (row) => <WorkerDetailMemory row={row} />,
            },
        ],
        []
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
                        <FontAwesomeIcon icon={faSearch} style={{ marginRight: 10 }} color="#0000006B" size="xs" />

                        <Search placeholder="Find workers" onChange={setGlobalFilter} width="290px" />
                    </Grid>
                </Grid>
            </Box>

            <Box mt={4} sx={{ width: tableWidth }}>
                <Grid container mt={4} direction="row" alignItems="center" justifyContent="flex-start">
                    <Grid>
                        <Grid item display="flex" alignItems="center" flexDirection="row">
                            <Typography component="div" variant="body1" sx={{ fontSize: '1.0625rem' }}>
                                Worker group: {socketResponse?.WorkerGroup}
                            </Typography>

                            <Box display="flex" ml={4} alignItems="center">
                                <FontAwesomeIcon icon={faDocker} style={{ marginRight: 4 }} />
                                <Typography variant="subtitle1" style={{ display: 'inline' }}>
                                    {socketResponse.WorkerType}
                                </Typography>
                            </Box>

                            <Box display="flex" ml={4} flexDirection="row" alignItems="center">
                                <Typography variant="subtitle1" fontWeight="700">
                                    Load balancer:
                                </Typography>
                                <Typography variant="subtitle1" align="left" sx={{ lineHeight: 1, marginLeft: 1 }}>
                                    {balancerDict[socketResponse.LB]}
                                </Typography>
                            </Box>
                        </Grid>
                        <Grid item>
                            <Typography variant="subtitle1">Python workers for generic work loads.</Typography>
                        </Grid>
                    </Grid>

                    <Grid item display="flex" alignItems="center" sx={{ marginLeft: 'auto', marginRight: '2px' }}>
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
                                gridTemplateColumns="400px 1fr 1fr"
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
    const [WorkerID, Status, T, queue = 2, running = 2, succeeded = 2, failed = 2] = row.value;

    return (
        <Grid container direction="column" mx="22px" alignItems="left" justifyContent="flex-start">
            <div>
                <Typography component="h4" variant="h3" sx={{ display: 'inline' }}>
                    {WorkerID}
                </Typography>
                <Typography
                    component="h4"
                    variant="subtitle1"
                    color={Status === 'Online' ? 'green' : 'red'}
                    fontWeight={700}
                    ml={3}
                    sx={{ display: 'inline', verticalAlign: 'top' }}>
                    {Status}
                </Typography>
            </div>
            <Typography component="h5" mt={0.5} variant="subtitle1">
                Last updated: {T}
            </Typography>
            <Grid item display="flex" alignItems="center" mt={2} sx={{ alignSelf: 'flex-start' }}>
                <CustomChip amount={queue} label="Queue" margin={2} customColor="purple" />
                <CustomChip amount={running} label="Running" margin={1} customColor="orange" />
                <CustomChip amount={succeeded} label="Succeeded" margin={1} customColor="green" />
                <CustomChip amount={failed} label="Failed" margin={1} customColor="red" />
            </Grid>
        </Grid>
    );
};

// ------- Custom Hooks
const useGetWorkers_ = (environmentName, setData, workerId) => {
    // GraphQL hook
    const getWorkers = useGetWorkers();

    const { enqueueSnackbar } = useSnackbar();

    // Get workers
    return async () => {
        const response = await getWorkers({ environmentName });

        if (response === null) {
            setData([]);
        } else if (response.r === 'error') {
            enqueueSnackbar("Can't get workers: " + response.msg, { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message + ': get workers failed', { variant: 'error' }));
        } else {
            setData(response.filter((a) => a.WorkerGroup === workerId));
        }
    };
};

// -------- Utility function
function sortObjectByName(a, b) {
    if (a.WorkerID < b.WorkerID) {
        return -1;
    }
    if (a.WorkerID > b.WorkerID) {
        return 1;
    }
    return 0;
}
