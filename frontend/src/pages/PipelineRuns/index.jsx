import { useTheme } from '@emotion/react';
import { faExpandArrowsAlt } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Box, Drawer, Grid, Typography } from '@mui/material';
import { useSnackbar } from 'notistack';
import { useCallback, useEffect, useRef, useState } from 'react';
import ReactFlow, { ControlButton, Controls, ReactFlowProvider } from 'react-flow-renderer';
import { useParams } from 'react-router-dom';
import CustomLine from '../../components/CustomNodesContent/CustomLine';
import PublishPipelineDrawer from '../../components/DrawerContent/PublishPipelineDrawer';
import { useGlobalEnvironmentState } from '../../components/EnviromentDropdown';
import ViewPageItem from '../../components/MoreInfoContent/ViewPageItem';
import MoreInfoMenu from '../../components/MoreInfoMenu';
import { useGlobalPipelineRun } from './GlobalPipelineRunUIState';
import LogsDrawer from '../../components/DrawerContent/LogsDrawer';
import CustomChip from '../../components/CustomChip';
import { useGetPipeline } from '../../graphql/getPipeline';
import { Analytics } from './Analytics';
import { Downgraded } from '@hookstate/core';
import RunNavBar from './RunNavBar';
import { useGlobalRunState } from './GlobalRunState';

import { edgeTypes, nodeTypes } from './NodeTypes';
import TurnOffPipelineDrawerRunPipeline from '../../components/DrawerContent/TurnOffPipelineDrawerRunPipeline';
import ScheduleDrawer from '../../components/DrawerContent/SchedulerDrawerRunPage';
import { useGlobalFlowState } from '../PipelineEdit';
import ProcessTypeDrawer from '../../components/DrawerContent/ProcessTypeDrawerRunPage';

