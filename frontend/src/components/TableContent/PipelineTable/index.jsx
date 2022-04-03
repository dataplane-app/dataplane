import { Box, Typography, Grid, Button, Drawer } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { useTable, useGlobalFilter } from 'react-table';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlayCircle } from '@fortawesome/free-regular-svg-icons';
import { faClock } from '@fortawesome/free-regular-svg-icons';
import PipelineItemTable from '../../MoreInfoContent/PipelineTableItem';
import { useHistory } from 'react-router-dom';
import MoreInfoMenuPipeline from '../../MoreInfoMenuPipeline';
import { useGlobalFlowState } from '../../../pages/Flow';
import { useRunPipelines } from '../../../graphql/runPipelines';
import { useGlobalRunState } from '../../../pages/View/useWebSocket';
import { useSnackbar } from 'notistack';
import { useGetPipelineFlow } from '../../../graphql/getPipelineFlow';
import { prepareInputForFrontend } from '../../../pages/View';
import DeletePipelineDrawer from '../../DrawerContent/DeletePipelineDrawer';
import CustomChip from '../../CustomChip';
import TurnOffPipelineDrawer from '../../DrawerContent/TurnOffPipelineDrawer';
import cronstrue from 'cronstrue';
import { useGlobalAuthState } from '../../../Auth/UserAuth';
import DuplicatePipelineDrawer from '../../DrawerContent/DuplicatePipelineDrawer';

const PipelineTable = ({ data, filter, setPipelineCount, environmentID, getPipelines }) => {
    // React router
    const history = useHistory();

    // Table item states
    const [isOpenManage, setIsOpenManage] = useState(false);

    const FlowState = useGlobalFlowState();

    const authState = useGlobalAuthState();
    const jwt = authState.authToken.get();

    // Drawer state
    const [isOpenDeletePipeline, setIsOpenDeletePipeline] = useState(false);
    const [pipelineName, setPipelineName] = useState('');
    const [pipelineId, setPipelineId] = useState('');

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
                accessor: (row) => [row.name, row.pipelineID, row.online, row.environmentID, row.node_type_desc],
                Cell: (row) => (
                    <Grid item sx={{ flex: 1, ml: -1 }} display="flex" alignItems="center" justifyContent="center">
                        <MoreInfoMenuPipeline
                            onClick={() => {
                                setPipelineName(row.value[0]);
                                setPipelineId(row.value[1]);
                            }}>
                            <PipelineItemTable //
                                id={row.value[1]}
                                name={row.value[0]}
                                online={row.value[2]}
                                environmentID={row.value[3]}
                                nodeTypeDesc={row.value[4]}
                                setIsOpenDeletePipeline={setIsOpenDeletePipeline}
                                getPipelines={getPipelines}
                                pipeline={row.cell.row.original}
                            />
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
                            sx={{ fontWeight: 400 }}
                            onClick={() => {
                                history.push({ pathname: `/pipelines/view/${row.value.pipelineID}`, state: row.value });
                                FlowState.isRunning.set(true);
                                runPipelines(environmentID, row.value.pipelineID, 'pipeline');
                            }}>
                            Run
                        </Button>
                    </Grid>
                ),
            },
            {
                Header: 'Trigger',
                accessor: (row) => row,
                Cell: (row) =>
                    row.value.node_type_desc ? (
                        <Box display="flex" alignItems="center">
                            <Box
                                component={FontAwesomeIcon}
                                fontSize={19}
                                sx={{ color: 'secondary.main' }}
                                icon={row.value.node_type_desc === 'play' ? faPlayCircle : faClock}
                                mr={1.5}
                            />
                            <Typography color="secondary.main" variant="body2">
                                {row.value.node_type_desc[0]?.toUpperCase() + row.value.node_type_desc.slice(1) + ' trigger'}
                                {row.value.schedule && ' - ' + formatSchedule(row.value.schedule, row.value.schedule_type)}
                            </Typography>
                        </Box>
                    ) : null,
            },
            {
                accessor: 'online',
                Cell: (row) => {
                    return row.value ? <CustomChip label={'Online'} customColor="green" /> : <CustomChip label="Offline" customColor="red" />;
                },
            },
        ],

        // eslint-disable-next-line react-hooks/exhaustive-deps
        [environmentID, jwt]
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
                                        <Grid
                                            item
                                            onClick={() => {
                                                FlowState.pipelineInfo.set(row.original);
                                                history.push(`/pipelines/view/${row.original.pipelineID}`);
                                            }}>
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
                <Drawer anchor="right" open={isOpenDeletePipeline} onClose={() => setIsOpenDeletePipeline(!isOpenDeletePipeline)}>
                    <DeletePipelineDrawer
                        pipelineName={pipelineName}
                        handleClose={() => {
                            setIsOpenDeletePipeline(false);
                        }}
                        getPipelines={getPipelines}
                        pipelineID={pipelineId}
                    />
                </Drawer>

                <Drawer anchor="right" open={FlowState.isOpenTurnOffPipelineDrawer.get()} onClose={() => FlowState.isOpenTurnOffPipelineDrawer.set(false)}>
                    <TurnOffPipelineDrawer
                        handleClose={() => FlowState.isOpenTurnOffPipelineDrawer.set(false)} //
                        pipelineID={pipelineId}
                        environmentID={environmentID}
                        name={pipelineName}
                        getPipelineFlow={getPipelines}
                    />
                </Drawer>

                <Drawer anchor="right" open={FlowState.isOpenDuplicatePipelineDrawer.get()} onClose={() => FlowState.isOpenDuplicatePipelineDrawer.set(false)}>
                    <DuplicatePipelineDrawer
                        handleClose={() => FlowState.isOpenDuplicatePipelineDrawer.set(false)} //
                        pipelineID={pipelineId}
                        environmentID={environmentID}
                        name={pipelineName}
                        getPipelines={getPipelines}
                    />
                </Drawer>
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
    return async (environmentID, pipelineID, RunType) => {
        // First get pipeline flow graph
        const rawResponse = await getPipelineFlow({ pipelineID, environmentID, RunType: 'pipeline' });
        const run_json = prepareInputForFrontend(rawResponse);
        if (run_json.length === 0) return;

        // Then run pipeline flow
        const response = await runPipelines({
            pipelineID,
            environmentID,
            RunType,
        });

        if (response.r === 'error') {
            closeSnackbar();
            enqueueSnackbar("Can't run flow: " + response.msg, { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            RunState.run_id.set(response.run_id);
        }
    };
};

// Utility function
function formatSchedule(schedule, type) {
    if (type === 'cronseconds') {
        if (schedule === '*/1 * * * * *') {
            return 'Every second';
        } else {
            return 'Every ' + schedule.split(' ')[0].replace('*/', '') + ' seconds';
        }
    }
    if (type === 'cron') {
        return cronstrue.toString(schedule, { throwExceptionOnParseError: false });
    }
}
