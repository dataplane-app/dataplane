import { useTheme } from '@emotion/react';
import { Box, Button, Drawer, Grid, Typography } from '@mui/material';
import { useCallback, useEffect, useRef, useState } from 'react';
import ReactFlow, { addEdge, ControlButton, Controls, getConnectedEdges, isEdge, ReactFlowProvider, removeElements } from 'react-flow-renderer';
import { useHistory, useLocation, useParams } from 'react-router-dom';
import ApiNode from '../components/CustomNodesContent/ApiNode';
import PythonNode from '../components/CustomNodesContent/PythonNode';
import BashNode from '../components/CustomNodesContent/BashNode';
import CustomEdge from '../components/CustomNodesContent/CustomEdge';
import CustomLine from '../components/CustomNodesContent/CustomLine';
import PlayNode from '../components/CustomNodesContent/PlayNode';
import ScheduleNode from '../components/CustomNodesContent/ScheduleNode';
import AddCommandDrawer from '../components/DrawerContent/EditorDrawers/AddCommandDrawer';
import EditorSidebar from '../components/EditorSidebar';
import { Downgraded } from '@hookstate/core';
import ProcessTypeDrawer from '../components/DrawerContent/ProcessTypeDrawer';
import ScheduleDrawer from '../components/DrawerContent/SchedulerDrawer';
import CheckpointNode from '../components/CustomNodesContent/CheckpointNode';
import { useSnackbar } from 'notistack';
import APITRiggerDrawer from '../components/DrawerContent/EditorDrawers/APITriggerDrawer';
import { useAddUpdatePipelineFlow } from '../graphql/addUpdatePipelineFlow';
import { useGlobalEnvironmentState } from '../components/EnviromentDropdown';
import { faExpandArrowsAlt } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { createState, useState as useHookState } from '@hookstate/core';
import { useGlobalAuthState } from '../Auth/UserAuth';
import { useGlobalRunState } from './View/useWebSocket';

export const globalFlowState = createState({
    isRunning: false,
    isOpenSchedulerDrawer: false,
    isOpenConfigureDrawer: false,
    isOpenCommandDrawer: false,
    isOpenLogDrawer: false,
    isOpenAPIDrawer: false,
    isOpenTurnOffPipelineDrawer: false,
    isEditorPage: false,
    selectedElement: null,
    elements: [],
    triggerDelete: 1,
    isDragging: false,
    isPanEnable: false,
    scale: 1,
    selectedEdge: null,
});

export const useGlobalFlowState = () => useHookState(globalFlowState);

export const INITIAL_NODE_X_POSITION = 30;
export const nodeTypes = {
    scheduleNode: ScheduleNode,
    playNode: PlayNode,
    apiNode: ApiNode,
    pythonNode: PythonNode,
    bashNode: BashNode,
    checkpointNode: CheckpointNode,
};
export const edgeTypes = {
    custom: CustomEdge,
};

const useAddUpdatePipelineFlowfunc = () => {
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
    const { state: pipeline } = useLocation();
    const { enqueueSnackbar } = useSnackbar();

    const updatePipelineFlow = useAddUpdatePipelineFlowfunc();
    const authState = useGlobalAuthState();
    const jwt = authState.authToken.get();

    useEffect(() => {
        if (!pipeline || Object.keys(pipeline).length === 0) {
            history.push('/');
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
        RunState.set({ pipelineRunsTrigger: 1 });

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [FlowState.selectedEdge.get()]);

    // Local state to detect unsaved changes
    const [initialState] = useState(JSON.parse(JSON.stringify(FlowState.elements.get())));

    // Fetch previous elements
    useEffect(() => {
        const prevElements = FlowState.elements.attach(Downgraded).get();
        FlowState.isEditorPage.set(true);

        console.log('FLOWWW: ', FlowState.attach(Downgraded).get());

        setElements([...prevElements]);
        setIsLoadingFlow(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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
            onPanActive();
        }
    };

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
            RunState.run_id.set(0);
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
                data: type.nodeData,
            };

            setElements((es) => es.concat(newNode));

            if (type.nodeType === 'pythonNode' || type.nodeType === 'bashNode') {
                FlowState.selectedElement.set(newNode);
                setSelectedElement(newNode);
                FlowState.isOpenConfigureDrawer.set(true);
            }

            if (type.nodeType === 'scheduleNode') {
                FlowState.selectedElement.set(newNode);
                setSelectedElement(newNode);
                FlowState.isOpenSchedulerDrawer.set(true);
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
                    environmentID={Environment.id.get()}
                    handleClose={() => FlowState.isOpenConfigureDrawer.set(false)}
                    workerGroup={pipeline?.workerGroup}
                />
            </Drawer>

            <Drawer
                hideBackdrop
                sx={{ width: 'calc(100% - 203px)', [`& .MuiDrawer-paper`]: { width: 'calc(100% - 203px)', top: 82 } }}
                anchor="right"
                open={FlowState.isOpenSchedulerDrawer.get()}
                onClose={() => FlowState.isOpenSchedulerDrawer.set(false)}>
                <ScheduleDrawer
                    handleClose={() => FlowState.isOpenSchedulerDrawer.set(false)} //
                    // environmentID={Environment.id.get()}
                    // pipelineID={pipeline.pipelineID}
                    setElements={setElements}
                />
            </Drawer>

            <Drawer anchor="right" open={FlowState.isOpenAPIDrawer.get()} onClose={() => FlowState.isOpenAPIDrawer.set(false)}>
                <APITRiggerDrawer handleClose={() => FlowState.isOpenAPIDrawer.set(false)} />
            </Drawer>
        </Box>
    );
};

export default Flow;

// ----- Utility function
function prepareInputForBackend(input) {
    const nodesInput = [];
    const edgesInput = [];

    console.log('INOUTTTTT: ', input);

    const nodeDictionary = {
        playNode: 'trigger',
        scheduleNode: 'trigger',
        apiNode: 'trigger',
        pythonNode: 'process',
        bashNode: 'process',
        checkpointNode: 'checkpoint',
    };

    for (const iterator of input) {
        if (iterator.type === 'pythonNode' || iterator.type === 'bashNode') {
            const { name, description, triggerOnline, workerGroup, commands, ...data } = iterator.data;
            nodesInput.push({
                nodeID: iterator.id,
                name,
                nodeType: nodeDictionary[iterator.type],
                nodeTypeDesc: iterator.type.replace('Node', ''),
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
                        genericdata: {
                            schedule: iterator.schedule,
                            scheduleType: iterator.scheduleType,
                            timezone: iterator.timezone,
                        },
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
