import { useTheme } from '@emotion/react';
import { faPlayCircle } from '@fortawesome/free-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Box, Button, Drawer, Grid, IconButton, MenuItem, TextField, Typography } from '@mui/material';
import { useSnackbar } from 'notistack';
import { useEffect, useRef, useState } from 'react';
import ReactFlow, { addEdge, Controls } from 'react-flow-renderer';
import { useHistory, useParams, useLocation } from 'react-router-dom';
import CustomChip from '../components/CustomChip';
import CustomLine from '../components/CustomNodesContent/CustomLine';
import PublishPipelineDrawer from '../components/DrawerContent/PublishPipelineDrawer';
import RemoveLogsPageItem from '../components/MoreInfoContent/RemoveLogsPageItem';
import MoreInfoMenu from '../components/MoreInfoMenu';
import { useGetPipelineFlow } from '../graphql/getPipelineFlow';
import { edgeTypes, nodeTypes, useGlobalFlowState } from './Flow';
import { useGlobalEnvironmentState } from '../components/EnviromentDropdown';

const View = () => {

    // Hooks
    const theme = useTheme();
    const history = useHistory();
    const { state: pipeline } = useLocation();
    const getPipelineFlow = useGetPipelineFlow_(pipeline);

    // URI parameter
    const { pipelineId } = useParams();

    // Page states
    const [isOpenPublishDrawer, setIsOpenPublishDrawer] = useState(false);
    const [isRunning, setIsRunning] = useState(false);
    const [, setIsLoadingFlow] = useState(true);

    // Global states
    const FlowState = useGlobalFlowState();
    const Environment = useGlobalEnvironmentState();

    //Offset states and refs
    const [offsetHeight, setOffsetHeight] = useState(0);
    const offsetRef = useRef(null);

    useEffect(() => {
        setOffsetHeight(offsetRef.current.clientHeight);
    }, [offsetRef]);

    // Flow states
    const reactFlowWrapper = useRef(null);
    const [, setReactFlowInstance] = useState(null);
    const [elements, setElements] = useState([]);

    // Fetch previous elements
    useEffect(() => {
        // const prevElements = FlowState.elements.get();
        // setElements([...prevElements]);

        getPipelineFlow(Environment.id.get(), setElements);
        setIsLoadingFlow(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Handle edit button
    const handleGoToEditorPage = () => {
        FlowState.isEditorPage.set(true);
        history.push({ pathname: `/pipelines/flow/${pipelineId}`, state: pipeline });
    };

    //Flow methods
    const onLoad = (_reactFlowInstance) => setReactFlowInstance(_reactFlowInstance);
    const onConnect = (params) => {
        setElements((els) => addEdge({ ...params, type: 'custom' }, els));
    };

    return (
        <Box className="page" height="calc(100vh - 100px)" minHeight="min-content">
            <Box ref={offsetRef}>
                <Grid container alignItems="center" justifyContent="space-between" wrap="nowrap">
                    <Box display="flex">
                        <Typography component="h2" variant="h2" color="text.primary">
                            Pipelines {'>'} {pipeline.name}
                        </Typography>

                        <Grid display="flex" alignItems="flex-start">
                            <Box display="flex" alignItems="center" ml={4} mr={4}>
                                <Box height={16} width={16} backgroundColor={pipeline.online ? 'status.pipelineOnlineText' : 'error.main'} borderRadius="100%"></Box>
                                <Typography ml={1} fontSize={16} color={pipeline.online ? 'status.pipelineOnlineText' : 'error.main'}>
                                    {pipeline.online ? 'Online' : 'Offline'}
                                </Typography>
                            </Box>

                            <Box mr={3} textAlign="right">
                                <Typography variant="h3">{LOGS_MOCK.last_run}</Typography>
                                <Typography fontSize={17}>Last run</Typography>
                            </Box>

                            <Box ml={3} mr={4.5} textAlign="right">
                                <Typography variant="h3">{LOGS_MOCK.version}</Typography>
                                <Typography fontSize={17}>Version</Typography>
                            </Box>

                            <Button variant="contained" onClick={handleGoToEditorPage}>
                                Edit
                            </Button>
                            <Button variant="contained" sx={{ ml: 2.4 }} onClick={() => setIsOpenPublishDrawer(true)}>
                                Publish
                            </Button>
                            <Box sx={{ position: { xxs: 'relative', xl: 'absolute' }, ml: { xxs: 2, xl: 0 }, top: '0', right: '0' }}>
                                <MoreInfoMenu>
                                    <RemoveLogsPageItem />
                                </MoreInfoMenu>
                            </Box>
                        </Grid>
                    </Box>
                </Grid>

                <Grid mt={4} container alignItems="center" sx={{ width: { xl: '88%' }, flexWrap: 'nowrap' }}>
                    <Grid item display="flex" alignItems="center" sx={{ alignSelf: 'center' }} flex={1.2}>
                        <CustomChip amount={2} label="Steps" margin={2} customColor="orange" />
                        <CustomChip amount={2} label="Running" margin={2} customColor="blue" />
                        <CustomChip amount={2} label="Succeeded" margin={2} customColor="green" />
                        <CustomChip amount={2} label="Failed" margin={2} customColor="red" />
                        <CustomChip amount={2} label="Workers online" margin={2} customColor="purple" />
                    </Grid>

                    <Grid item alignItems="center" display="flex" flex={1}>
                        <Typography variant="h3">Run</Typography>
                        <TextField label="Live" id="last" select size="small" sx={{ ml: 2, mr: 2, flex: 1 }}>
                            <MenuItem value="24">Last 24 hours</MenuItem>
                        </TextField>
                    </Grid>
                    <Grid item flex={0.6}>
                        {isRunning ? (
                            <Box display="flex" alignItems="center" ml={2}>
                                <Button
                                    onClick={() => {
                                        FlowState.isRunning.set(false);
                                        setIsRunning(false);
                                    }}
                                    variant="outlined"
                                    color="error"
                                    sx={{ width: 70, fontWeight: '700', fontSize: '.81rem', border: 2, '&:hover': { border: 2 } }}>
                                    Stop
                                </Button>

                                <Typography variant="h3" ml={2}>
                                    00:00:01
                                </Typography>
                            </Box>
                        ) : (
                            <IconButton
                                sx={{ margin: 0, height: 40, width: 40 }}
                                aria-label="play"
                                id="play-button"
                                aria-haspopup="true"
                                onClick={() => {
                                    FlowState.isRunning.set(true);
                                    setIsRunning(true);
                                }}>
                                <Box component={FontAwesomeIcon} fontSize={30} sx={{ color: 'cyan.main' }} icon={faPlayCircle} />
                            </IconButton>
                        )}
                    </Grid>
                </Grid>
            </Box>

            <Box mt={7} sx={{ position: 'absolute', top: offsetHeight, left: 0, right: 0, bottom: 0 }} ref={reactFlowWrapper}>
                {elements && elements.length > 0 ? (
                    <ReactFlow
                        nodeTypes={nodeTypes}
                        elements={elements}
                        onLoad={onLoad}
                        onConnect={onConnect}
                        connectionLineComponent={CustomLine}
                        edgeTypes={edgeTypes}
                        arrowHeadColor={theme.palette.mode === 'dark' ? '#fff' : '#222'}
                        snapToGrid={true}
                        snapGrid={[15, 15]}>
                        <Controls style={{ left: 'auto', right: 10 }} />
                    </ReactFlow>
                ) : (
                    <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Typography>Create a pipeline by dragging the components here</Typography>
                    </Box>
                )}
            </Box>

            <Drawer anchor="right" open={isOpenPublishDrawer} onClose={() => setIsOpenPublishDrawer(!isOpenPublishDrawer)}>
                <PublishPipelineDrawer handleClose={() => setIsOpenPublishDrawer(false)} />
            </Drawer>
        </Box>
    );
};

const LOGS_MOCK = {
    id: 1,
    online: true,
    last_run: '22 Nov 2021 08:00',
    version: '0.0.1',
};

export default View;

// ------ Custom hook
const useGetPipelineFlow_ = (pipeline) => {
    // GraphQL hook
    const getPipelineFlow = useGetPipelineFlow();

    // React router
    const history = useHistory();

    // Global state
    const FlowState = useGlobalFlowState();

    // URI parameter
    const { pipelineId } = useParams();

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    // Get members
    return async (environmentID, setElements) => {
        const rawResponse = await getPipelineFlow({ pipelineID: pipelineId, environmentID });
        const response = prepareInputForFrontend(rawResponse);

        if (response.length === 0) {
            FlowState.elements.set([]);
            history.push({ pathname: `/pipelines/flow/${pipelineId}`, state: pipeline });
        } else if (response.r === 'error') {
            closeSnackbar();
            enqueueSnackbar("Can't get flow: " + response.msg, { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message + ': get flow', { variant: 'error' }));
        } else {
            setElements(response);
            FlowState.elements.set(response);
        }
    };
};

// ----- Utility function
function prepareInputForFrontend(input) {
    const edgesInput = [];
    const nodesInput = [];

    for (const iterator of input.edges) {
        edgesInput.push({
            source: iterator.from,
            sourceHandle: iterator.meta.sourceHandle,
            target: iterator.to,
            targetHandle: iterator.meta.targetHandle,
            type: iterator.meta.edgeType,
            arrowHeadType: iterator.meta.arrowHeadType,
            id: iterator.edgeID,
        });
    }

    for (const iterator of input.nodes) {
        let data = { ...iterator.meta?.data, name: iterator.name, description: iterator.description, workerGroup: iterator.workerGroup };
        nodesInput.push({
            id: iterator.nodeID,
            type: iterator.nodeTypeDesc + 'Node',
            position: {
                x: iterator.meta.position.x,
                y: iterator.meta.position.y,
            },
            data,
        });
    }

    return [...edgesInput, ...nodesInput];
}
