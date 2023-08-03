import { useTheme } from '@emotion/react';
import { Box, Button, Drawer, Grid, Typography } from '@mui/material';
import { useCallback, useEffect, useRef, useState } from 'react';
import ReactFlow, { addEdge, ControlButton, Controls, getConnectedEdges, isEdge, ReactFlowProvider, removeElements, isNode } from 'react-flow-renderer';
import { useHistory, useParams } from 'react-router-dom';
import ApiNode from '../components/pipeline/CustomNodesContent/ApiNode';
import PythonNode from '../components/pipeline/CustomNodesContent/PythonNode';
import RpaNode from '../components/pipeline/CustomNodesContent/RpaNode';
import BashNode from '../components/pipeline/CustomNodesContent/BashNode';
import CustomEdge from '../components/pipeline/CustomNodesContent/CustomEdge';
import CustomLine from '../components/pipeline/CustomNodesContent/CustomLine';
import PlayNode from '../components/pipeline/CustomNodesContent/PlayNode';
import ScheduleNode from '../components/pipeline/CustomNodesContent/ScheduleNode';
import AddCommandDrawer from '../components/DrawerContent/EditorDrawers/AddCommandDrawer';
import EditorSidebar from '../components/EditorSidebar';
import { Downgraded } from '@hookstate/core';
import ProcessTypeDrawer from '../components/DrawerContent/ProcessTypeDrawer';
import ScheduleDrawer from '../components/DrawerContent/SchedulerDrawer';
import CheckpointNode from '../components/pipeline/CustomNodesContent/CheckpointNode';
import { useSnackbar } from 'notistack';
import APITRiggerDrawer from '../components/DrawerContent/EditorDrawers/APITriggerDrawer';
import { useAddUpdatePipelineFlow } from '../graphql/addUpdatePipelineFlow';
import { useGlobalEnvironmentState } from '../components/EnviromentDropdown';
import { faExpandArrowsAlt, faPen, faProjectDiagram } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { createState, useState as useHookState } from '@hookstate/core';
import { useGlobalAuthState } from '../Auth/UserAuth';
import { useGetPipelineFlow } from '../graphql/getPipelineFlow';
import UpdatePipelineDrawer from '../components/DrawerContent/UpdatePipelineDrawer';
import { useGetPipeline } from '../graphql/getPipeline';
import { useGlobalRunState } from './PipelineRuns/GlobalRunState';
import { prepareInputForFrontend } from '../utils/PipelinePrepareGraphInput';
import dagre from 'dagre';
import RpaDrawer from '../components/DrawerContent/RpaDrawer';

export const globalFlowState = createState({
    isRunning: false,
    isOpenSchedulerDrawer: false,
    isOpenConfigureDrawer: false,
    isOpenRpaDrawer: false,
    isOpenCommandDrawer: false,
    isOpenLogDrawer: false,
    isOpenDepLogDrawer: false,
    isOpenAPIDrawer: false,
    isOpenTurnOffDeploymentDrawer: false,
    isOpenTurnOffPipelineDrawer: false,
    isOpenDuplicatePipelineDrawer: false,
    isOpenUpdatePipelineDrawer: false,
    isEditorPage: false,
    selectedElement: null,
    elements: [],
    triggerDelete: 1,
    isDragging: false,
    isPanEnable: false,
    scale: 1,
    selectedEdge: null,
    pipelineInfo: null,
});

export const useGlobalFlowState = () => useHookState(globalFlowState);

export const INITIAL_NODE_X_POSITION = 30;
export const nodeTypes = {
    scheduleNode: ScheduleNode,
    playNode: PlayNode,
    apiNode: ApiNode,
    pythonNode: PythonNode,
    rpaNode: RpaNode,
    bashNode: BashNode,
    checkpointNode: CheckpointNode,
};
export const edgeTypes = {
    custom: CustomEdge,
};

