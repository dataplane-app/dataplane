import { Box, Typography, Grid, Button } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { useTable, useGlobalFilter } from 'react-table';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlayCircle } from '@fortawesome/free-regular-svg-icons';
import PipelineItemTable from '../../MoreInfoContent/PipelineTableItem';
import { useHistory } from 'react-router-dom';
import MoreInfoMenuPipeline from '../../MoreInfoMenuPipeline';
import { useGlobalFlowState } from '../../../pages/Flow';
import { useRunPipelines } from '../../../graphql/runPipelines';
import { useGlobalRunState } from '../../../pages/View/useWebSocket';
import { useSnackbar } from 'notistack';
import { useGetPipelineFlow } from '../../../graphql/getPipelineFlow';
import { prepareInputForFrontend } from '../../../pages/View';

const PipelineTable = ({ data, filter, setPipelineCount, environmentID }) => {
    // React router
    const history = useHistory();

    // Table item states
    const [isOpenManage, setIsOpenManage] = useState(false);

    const FlowState = useGlobalFlowState();

    // GraphQL hook
    const runPipelines = useRunPipelinesHook();

    useEffect(() => {
        setGlobalFilter(filter);

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filter]);

    const columns = useMemo(
        () => [
            {
                Header: 'Manage',
                accessor: (row) => [row.pipelineID, row.name],
                Cell: (row) => (
                    <Grid item sx={{ flex: 1, ml: -1 }} display="flex" alignItems="center" justifyContent="center">
                        <MoreInfoMenuPipeline>
                            <PipelineItemTable id={row.value[0]} name={row.value[1]} handleOpenManage={() => setIsOpenManage(!isOpenManage)} />
                        </MoreInfoMenuPipeline>
                    </Grid>
                ),
            },
            {
                Header: 'Run',
                accessor: (row) => row,
                Cell: (row) => (
                    <Grid container alignItems="flex-start" flexDirection="column" justifyContent="center">
                        <Button
                            variant="text"
                            disabled={row.value.json.length === 0}
                            onClick={() => {
                                history.push({ pathname: `/pipelines/view/${row.value.pipelineID}`, state: row.value });
                                FlowState.isRunning.set(true);
                                runPipelines(environmentID, row.value.pipelineID);
                            }}>
                            Run
                        </Button>
                    </Grid>
                ),
            },
            {
                accessor: 'trigger',
                Cell: (row) => (
                    <Box display="flex" alignItems="center">
                        <Box component={FontAwesomeIcon} fontSize={19} sx={{ color: 'secondary.main' }} icon={faPlayCircle} mr={1.5} />
                        <Typography color="secondary.main" variant="body2">
                            Play trigger
                        </Typography>
                    </Box>
                ),
            },
            {
                accessor: 'online',
                Cell: (row) => {
                    return (
                        <Box display="flex" alignItems="center" pr={2} ml={1.2}>
                            <Box height={16} width={16} backgroundColor={`${row.value ? 'status.pipelineOnline' : 'error.main'}`} borderRadius="100%"></Box>
                            <Typography ml={1} fontSize={16} sx={{ color: row.value ? 'status.pipelineOnlineText' : 'error.main' }}>
                                {row.value ? 'Online' : 'Offline'}
                            </Typography>
                        </Box>
                    );
                },
            },
        ],

        // eslint-disable-next-line react-hooks/exhaustive-deps
        [environmentID]
    );

    // Use the state and functions returned from useTable to build your UI
    const { getTableProps, getTableBodyProps, rows, prepareRow, setGlobalFilter } = useTable(
        {
            columns,
            data,
        },
        useGlobalFilter
    );

    useEffect(() => {
        setPipelineCount(rows.length);

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rows]);

    return (
        <>
            <Box component="table" mt={4} width="100%" {...getTableProps()}>
                <Box component="tbody" display="flex" sx={{ flexDirection: 'column' }} {...getTableBodyProps()}>
                    {rows.map((row, i) => {
                        console.log(row);
                        prepareRow(row);
                        return (
                            <Box
                                component="tr"
                                {...row.getRowProps()}
                                display="flex"
                                flexDirection="column"
                                borderRadius="5px"
                                backgroundColor="background.secondary"
                                sx={{ border: 1, borderColor: 'divider', padding: 3, cursor: 'pointer', '&:hover': { background: 'background.hoverSecondary' }, mt: 2 }}>
                                <Box component="td">
                                    {/* Name and description */}
                                    <Grid display="flex" alignItems="flex-start" justifyContent="space-between">
                                        <Grid item onClick={() => history.push({ pathname: `/pipelines/view/${row.original.pipelineID}`, state: row.original })}>
                                            <Typography variant="h3" color="cyan.main">
                                                {row.original.name}
                                            </Typography>
                                            <Typography fontSize={15} color="text.primary" mt={0.3}>
                                                {row.original.description}
                                            </Typography>
                                        </Grid>
                                    </Grid>

                                    {/* Bottom row */}
                                    <Grid container alignItems="center" wrap="nowrap">
                                        <Box sx={{ flex: 8 }}>
                                            <Box display="flex" gap={4} alignItems="center" mt={1.3}>
                                                {row.cells.map((cell) => {
                                                    return <Box {...cell.getCellProps()}>{cell.render('Cell')}</Box>;
                                                })}
                                            </Box>
                                        </Box>
                                    </Grid>
                                </Box>
                            </Box>
                        );
                    })}
                </Box>
            </Box>
        </>
    );
};

export default PipelineTable;

// Custom GraphQL hook
export const useRunPipelinesHook = () => {
    // GraphQL hooks
    const getPipelineFlow = useGetPipelineFlow();
    const runPipelines = useRunPipelines();

    // Global state
    const RunState = useGlobalRunState();

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    // Run pipeline flow
    return async (environmentID, pipelineID) => {
        // First get pipeline flow graph
        const rawResponse = await getPipelineFlow({ pipelineID, environmentID });
        const run_json = prepareInputForFrontend(rawResponse);
        if (run_json.length === 0) return;

        // Then run pipeline flow
        const response = await runPipelines({
            pipelineID,
            environmentID,
            run_json,
        });

        if (response.r === 'error') {
            closeSnackbar();
            enqueueSnackbar("Can't run flow: " + response.msg, { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message + ': run flow', { variant: 'error' }));
        } else {
            RunState.run_id.set(response.run_id);
        }
    };
};