const View = () => {
    // Retrieve global environments from drop down - selected environment ID
    const Environment = useGlobalEnvironmentState();

    // Hooks
    const theme = useTheme();

    // Local state for Pipeline comes from GraphQL getPipeline
    const [pipeline, setPipeline] = useState(null);

    // Get the name and status of name and title at top of page
    // This calls the getPipeline to get the pipeline details for this specific pipeline
    const getPipeline = useGetPipelineHook(Environment.id.get(), setPipeline);

    // Global states
    // Flowstate = graph structure, elements contain the actual structure
    // Runstate = run updates on graph structure
    const FlowState = useGlobalPipelineRun();
    const RunState = useGlobalRunState();
    const DrawerState = useGlobalFlowState();

    // On page load, clear the global run state
    useEffect(() => {
        RunState.set({
            selectedRunID: null,
            runObject: null,
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        return () => {
            FlowState.elements.set([]);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Page states
    const [isOpenPublishDrawer, setIsOpenPublishDrawer] = useState(false);
    const [, setIsLoadingFlow] = useState(true);
    const [isOpenAnalytics, setIsOpenAnalytics] = useState(false);

    //Offset states and refs
    const [offsetHeight, setOffsetHeight] = useState(0);
    const offsetRef = useRef(null);

    useEffect(() => {
        setOffsetHeight(offsetRef.current.clientHeight);
    }, [offsetRef]);

    // Flow states
    const reactFlowWrapper = useRef(null);
    const [, setReactFlowInstance] = useState(null);
    const [panOnDrag, setPanOnDrag] = useState(FlowState.isPanEnable.get());

    useEffect(() => {
        setPanOnDrag(FlowState.isPanEnable.get());

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [FlowState.isPanEnable.get()]);

    // Fetch previous elements on load
    useEffect(() => {
        if (!Environment.id.get()) return;
        setIsLoadingFlow(false);
        getPipeline();

        document.querySelector('#root div').scrollTo(0, 0);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [Environment.id.get()]);

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

    //Flow methods
    const onLoad = (_reactFlowInstance) => setReactFlowInstance(_reactFlowInstance);

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

    const onClickElement = useCallback((event, element) => {
        FlowState.selectedElement.set(element);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <Box className="page" height="calc(100vh - 136px)" minHeight="min-content">
            <Box ref={offsetRef}>
                <Grid container alignItems="center" justifyContent="space-between" wrap="nowrap">
                    <Box display="flex" alignItems="center">
                        <Typography component="h2" variant="h2" color="text.primary">
                            Pipelines {'>'} {pipeline?.name}
                        </Typography>

                        <Grid display="flex">
                            <Box display="flex" alignItems="center" ml={4} mr={2}>
                                {pipeline?.online ? <CustomChip label={'Online'} customColor="green" /> : <CustomChip label="Offline" customColor="red" />}
                            </Box>

                            <Box sx={{ top: '0', right: '0' }}>
                                <MoreInfoMenu iconHorizontal>
                                    <ViewPageItem pipeline={pipeline} isPipelineOnline={pipeline?.online} getPipeline={getPipeline} setIsOpenAnalytics={setIsOpenAnalytics} />
                                </MoreInfoMenu>
                            </Box>
                        </Grid>
                    </Box>
                </Grid>

                {/* Run navbar includes --- Run/Stop button, Chips, Dropdown, Timer */}
                <Grid mt={4} container alignItems="center" sx={{ width: { xl: '88%' }, flexWrap: 'nowrap' }}>
                    {/* <WebsocketConnect /> */}

                    {Environment.id.get() && pipeline ? <RunNavBar environmentID={Environment.id.get()} pipeline={pipeline} /> : null}
                </Grid>
            </Box>
            {!FlowState.isOpenLogDrawer.get() && !isOpenAnalytics ? (
                <Box mt={15} sx={{ position: 'absolute', top: offsetHeight, left: 0, right: 0, bottom: 0 }} ref={reactFlowWrapper}>
                    {FlowState.elements.get()?.length > 0 ? (
                        <ReactFlowProvider>
                            <ReactFlow
                                zoomOnScroll={false}
                                zoomOnPinch={false}
                                paneMoveable={panOnDrag || false}
                                onMoveStart={onMoveStart}
                                onMoveEnd={onMoveEnd}
                                nodeTypes={nodeTypes}
                                elements={FlowState.elements.attach(Downgraded).get()}
                                defaultZoom={FlowState.scale.get()}
                                nodesDraggable={false}
                                nodesConnectable={false}
                                preventScrolling={false}
                                onLoad={onLoad}
                                onElementClick={onClickElement}
                                onConnectStart={onConnectStart}
                                onConnectEnd={onConnectEnd}
                                connectionLineComponent={CustomLine}
                                edgeTypes={edgeTypes}
                                arrowHeadColor={theme.palette.mode === 'dark' ? '#fff' : '#222'}
                                snapToGrid={true}
                                snapGrid={[15, 15]}>
                                <Controls style={{ left: 'auto', right: 10, bottom: 50 }}>
                                    <ControlButton onClick={onZoomActive} style={{ border: `1px solid ${FlowState.isPanEnable.get() ? '#72B842' : 'transparent'}` }}>
                                        <Box component={FontAwesomeIcon} icon={faExpandArrowsAlt} sx={{ color: FlowState.isPanEnable.get() ? '#72B842' : '' }} />
                                    </ControlButton>
                                </Controls>
                                <Box sx={{ position: 'absolute', left: 'auto', right: 10, bottom: 10 }}>
                                    <Typography fontSize={12}>Scale {Math.floor((FlowState.scale.get() || 1) * 100)}%</Typography>
                                </Box>
                            </ReactFlow>
                        </ReactFlowProvider>
                    ) : null}
                </Box>
            ) : null}

            {isOpenAnalytics ? <Analytics setIsOpenAnalytics={setIsOpenAnalytics} /> : null}
            <Drawer anchor="right" open={isOpenPublishDrawer} onClose={() => setIsOpenPublishDrawer(!isOpenPublishDrawer)}>
                <PublishPipelineDrawer handleClose={() => setIsOpenPublishDrawer(false)} />
            </Drawer>
            <Drawer
                hideBackdrop
                sx={{
                    width: 'calc(100% - 203px)',
                    height: 'calc(100% - 82px)',
                    [`& .MuiDrawer-paper`]: { width: 'calc(100% - 203px)', top: 82, height: 'calc(100% - 82px)', background: '#222', paddingBottom: 2 },
                }}
                anchor="right"
                open={FlowState.isOpenLogDrawer.get()}
                onClose={() => FlowState.isOpenLogDrawer.set(false)}>
                <LogsDrawer handleClose={() => FlowState.isOpenLogDrawer.set(false)} environmentId={Environment.id.get()} />
            </Drawer>
            <Drawer anchor="right" open={FlowState.isOpenTurnOffPipelineDrawer.get()} onClose={() => FlowState.isOpenTurnOffPipelineDrawer.set(false)}>
                <TurnOffPipelineDrawerRunPipeline
                    handleClose={() => FlowState.isOpenTurnOffPipelineDrawer.set(false)} //
                    pipelineID={pipeline?.pipelineID}
                    environmentID={pipeline?.environmentID}
                    name={pipeline?.name}
                    getPipelines={getPipeline}
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
                    environmentId={Environment.id.get()}
                    getPipeline={getPipeline}
                />
            </Drawer>

            <Drawer anchor="right" open={DrawerState.isOpenConfigureDrawer.get()} onClose={() => DrawerState.isOpenConfigureDrawer.set(false)}>
                <ProcessTypeDrawer //
                    environmentID={Environment.id.get()}
                    handleClose={() => DrawerState.isOpenConfigureDrawer.set(false)}
                    workerGroup={pipeline?.workerGroup}
                />
            </Drawer>
        </Box>
    );
};

export default View;

// ------ Custom hooks
// To get the the name and title at the top of page and the staus - online / offline.
export const useGetPipelineHook = (environmentID, setPipeline) => {
    // GraphQL hook
    // Calls getPipeline graphql to get this specific pipeline
    const getPipeline = useGetPipeline();

    // URI parameter
    const { pipelineId } = useParams();

    const FlowState = useGlobalPipelineRun();

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    // Get pipeline data
    return async () => {
        const response = await getPipeline({ pipelineID: pipelineId, environmentID });

        if (response.r || response.error) {
            closeSnackbar();
            enqueueSnackbar("Can't get pipeline: " + (response.msg || response.r || response.error), { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            // Set local pipeline state
            setPipeline(response);

            // Set global pipeline state
            FlowState.pipelineInfo.set(response);
        }
    };
};
