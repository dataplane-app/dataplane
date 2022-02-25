import { useTheme } from '@emotion/react';
import { Box, Button, Drawer, Grid, Typography } from '@mui/material';
import { useCallback, useEffect, useRef, useState } from 'react';
import ReactFlow, { addEdge, Controls, getConnectedEdges, isEdge, removeElements } from 'react-flow-renderer';
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
import { createState, useState as useHookState, Downgraded } from '@hookstate/core';
import ProcessTypeDrawer from '../components/DrawerContent/ProcessTypeDrawer';
import ScheduleDrawer from '../components/DrawerContent/SchedulerDrawer';
import CheckpointNode from '../components/CustomNodesContent/CheckpointNode';
import { useSnackbar } from 'notistack';
import APITRiggerDrawer from '../components/DrawerContent/EditorDrawers/APITriggerDrawer';
import { useAddUpdatePipelineFlow } from '../graphql/addUpdatePipelineFlow';
import { useGlobalEnvironmentState } from '../components/EnviromentDropdown';
import { useGlobalAuthState } from '../Auth/UserAuth';

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

// Global flow states
export const globalFlowState = createState({
    isRunning: false,
    isOpenSchedulerDrawer: false,
    isOpenConfigureDrawer: false,
    isOpenCommandDrawer: false,
    isOpenAPIDrawer: false,
    isEditorPage: false,
    selectedElement: null,
    elements: [],
    triggerDelete: 1,
});
export const useGlobalFlowState = () => useHookState(globalFlowState);

const useAddUpdatePipelineFlowfunc = () => {
    // GraphQL hook
    const addUpdatePipelineFlow = useAddUpdatePipelineFlow();
    // URI parameter
    const { pipelineId } = useParams();

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    // Update pipeline flow
    return async (rawInput, environmentID) => {
        // Prepare input to match the structure in the backend
        const input = prepareInputForBackend(rawInput);

        const response = await addUpdatePipelineFlow({ input, pipelineID: pipelineId, environmentID });

        if (response.r === 'error') {
            closeSnackbar();
            enqueueSnackbar("Can't update flow: " + response.msg, { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message + ': update flow failed', { variant: 'error' }));
        } else {
            enqueueSnackbar('Success', { variant: 'success' });
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

    // URI parameter
    const { pipelineId } = useParams();

    // Page states
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

    useEffect(() => {
        if (selectedElement && FlowState.triggerDelete.get() !== 1) {
            onClickElementDelete();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [FlowState.triggerDelete.get()]);

    // Fetch previous elements
    useEffect(() => {
        const prevElements = FlowState.elements.attach(Downgraded).get();
        FlowState.isEditorPage.set(true);

        setElements([...prevElements]);
        setIsLoadingFlow(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Flow states
    const reactFlowWrapper = useRef(null);
    const [reactFlowInstance, setReactFlowInstance] = useState(null);
    const [elements, setElements] = useState([]);
    const [selectedElement, setSelectedElement] = useState(null);

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

        setSelectedElement(null);
        FlowState.selectedElement.set(null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [elements, selectedElement]);

    const onLoad = (_reactFlowInstance) => setReactFlowInstance(_reactFlowInstance);
    const onConnect = (params) => {
        setElements((els) => addEdge({ ...params, type: 'custom', arrowHeadType: 'arrowclosed' }, els));
    };

    const handleSave = useCallback(() => {
        if (reactFlowInstance) {
            const flowElements = reactFlowInstance.toObject();
            FlowState.elements.set([...flowElements.elements]);
            updatePipelineFlow(flowElements.elements, Environment.id.get());
            FlowState.isEditorPage.set(false);
            FlowState.selectedElement.set(null);
            history.push({ pathname: `/pipelines/view/${pipelineId}`, state: pipeline });
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
            return;
        }
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
                            <Button sx={{ ml: 4 }} onClick={handleSave} variant="contained">
                                Save
                            </Button>
                            <Button
                                sx={{ ml: 2 }}
                                onClick={() => {
                                    history.push('/');
                                }}
                                variant="contained">
                                Close
                            </Button>
                        </Grid>
                    </Box>
                </Grid>
            </Box>

            <EditorSidebar />

            <Box mt={7} sx={{ position: 'absolute', top: offsetHeight, left: 0, right: 0, bottom: 0 }} ref={reactFlowWrapper}>
                <ReactFlow
                    nodeTypes={nodeTypes}
                    elements={elements}
                    onLoad={onLoad}
                    onDrop={onDrop}
                    onDragOver={onDragOver}
                    onConnect={onConnect}
                    connectionLineComponent={CustomLine}
                    edgeTypes={edgeTypes}
                    onElementClick={onClickElement}
                    arrowHeadColor={theme.palette.mode === 'dark' ? '#fff' : '#222'}
                    snapToGrid={true}
                    snapGrid={[15, 15]}>
                    <Controls style={{ left: 'auto', right: 155 }} />
                    {elements.length <= 0 ? (
                        <Box sx={{ position: 'absolute', top: '40%', left: -100, right: 0, textAlign: 'center' }}>
                            <Typography>Create a pipeline by dragging the components here.</Typography>
                        </Box>
                    ) : null}
                </ReactFlow>
            </Box>

            <Drawer anchor="right" open={FlowState.isOpenCommandDrawer.get()} onClose={() => FlowState.isOpenCommandDrawer.set(false)}>
                <AddCommandDrawer handleClose={() => FlowState.isOpenCommandDrawer.set(false)} />
            </Drawer>

            <Drawer anchor="right" open={FlowState.isOpenConfigureDrawer.get()} onClose={() => FlowState.isOpenConfigureDrawer.set(false)}>
                <ProcessTypeDrawer
                    setElements={setElements}
                    environmentName={Environment.name.get()}
                    handleClose={() => FlowState.isOpenConfigureDrawer.set(false)}
                    workerGroup={pipeline.workerGroup}
                />
            </Drawer>

            <Drawer anchor="right" open={FlowState.isOpenSchedulerDrawer.get()} onClose={() => FlowState.isOpenSchedulerDrawer.set(false)}>
                <ScheduleDrawer handleClose={() => FlowState.isOpenSchedulerDrawer.set(false)} />
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
            const { name, description, workerGroup, ...data } = iterator.data;
            nodesInput.push({
                nodeID: iterator.id,
                name,
                nodeType: nodeDictionary[iterator.type],
                nodeTypeDesc: iterator.type.replace('Node', ''),
                workerGroup,
                description,
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
        } else {
            nodesInput.push({
                nodeID: iterator.id,
                name: '',
                nodeType: nodeDictionary[iterator.type],
                nodeTypeDesc: iterator.type.replace('Node', ''),
                description: '',
                workerGroup: '',
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

    return { nodesInput, edgesInput };
}
