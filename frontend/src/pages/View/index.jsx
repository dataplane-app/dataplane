import { useTheme } from '@emotion/react';
import { faExpandArrowsAlt } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Box, Button, Drawer, Grid, Typography } from '@mui/material';
import { useSnackbar } from 'notistack';
import { useEffect, useRef, useState } from 'react';
import ReactFlow, { addEdge, ControlButton, Controls, ReactFlowProvider } from 'react-flow-renderer';
import { useHistory, useLocation, useParams } from 'react-router-dom';
import CustomLine from '../../components/CustomNodesContent/CustomLine';
import PublishPipelineDrawer from '../../components/DrawerContent/PublishPipelineDrawer';
import { useGlobalEnvironmentState } from '../../components/EnviromentDropdown';
import RemoveLogsPageItem from '../../components/MoreInfoContent/RemoveLogsPageItem';
import MoreInfoMenu from '../../components/MoreInfoMenu';
import { useGetPipelineFlow } from '../../graphql/getPipelineFlow';
import { edgeTypes, nodeTypes, useGlobalFlowState } from '../Flow';
import RunsDropdown from './RunsDropdown';
import StatusChips from './StatusChips';
import Timer from './Timer';

const View = () => {
    // Hooks
    const theme = useTheme();
    const history = useHistory();
    const { state: pipeline } = useLocation();
    const getPipelineFlow = useGetPipelineFlowHook(pipeline);

    // URI parameter
    const { pipelineId } = useParams();

    // Global states
    const FlowState = useGlobalFlowState();

    // Page states
    const [isOpenPublishDrawer, setIsOpenPublishDrawer] = useState(false);
    const [, setIsLoadingFlow] = useState(true);

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
    const [panOnDrag, setPanOnDrag] = useState(FlowState.isPanEnable.get());

    useEffect(() => {
        setPanOnDrag(FlowState.isPanEnable.get());

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [FlowState.isPanEnable.get()]);

    // Fetch previous elements
    useEffect(() => {
        // const prevElements = FlowState.elements.get();
        // setElements([...prevElements]);

        setIsLoadingFlow(false);

        if (!pipeline || Object.keys(pipeline).length === 0) {
            history.push('/');
            return null;
        }
        document.querySelector('#root div').scrollTo(0, 0);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        getPipelineFlow(Environment.id.get(), setElements);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [FlowState.isEditorPage.get()]);

    // Trigger the scale button on keyboard 's' key click
    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleKeyDown = (e) => {
        if (e.keyCode === 83) {
            onZoomActive();
        }
    };

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
    const onConnectStart = () => {
        FlowState.isDragging.set(true);
        document.body.style.cursor = 'grabbing';
    };
    const onConnectEnd = () => {
        FlowState.isDragging.set(false);
        document.body.style.cursor = 'default';
    };
    const onMoveStart = (flow) => {
        FlowState.scale.set(flow.zoom);
    };
    const onMoveEnd = (flow) => {
        FlowState.scale.set(flow.zoom);
    };
    const onZoomActive = () => {
        FlowState.isPanEnable.set(!panOnDrag);

        if (panOnDrag) {
            document.body.style.cursor = 'default';
        } else {
            document.body.style.cursor = 'move';
        }
    };

    return (
        <Box className="page" height="calc(100vh - 100px)" minHeight="min-content">
            <Box ref={offsetRef}>
                <Grid container alignItems="center" justifyContent="space-between" wrap="nowrap">
                    <Box display="flex" alignItems="center">
                        <Typography component="h2" variant="h2" color="text.primary">
                            Pipelines {'>'} {pipeline?.name}
                        </Typography>

                        <Grid display="flex">
                            <Box display="flex" alignItems="center" ml={4} mr={2}>
                                <Box height={16} width={16} backgroundColor={pipeline?.online ? 'status.pipelineOnlineText' : 'error.main'} borderRadius="100%"></Box>
                                <Typography ml={1} fontSize={16} color={pipeline?.online ? 'status.pipelineOnlineText' : 'error.main'}>
                                    {pipeline?.online ? 'Online' : 'Offline'}
                                </Typography>
                            </Box>

                            <Box sx={{ top: '0', right: '0' }}>
                                <MoreInfoMenu iconHorizontal>
                                    <RemoveLogsPageItem />
                                </MoreInfoMenu>
                            </Box>
                        </Grid>
                    </Box>
                </Grid>

                <Grid mt={4} container alignItems="center" sx={{ width: { xl: '88%' }, flexWrap: 'nowrap' }}>
                    {/* Status Chips */}
                    <StatusChips />

                    {/* Runs dropdown */}
                    <RunsDropdown environmentID={Environment.id.get()} setElements={setElements} />

                    <Button variant="contained" onClick={handleGoToEditorPage} sx={{ ml: 2, mr: 2 }}>
                        Edit
                    </Button>

                    {/* Timer */}
                    {FlowState.elements.get().length > 0 ? <Timer environmentID={Environment.id.get()} /> : null}
                </Grid>
            </Box>

            <Box mt={7} sx={{ position: 'absolute', top: offsetHeight, left: 0, right: 0, bottom: 0 }} ref={reactFlowWrapper}>
                {elements && elements.length > 0 ? (
                    <ReactFlowProvider>
                        <ReactFlow
                            zoomOnScroll={false}
                            zoomOnPinch={false}
                            paneMoveable={panOnDrag || false}
                            onMoveStart={onMoveStart}
                            onMoveEnd={onMoveEnd}
                            nodeTypes={nodeTypes}
                            elements={elements}
                            nodesDraggable={false}
                            nodesConnectable={false}
                            preventScrolling={false}
                            onLoad={onLoad}
                            onConnect={onConnect}
                            onConnectStart={onConnectStart}
                            onConnectEnd={onConnectEnd}
                            connectionLineComponent={CustomLine}
                            edgeTypes={edgeTypes}
                            arrowHeadColor={theme.palette.mode === 'dark' ? '#fff' : '#222'}
                            snapToGrid={true}
                            snapGrid={[15, 15]}>
                            <Controls style={{ left: 'auto', right: 10 }}>
                                <ControlButton onClick={onZoomActive} style={{ border: `1px solid ${FlowState.isPanEnable.get() ? '#72B842' : 'transparent'}` }}>
                                    <Box component={FontAwesomeIcon} icon={faExpandArrowsAlt} sx={{ color: FlowState.isPanEnable.get() ? '#72B842' : '' }} />
                                </ControlButton>
                            </Controls>
                        </ReactFlow>
                    </ReactFlowProvider>
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

export default View;

// ------ Custom hooks
const useGetPipelineFlowHook = (pipeline) => {
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
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            setElements(response);
            FlowState.elements.set(response);
        }
    };
};

// ----- Utility functions
export function prepareInputForFrontend(input) {
    const edgesInput = [];
    const nodesInput = [];

    if (input && Object.keys(input).length > 0) {
        for (const edge of input.edges) {
            edgesInput.push({
                source: edge.from,
                sourceHandle: edge.meta.sourceHandle,
                target: edge.to,
                targetHandle: edge.meta.targetHandle,
                type: edge.meta.edgeType,
                arrowHeadType: edge.meta.arrowHeadType,
                id: edge.edgeID,
            });
        }

        for (const node of input.nodes) {
            let data = {
                ...node.meta?.data,
                name: node.name,
                description: node.description,
                workerGroup: node.workerGroup,
                commands: node.commands,
            };
            nodesInput.push({
                id: node.nodeID,
                type: node.nodeTypeDesc + 'Node',
                position: {
                    x: node.meta.position.x,
                    y: node.meta.position.y,
                },
                data,
            });
        }
    }

    return [...edgesInput, ...nodesInput];
}