const useAddUpdatePipelineFlowHook = () => {
    // GraphQL hook
    const addUpdatePipelineFlow = useAddUpdatePipelineFlow();

    // URI parameter
    const { pipelineId } = useParams();

    // React router
    const history = useHistory();

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    // Update pipeline flow
    return async (rawInput, environmentID, pipeline) => {
        // Prepare input to match the structure in the backend
        const input = prepareInputForBackend(rawInput);

        const response = await addUpdatePipelineFlow({ input, pipelineID: pipelineId, environmentID });

        if (response.r === 'Unauthorized') {
            closeSnackbar();
            enqueueSnackbar(`Can't update flow: ${response.r}`, { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            enqueueSnackbar('Success', { variant: 'success' });
            history.push({ pathname: `/pipelines/view/${pipelineId}`, state: pipeline });
        }
    };
};

const Flow = () => {
    // Hooks
    const theme = useTheme();
    const history = useHistory();
    const { enqueueSnackbar } = useSnackbar();

    // Auth state for dependency array
    const authState = useGlobalAuthState();
    const jwt = authState.authToken.get();

    useEffect(() => {
        if (!pipeline || Object.keys(pipeline).length === 0) {
            // history.push('/');
            return null;
        }
        document.querySelector('#root div').scrollTo(0, 0);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Page states
    const [, setIsLoadingFlow] = useState(true);

    // Global states
    const FlowState = useGlobalFlowState();
    const RunState = useGlobalRunState();
    const Environment = useGlobalEnvironmentState();

    // Local state
    const [pipeline, setPipeline] = useState(null);

    // Graphql Hooks
    const getPipeline = useGetPipelineHook(Environment.id.get(), setPipeline);
    const getPipelineFlow = useGetPipelineFlowHook(Environment.id.get(), pipeline);
    const updatePipelineFlow = useAddUpdatePipelineFlowHook();

    //Offset states and refs
    const [offsetHeight, setOffsetHeight] = useState(0);
    const offsetRef = useRef(null);

    useEffect(() => {
        setOffsetHeight(offsetRef.current.clientHeight);
    }, [offsetRef]);

    useEffect(() => {
        if (selectedElement && FlowState.triggerDelete.get() !== 1) {
            onClickElementDelete();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [FlowState.triggerDelete.get()]);

    // Delete an edge
    useEffect(() => {
        console.log('Triggering this: ', FlowState.selectedEdge.get());
        const edgesToRemove = elements.filter((el) => el.id === FlowState.selectedEdge.attach(Downgraded).get());

        if (edgesToRemove && edgesToRemove.length > 0) {
            onElementsRemove([...edgesToRemove]);
            FlowState.selectedEdge.set(null);
            return;
        }

        // Clear RunState to remove node colors on load
        RunState.set({
            selectedRunID: null,
            runIDs: null,
            runTrigger: 0,
            onLoadTrigger: 0,
            onChangeTrigger: 0,
            node_id: null,
        });

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [FlowState.selectedEdge.get()]);

    // Local state to detect unsaved changes
    const [initialState, setInitialState] = useState(JSON.parse(JSON.stringify(FlowState.elements.get())));

    // Fetch previous elements
    useEffect(() => {
        if (Environment.id.get() === '') return;

        getPipeline();
        const prevElements = FlowState.elements.attach(Downgraded).get();
        FlowState.isEditorPage.set(true);

        setElements([...prevElements]);
        setIsLoadingFlow(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [Environment.id.get()]);

    useEffect(() => {
        if (!pipeline) return;
        getPipelineFlow(Environment.id.get(), setElements, setInitialState);

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pipeline]);

    // Flow states
    const reactFlowWrapper = useRef(null);
    const [reactFlowInstance, setReactFlowInstance] = useState(null);
    const [elements, setElements] = useState([]);
    const [selectedElement, setSelectedElement] = useState(null);
    const [panOnDrag, setPanOnDrag] = useState(FlowState.isPanEnable.get());
    const [isUnsavedWithChanges, setIsUnsavedWithChanges] = useState(false);

    useEffect(() => {
        if (!FlowState.isPanEnable.get()) {
            setPanOnDrag(false);
        } else {
            setPanOnDrag(FlowState.isPanEnable.get());
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [FlowState.isPanEnable.get()]);

    // Check for unsaved changes
    useEffect(() => {
        if (!initialState) return;

        if (object_equals(elements, initialState)) {
            setIsUnsavedWithChanges(false);
        } else {
            setIsUnsavedWithChanges(true);
        }
    }, [elements, initialState]);

    //Flow methods
    const onElementsRemove = (elementsToRemove) => setElements((els) => removeElements(elementsToRemove, els));
    const onClickElement = useCallback((event, element) => {
        FlowState.selectedElement.set(element);
        // Set the clicked element in local state
        setSelectedElement([element]);

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    const onClickElementDelete = useCallback(() => {
        // Get all edges for the flow
        const edges = elements.filter((element) => isEdge(element));
        // Get edges connected to selected node
        const edgesToRemove = getConnectedEdges(selectedElement, edges);
        onElementsRemove([...selectedElement, ...edgesToRemove]);

        if (edgesToRemove.length !== 0) {
            // Array of all the sources connected to the deleted element
            const sourcesID = edgesToRemove.map((edge) => edge.source);

            const remaingElements = FlowState.elementsWithConnection
                .attach(Downgraded)
                .get()
                ?.filter((el) => !sourcesID.includes(el));

            FlowState.elementsWithConnection.set(remaingElements);
        }

        setSelectedElement(null);
        FlowState.selectedElement.set(null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [elements, selectedElement]);

    const onLoad = (_reactFlowInstance) => setReactFlowInstance(_reactFlowInstance);
    const onConnect = (params) => {
        setElements((els) => addEdge({ ...params, type: 'custom', arrowHeadType: 'arrowclosed' }, els));
    };
    const onConnectStart = () => {
        FlowState.isDragging.set(true);
        document.body.style.cursor = 'grabbing';
    };
    const onConnectEnd = () => {
        FlowState.isDragging.set(false);
        document.body.style.cursor = 'default';
        const flowElements = reactFlowInstance.toObject();
        setElements([...flowElements.elements]);
    };
    const onMoveStart = (flow) => {
        FlowState.scale.set(flow.zoom);
    };
    const onMoveEnd = (flow) => {
        FlowState.scale.set(flow.zoom);
    };
    const onNodeDragStop = (flow) => {
        FlowState.scale.set(flow.zoom);
        const flowElements = reactFlowInstance.toObject();
        setElements([...flowElements.elements]);
    };

    const onPanActive = () => {
        FlowState.isPanEnable.set(!panOnDrag);

        if (panOnDrag) {
            document.body.style.cursor = 'default';
        } else {
            document.body.style.cursor = 'move';
        }
    };

    const handleSave = useCallback(() => {
        if (reactFlowInstance) {
            const flowElements = reactFlowInstance.toObject();
            FlowState.elements.set([...flowElements.elements]);
            updatePipelineFlow(flowElements.elements, Environment.id.get(), pipeline);
            FlowState.isEditorPage.set(false);
            FlowState.selectedElement.set(null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [reactFlowInstance, jwt]);

    // const handleSave = () => {
    //     if (reactFlowInstance) {
    //         const flowElements = reactFlowInstance.toObject();
    //         FlowState.elements.set([...flowElements.elements]);
    //         updatePipelineFlow(flowElements.elements, Environment.id.get());
    //         FlowState.isEditorPage.set(false);
    //         FlowState.selectedElement.set(null);
    //         history.goBack();
    //     }
    //     // eslint-disable-next-line react-hooks/exhaustive-deps
    // };

    const onDragOver = (event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    };
    const onDrop = (event) => {
        event.preventDefault();

        const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
        const type = JSON.parse(event.dataTransfer.getData('application/reactflow'));
        const position = reactFlowInstance.project({
            x: event.clientX - reactFlowBounds.left,
            y: event.clientY - reactFlowBounds.top,
        });

        if (elements.filter((el) => el.type === type.nodeType).length > 0 && (type.nodeType === 'playNode' || type.nodeType === 'scheduleNode' || type.nodeType === 'apiNode')) {
            enqueueSnackbar('Only one instance of this element is possible.', { variant: 'error' });
            return;
        } else {
            const newNode = {
                id: `${type.id}`,
                type: type.nodeType,
                position,
                data: { ...type.nodeData, name: nameGenerator(elements, type.nodeData.name) },
            };

            setElements((es) => es.concat(newNode));

            if (type.nodeType === 'pythonNode' || type.nodeType === 'bashNode') {
                FlowState.selectedElement.set(newNode);
                setSelectedElement(newNode);
                FlowState.isOpenConfigureDrawer.set(true);
            }

            if (type.nodeType === 'rpaNode') {
                FlowState.selectedElement.set(newNode);
                setSelectedElement(newNode);
                FlowState.isOpenRpaDrawer.set(true);
            }

            if (type.nodeType === 'scheduleNode') {
                FlowState.selectedElement.set(newNode);
                setSelectedElement(newNode);
                FlowState.isOpenSchedulerDrawer.set(true);
            }

            if (type.nodeType === 'apiNode') {
                FlowState.selectedElement.set(newNode);
                setSelectedElement(newNode);
                FlowState.isOpenAPIDrawer.set(true);
            }
            return;
        }
    };

    return (
        <Box className="page" height="calc(100vh - 136px)" minHeight="min-content">
            <Box ref={offsetRef}>
                <Grid container alignItems="center" justifyContent="space-between" wrap="nowrap">
                    <Box display="flex" alignItems="center" width="calc(100% - 145px)">
                        <Typography component="h2" variant="h2" color="text.primary">
                            Pipelines {'>'} {pipeline?.name}
                        </Typography>

                        <Button sx={{ py: '10px', color: 'gray', borderColor: 'transparent' }} onClick={() => FlowState.isOpenUpdatePipelineDrawer.set(true)} variant="text">
                            <Box component={FontAwesomeIcon} icon={faPen} />
                        </Button>

                        {isUnsavedWithChanges ? <UnsavedChangesIndicator /> : null}

                        <Grid display="flex" alignItems="flex-start" marginLeft="auto">
                            <Button sx={{ ml: 4 }} onClick={handleSave} variant="contained">
                                Save
                            </Button>
                            <Button
                                sx={{ ml: 2 }}
                                onClick={() => {
                                    if (elements.length === 0) {
                                        history.push('/');
                                        return null;
                                    } else {
                                        FlowState.isEditorPage.set(false);
                                        history.push({ pathname: `/pipelines/view/${pipeline.pipelineID}`, state: pipeline });
                                    }
                                }}
                                variant="text">
                                Close
                            </Button>
                        </Grid>
                    </Box>
                </Grid>
            </Box>

            <EditorSidebar />

            <Box mt={7} sx={{ position: 'absolute', top: offsetHeight, left: 0, right: 0, bottom: 0 }} ref={reactFlowWrapper}>
                <ReactFlowProvider>
                    <ReactFlow
                        zoomOnScroll={false}
                        zoomOnPinch={false}
                        paneMoveable={panOnDrag || false}
                        onMoveStart={onMoveStart}
                        onMoveEnd={onMoveEnd}
                        defaultZoom={FlowState.scale.get()}
                        nodeTypes={nodeTypes}
                        elements={elements}
                        onLoad={onLoad}
                        onDrop={onDrop}
                        onDragOver={onDragOver}
                        onNodeDragStop={onNodeDragStop}
                        onConnect={onConnect}
                        onConnectStart={onConnectStart}
                        onConnectEnd={onConnectEnd}
                        connectionLineComponent={CustomLine}
                        edgeTypes={edgeTypes}
                        onElementClick={onClickElement}
                        arrowHeadColor={theme.palette.mode === 'dark' ? '#fff' : '#222'}
                        snapToGrid={true}
                        snapGrid={[15, 15]}>
                        <Controls style={{ left: 'auto', right: 155, bottom: 50 }}>
                            <ControlButton onClick={onPanActive} style={{ border: `1px solid ${FlowState.isPanEnable.get() ? '#72B842' : 'transparent'}` }}>
                                <Box component={FontAwesomeIcon} icon={faExpandArrowsAlt} sx={{ color: FlowState.isPanEnable.get() ? '#72B842' : '' }} />
                            </ControlButton>
                            <ControlButton
                                onClick={() => setElements(setAutoLayout(elements))}
                                style={{ border: `1px solid ${FlowState.isPanEnable.get() ? '#72B842' : 'transparent'}` }}>
                                <Box component={FontAwesomeIcon} icon={faProjectDiagram} />
                            </ControlButton>
                        </Controls>
                        <Box sx={{ position: 'absolute', left: 'auto', right: 155, bottom: 10 }}>
                            <Typography fontSize={12}>Scale {Math.floor((FlowState.scale.get() || 1) * 100)}%</Typography>
                        </Box>
                        {elements.length <= 0 ? (
                            <Box sx={{ position: 'absolute', top: '40%', left: -100, right: 0, textAlign: 'center' }}>
                                <Typography>Create a pipeline by dragging the components here.</Typography>
                            </Box>
                        ) : null}
                    </ReactFlow>
                </ReactFlowProvider>
            </Box>

            <Drawer anchor="right" open={FlowState.isOpenCommandDrawer.get()} onClose={() => FlowState.isOpenCommandDrawer.set(false)}>
                <AddCommandDrawer setElements={setElements} handleClose={() => FlowState.isOpenCommandDrawer.set(false)} />
            </Drawer>

            <Drawer anchor="right" open={FlowState.isOpenConfigureDrawer.get()} onClose={() => FlowState.isOpenConfigureDrawer.set(false)}>
                <ProcessTypeDrawer
                    setElements={setElements}
                    elements={elements}
                    environmentID={Environment.id.get()}
                    handleClose={() => FlowState.isOpenConfigureDrawer.set(false)}
                    workerGroup={pipeline?.workerGroup}
                />
            </Drawer>

            <Drawer
                hideBackdrop
                sx={{ width: 'calc(100% - 203px)', zIndex: 1099, [`& .MuiDrawer-paper`]: { width: 'calc(100% - 203px)', top: 82 } }}
                anchor="right"
                open={FlowState.isOpenRpaDrawer.get()}
                onClose={() => FlowState.isOpenRpaDrawer.set(false)}>
                <RpaDrawer
                    handleClose={() => FlowState.isOpenRpaDrawer.set(false)} //
                    setElements={setElements}
                    environmentID={Environment.id.get()}
                />
            </Drawer>

            <Drawer
                hideBackdrop
                sx={{ width: 'calc(100% - 203px)', zIndex: 1099, [`& .MuiDrawer-paper`]: { width: 'calc(100% - 203px)', top: 82 } }}
                anchor="right"
                open={FlowState.isOpenSchedulerDrawer.get()}
                onClose={() => FlowState.isOpenSchedulerDrawer.set(false)}>
                <ScheduleDrawer
                    handleClose={() => FlowState.isOpenSchedulerDrawer.set(false)} //
                    setElements={setElements}
                />
            </Drawer>

            <Drawer
                hideBackdrop
                sx={{ width: 'calc(100% - 203px)', zIndex: 1099, [`& .MuiDrawer-paper`]: { width: 'calc(100% - 203px)', top: 82 } }}
                anchor="right"
                open={FlowState.isOpenAPIDrawer.get()}
                onClose={() => FlowState.isOpenAPIDrawer.set(false)}>
                <APITRiggerDrawer handleClose={() => FlowState.isOpenAPIDrawer.set(false)} />
            </Drawer>

            <Drawer anchor="right" open={FlowState.isOpenUpdatePipelineDrawer.get()} onClose={() => FlowState.isOpenUpdatePipelineDrawer.set(false)}>
                <UpdatePipelineDrawer pipeline={pipeline} getPipeline={getPipeline} handleClose={() => FlowState.isOpenUpdatePipelineDrawer.set(false)} />
            </Drawer>
        </Box>
    );
};

export default Flow;

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const nodeWidth = 172;
const nodeHeight = 72;

const setAutoLayout = (elements) => {
    dagreGraph.setGraph({ rankdir: 'LR' });

    elements.forEach((el) => {
        if (isNode(el)) {
            dagreGraph.setNode(el.id, { width: nodeWidth, height: nodeHeight });
        } else {
            dagreGraph.setEdge(el.source, el.target);
        }
    });

    dagre.layout(dagreGraph);

    return elements.map((el) => {
        if (isNode(el)) {
            const nodeWithPosition = dagreGraph.node(el.id);
            el.targetPosition = 'left';
            el.sourcePosition = 'right';

            el.position = {
                x: nodeWithPosition.x - nodeWidth / 2 + Math.random() / 1000,
                y: nodeWithPosition.y - nodeHeight / 2,
            };
        }

        return el;
    });
};

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
    return async (environmentID, setElements, setInitialState) => {
        const rawResponse = await getPipelineFlow({ pipelineID: pipelineId, environmentID });
        let response = prepareInputForFrontend(rawResponse);
        // Check if 2 or more nodes are missing position
        const needsLayout = response.filter((a) => (a.position?.x === 0) & (a.position?.y === 0)).length > 1;
        if (needsLayout) {
            response = setAutoLayout(response);
        }

        if (response.length === 0) {
            FlowState.elements.set([]);
            history.push(`/pipelines/flow/${pipelineId}`);
        } else if (response.r === 'error') {
            closeSnackbar();
            enqueueSnackbar("Can't get flow: " + response.msg, { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            setElements(response);
            FlowState.elements.set(response);
            setInitialState(response);
        }
    };
};

// ------ Custom hooks
const useGetPipelineHook = (environmentID, setPipeline) => {
    // GraphQL hook
    const getPipeline = useGetPipeline();

    // URI parameter
    const { pipelineId } = useParams();

    const FlowState = useGlobalFlowState();

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    // Get members
    return async () => {
        const response = await getPipeline({ pipelineID: pipelineId, environmentID });

        if (response.r || response.error) {
            closeSnackbar();
            enqueueSnackbar("Can't get pipeline: " + (response.msg || response.r || response.error), { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            setPipeline(response);
            FlowState.pipelineInfo.set(response);
        }
    };
};

// ----- Utility function
export function prepareInputForBackend(input) {
    const nodesInput = [];
    const edgesInput = [];

    const nodeDictionary = {
        playNode: 'trigger',
        scheduleNode: 'trigger',
        apiNode: 'trigger',
        pythonNode: 'process',
        rpaNode: 'process',
        bashNode: 'process',
        checkpointNode: 'checkpoint',
    };

    for (const iterator of input) {
        if (iterator.type === 'pythonNode' || iterator.type === 'bashNode' || iterator.type === 'rpaNode') {
            const { name, description, triggerOnline, workerGroup, commands, ...data } = iterator.data;
            nodesInput.push({
                nodeID: iterator.id,
                name,
                nodeType: nodeDictionary[iterator.type],
                nodeTypeDesc: iterator.type.includes('rpa') ? 'rpa-python' : iterator.type.replace('Node', ''),
                triggerOnline,
                description,
                workerGroup,
                commands: commands || [],
                meta: {
                    position: {
                        x: iterator.position.x,
                        y: iterator.position.y,
                    },
                    data,
                },
                active: false,
            });
        } else if (iterator.type === 'custom') {
            edgesInput.push({
                edgeID: iterator.id,
                from: iterator.source,
                to: iterator.target,
                meta: {
                    edgeType: iterator.type,
                    sourceHandle: iterator.sourceHandle,
                    targetHandle: iterator.targetHandle,
                    arrowHeadType: iterator.arrowHeadType,
                },
                active: false,
            });
        } else if (iterator.type === 'scheduleNode') {
            nodesInput.push({
                nodeID: iterator.id,
                name: '',
                nodeType: nodeDictionary[iterator.type],
                nodeTypeDesc: iterator.type.replace('Node', ''),
                triggerOnline: iterator.data.triggerOnline,
                description: '',
                workerGroup: '',
                commands: [],
                meta: {
                    position: {
                        x: iterator.position.x,
                        y: iterator.position.y,
                    },
                    data: {
                        language: '',
                        genericdata: iterator.data.genericdata,
                    },
                },
                active: false,
            });
        } else {
            // Play node
            nodesInput.push({
                nodeID: iterator.id,
                name: '',
                nodeType: nodeDictionary[iterator.type],
                nodeTypeDesc: iterator.type.replace('Node', ''),
                triggerOnline: iterator.data.triggerOnline,
                description: '',
                workerGroup: '',
                commands: [],
                meta: {
                    position: {
                        x: iterator.position.x,
                        y: iterator.position.y,
                    },
                    data: null,
                },
                active: false,
            });
        }
    }

    return { nodesInput, edgesInput, json: input };
}

// Custom component
function UnsavedChangesIndicator() {
    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 13,
                fontWeight: 700,
                color: 'secondary.main',
                background: '#F8860021',
                width: 144,
                height: 35,
                borderRadius: '5px',
                ml: 4,
            }}>
            Unsaved changes
        </Box>
    );
}

// Checks if two objects are some
const object_equals = (...objects) => objects.every((obj) => JSON.stringify(sortObj(obj)) === JSON.stringify(sortObj(objects[0])));

// Sorts objects by id
const sortObj = (obj) =>
    obj.sort((a, b) => {
        let fa = a.id,
            fb = b.id;

        if (fa < fb) {
            return -1;
        }
        if (fa > fb) {
            return 1;
        }
        return 0;
    });

/**
 * Takes flow nodes on display, and returns a suitable
 * name for a new node (language name) + (next number)
 */
function nameGenerator(elements, language) {
    if (elements.length === 0) {
        return language;
    }

    // Check if language name used if not return language name
    if (!elements.some((a) => a?.data?.name === language)) {
        return language;
    }

    // Language name already used, find correct enumurator and append
    for (const key in elements) {
        const proposedName = language + ` ${Number(key) + 1}`; //?

        if (elements.some((a) => a?.data?.name === proposedName) === false) {
            return proposedName;
        }
    }
}
