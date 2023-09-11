import { Box, Typography, Grid, Button, Drawer, Chip } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { useTable, useGlobalFilter } from 'react-table';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlayCircle } from '@fortawesome/free-regular-svg-icons';
import { faClock } from '@fortawesome/free-regular-svg-icons';
import DeploymentsTableItem from './DeploymentsTableItem';
import { useHistory } from 'react-router-dom';
import MoreInfoMenu from '../Pipelines/Components/MoreInfoMenuPipeline';
import CustomChip from '../../components/CustomChip';
import { useGlobalAuthState } from '../../Auth/UserAuth';
import { useGlobalEnvironmentsState, useGlobalEnvironmentState } from '../../components/EnviromentDropdown';
import TurnOffDeploymentDrawer from './TurnOffDeploymentDrawer';
import DeleteDeploymentDrawer from './DeleteDeploymentDrawer';
import { useGlobalFlowState } from '../Pipelines/PipelineEdit.jsx';
import { useGlobalMeState } from '../../components/Navbar';
import cronZone from '../../utils/cronZone';
import { getTimeZone } from '../../utils/formatDate';
import DeployAPITRiggerTableDrawer from './Components/DeployAPITriggerTableDrawer';

const DeploymentsTable = ({ data, filter, setPipelineCount, environmentID, setDeployments }) => {
    // React router
    const history = useHistory();

    const FlowState = useGlobalFlowState();
    const MeData = useGlobalMeState();

    const Environments = useGlobalEnvironmentsState();
    const Environment = useGlobalEnvironmentState();

    const authState = useGlobalAuthState();
    const jwt = authState.authToken.get();

    // Drawer state
    const [isOpenDeletePipeline, setIsOpenDeletePipeline] = useState(false);
    const [isOpenAPI, setIsOpenAPI] = useState(false);
    const [pipelineName, setPipelineName] = useState('');
    const [pipelineId, setPipelineId] = useState('');
    const [version, setVersion] = useState('');

    useEffect(() => {
        setGlobalFilter(filter);

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filter]);

    const columns = useMemo(
        () => [
            {
                Header: 'Manage',
                accessor: (row) => [row.name, row.pipelineID, row.online, row.environmentID, row.node_type_desc, row.version, row.deploy_active],
                Cell: (row) => (
                    <Grid item sx={{ flex: 1, ml: -1 }} display="flex" alignItems="center" justifyContent="center">
                        <MoreInfoMenu
                            onClick={() => {
                                setPipelineName(row.value[0]);
                                setPipelineId(row.value[1]);
                                setVersion(row.value[5]);
                            }}>
                            <DeploymentsTableItem
                                id={row.value[1]} // Deployment id
                                name={row.value[0]}
                                online={row.value[2]}
                                environmentID={row.value[3]}
                                nodeTypeDesc={row.value[4]}
                                setIsOpenDeletePipeline={setIsOpenDeletePipeline}
                                openAPI={() => setIsOpenAPI(true)}
                                setDeployments={setDeployments}
                                deploy_active={row.value[6]}
                                version={row.value[5]}
                            />
                        </MoreInfoMenu>
                    </Grid>
                ),
            },
            {
                Header: 'Run',
                accessor: (row) => row,
                Cell: (row) => (
                    <Grid container alignItems="flex-start" flexDirection="column" justifyContent="center">
                        <Button
                            disabled={!row.value.deploy_active}
                            variant="text"
                            sx={{ fontWeight: 400 }}
                            onClick={() => {
                                history.push({ pathname: `/deployments/view/${row.value.pipelineID}/${row.value.version}`, state: { run: true } });
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
            {
                Header: 'Deployed',
                accessor: (row) => [row.deploy_active, row.version],
                Cell: (row) => {
                    const deploy_active = row.value[0];
                    const version = row.value[1];
                    return (
                        <Chip style={{ borderRadius: 5, fontWeight: 700, backgroundColor: deploy_active ? '#7B61FF' : '#B9B9B9', color: '#FFF' }} label={`Deployed v${version}`} />
                    );
                },
            },
            {
                Header: 'Edit',
                accessor: (row) => [row.fromEnvironmentID, row.pipelineID],
                Cell: (row) => {
                    const fromEnvironmentName = Environments.get().filter((a) => a.id === row.value[0])[0].name;
                    return (
                        <Button
                            onClick={() => {
                                Environment.set({ id: row.value[0], name: fromEnvironmentName });
                                history.push({ pathname: `/pipelines/flow/${row.value[1].slice(2)}`, state: row.value });
                            }}>
                            Edit: {fromEnvironmentName}
                        </Button>
                    );
                },
            },
            {
                accessor: 'deploy_active',
                Cell: (row) => {
                    return !row.value ? (
                        <Typography variant="body2" color="editorPage.fileManagerIcon">
                            Previous version
                        </Typography>
                    ) : null;
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
                                                history.push(`/deployments/view/${row.original.pipelineID}/${row.original.version}`);
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
                    <DeleteDeploymentDrawer
                        pipelineName={pipelineName}
                        handleClose={() => {
                            setIsOpenDeletePipeline(false);
                        }}
                        setDeployments={setDeployments}
                        pipelineID={pipelineId}
                        version={version}
                        environmentID={environmentID}
                    />
                </Drawer>

                <Drawer anchor="right" open={FlowState.isOpenTurnOffDeploymentDrawer.get()} onClose={() => FlowState.isOpenTurnOffDeploymentDrawer.set(false)}>
                    <TurnOffDeploymentDrawer
                        handleClose={() => FlowState.isOpenTurnOffDeploymentDrawer.set(false)}
                        pipelineID={pipelineId}
                        environmentID={environmentID}
                        name={pipelineName}
                        setDeployments={setDeployments}
                    />
                </Drawer>

                <Drawer
                    hideBackdrop
                    sx={{ width: 'calc(100% - 203px)', zIndex: 1099, [`& .MuiDrawer-paper`]: { width: 'calc(100% - 203px)', top: 82 } }}
                    anchor="right"
                    open={isOpenAPI}
                    onClose={() => setIsOpenAPI(false)}>
                    <DeployAPITRiggerTableDrawer //
                        handleClose={() => setIsOpenAPI(false)}
                        deploymentId={pipelineId}
                    />
                </Drawer>
            </Box>
        </>
    );
};

export default DeploymentsTable;
