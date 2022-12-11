import { Box, Typography, Grid, Button, Drawer, Pagination } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { useTable, useGlobalFilter, usePagination } from 'react-table';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlayCircle, faClock } from '@fortawesome/free-regular-svg-icons';
import { faPlug } from '@fortawesome/free-solid-svg-icons';
import PipelineItemTable from '../../MoreInfoContent/PipelineTableItem';
import { useHistory } from 'react-router-dom';
import MoreInfoMenuPipeline from '../../MoreInfoMenuPipeline';
import { useGlobalFlowState } from '../../../pages/PipelineEdit';
import DeletePipelineDrawer from '../../DrawerContent/DeletePipelineDrawer';
import CustomChip from '../../CustomChip';
import TurnOffPipelineDrawer from '../../DrawerContent/TurnOffPipelineDrawer';
import { useGlobalAuthState } from '../../../Auth/UserAuth';
import DuplicatePipelineDrawer from '../../DrawerContent/DuplicatePipelineDrawer';
import cronZone from '../../../utils/cronZone';
import { useGlobalMeState } from '../../Navbar';
import { getTimeZone } from '../../../utils/formatDate';

const PipelineTable = ({ data, filter, setPipelineCount, environmentID, setPipelines }) => {
    // React router
    const history = useHistory();

    const FlowState = useGlobalFlowState();
    const MeData = useGlobalMeState();

    const authState = useGlobalAuthState();
    const jwt = authState.authToken.get();

    // Drawer state
    const [isOpenDeletePipeline, setIsOpenDeletePipeline] = useState(false);
    const [pipelineName, setPipelineName] = useState('');
    const [pipelineId, setPipelineId] = useState('');
    const [pipelineDescription, setPipelineDescription] = useState('');
    const [pipelineWorkerGroup, setPipelineWorkerGroup] = useState('');

    useEffect(() => {
        setGlobalFilter(filter);

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filter]);

    const columns = useMemo(
        () => [
            {
                Header: 'Manage',
                accessor: (row) => [row.name, row.pipelineID, row.online, row.environmentID, row.node_type_desc, row.description, row.workerGroup],
                Cell: (row) => (
                    <Grid item sx={{ flex: 1, ml: -1 }} display="flex" alignItems="center" justifyContent="center">
                        <MoreInfoMenuPipeline
                            onClick={() => {
                                setPipelineName(row.value[0]);
                                setPipelineId(row.value[1]);
                                setPipelineDescription(row.value[5]);
                                setPipelineWorkerGroup(row.value[6]);
                            }}>
                            <PipelineItemTable //
                                id={row.value[1]}
                                name={row.value[0]}
                                online={row.value[2]}
                                environmentID={row.value[3]}
                                nodeTypeDesc={row.value[4]}
                                setIsOpenDeletePipeline={setIsOpenDeletePipeline}
                                setPipelines={setPipelines}
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
                                history.push({ pathname: `/pipelines/view/${row.value.pipelineID}`, state: { run: true } });
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
                                icon={row.value.node_type_desc === 'play' ? faPlayCircle : row.value.node_type_desc === 'schedule' ? faClock : faPlug}
                                mr={1.5}
                            />
                            <Typography color="secondary.main" variant="body2">
                                {row.value.node_type_desc[0]?.toUpperCase() + row.value.node_type_desc.slice(1) + ' trigger'}
                                {row.value.schedule && ' - ' + cronZone(row.value.schedule, MeData.timezone.get(), row.value.schedule_type)}
                                {row.value.node_type_desc === 'schedule' && ' ' + getTimeZone(row.value.timezone)}
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
    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        page,
        prepareRow,
        setGlobalFilter,
        pageCount,
        gotoPage,
        state: { pageIndex },
    } = useTable(
        {
            columns,
            data,
        },
        useGlobalFilter,
        usePagination
    );

    useEffect(() => {
        setPipelineCount(page.length);

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page]);

    return (
        <>
            <Box component="table" mt={4} width="100%" {...getTableProps()}>
                <Box mb={2} component="tbody" display="flex" sx={{ flexDirection: 'column' }} {...getTableBodyProps()}>
                    {page.map((row, i) => {
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

                {/* Pagination */}
                {pageCount > 1 ? (
                    <Pagination //
                        sx={{ '& ul': { justifyContent: 'end' } }}
                        onChange={(_, value) => gotoPage(value - 1)}
                        page={pageIndex + 1}
                        count={pageCount}
                        variant="outlined"
                        color="primary"
                    />
                ) : null}

                <Drawer anchor="right" open={isOpenDeletePipeline} onClose={() => setIsOpenDeletePipeline(!isOpenDeletePipeline)}>
                    <DeletePipelineDrawer
                        pipelineName={pipelineName}
                        handleClose={() => {
                            setIsOpenDeletePipeline(false);
                        }}
                        setPipelines={setPipelines}
                        pipelineID={pipelineId}
                        environmentID={environmentID}
                    />
                </Drawer>

                <Drawer anchor="right" open={FlowState.isOpenTurnOffPipelineDrawer.get()} onClose={() => FlowState.isOpenTurnOffPipelineDrawer.set(false)}>
                    <TurnOffPipelineDrawer
                        handleClose={() => FlowState.isOpenTurnOffPipelineDrawer.set(false)} //
                        pipelineID={pipelineId}
                        environmentID={environmentID}
                        name={pipelineName}
                        setPipelines={setPipelines}
                    />
                </Drawer>

                <Drawer anchor="right" open={FlowState.isOpenDuplicatePipelineDrawer.get()} onClose={() => FlowState.isOpenDuplicatePipelineDrawer.set(false)}>
                    <DuplicatePipelineDrawer
                        handleClose={() => FlowState.isOpenDuplicatePipelineDrawer.set(false)} //
                        pipelineID={pipelineId}
                        environmentID={environmentID}
                        name={pipelineName}
                        description={pipelineDescription}
                        workerGroup={pipelineWorkerGroup}
                        setPipelines={setPipelines}
                    />
                </Drawer>
            </Box>
        </>
    );
};

export default PipelineTable;
