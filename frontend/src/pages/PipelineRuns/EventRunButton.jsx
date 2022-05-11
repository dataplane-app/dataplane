import { useEffect, useRef } from 'react';
import ConsoleLogHelper from '../../Helper/logger';
import { useGlobalPipelineRun } from './GlobalPipelineRunUIState';
import { useGlobalRunState } from './GlobalRunState';
import { useSnackbar } from 'notistack';
import { useRunPipelines } from '../../graphql/runPipelines';
import { useGetPipelineRuns } from '../../graphql/getPipelineRuns';
import { Downgraded } from '@hookstate/core';
import { useGetPipelineFlow } from '../../graphql/getPipelineFlow';
import { prepareInputForFrontend } from '../../utils/PipelinePrepareGraphInput';

export default function EventRunButton(environmentId, pipelineId, runId, setRuns, setSelectedRun, Running, setRunning, wsconnect, ReconnectWS) {
    // Global state
    const RunState = useGlobalRunState();
    const FlowState = useGlobalPipelineRun();

    // GraphQL hook - this is the Graphql to Run the pipeline
    const runPipelines = useRunPipelines();
    const getPipelineRuns = useGetPipelineRuns();
    const getPipelineFlow = useGetPipelineFlow();

    const { enqueueSnackbar } = useSnackbar();

    // Websocket state
    const reconnectOnClose = useRef(true);

    return useEffect(() => {
        // console.log("Test: ", FlowState.isRunning.get(), Running)

        function connect() {
            // 1. Set the run state as running
            FlowState.isRunning.set(true);
            RunState.selectedRunID.set(runId);

            // Define nodes object if it hasn't been defined and set trigger node to Success
            if (RunState.runObject.get() === null) {
                // Get trigger id
                const triggerNodeId = FlowState.elements.get().filter((a) => a.type === 'scheduleNode' || a.type === 'playNode')[0].id;
                RunState.runObject.set({ nodes: { [triggerNodeId]: { status: 'Success' } } });
            }

            // 3. On websocket open - trigger run
            wsconnect.onopen = async () => {
                ConsoleLogHelper('ws opened');

                // Get pipeline flow
                const rawResponse = await getPipelineFlow({ pipelineID: pipelineId, environmentID: environmentId });
                const responseFlow = prepareInputForFrontend(rawResponse);
                if (responseFlow.length === 0) {
                    FlowState.elements.set([]);
                } else if (responseFlow.r === 'error') {
                    enqueueSnackbar("Can't get flow: " + responseFlow.msg, { variant: 'error' });
                } else if (responseFlow.errors) {
                    responseFlow.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
                } else {
                    FlowState.elements.set(responseFlow);
                }

                // Run pipeline
                let response = await runPipelines({
                    pipelineID: pipelineId,
                    environmentID: environmentId,
                    RunType: 'pipeline',
                    RunID: runId,
                });
                if (response.r || response.error) {
                    enqueueSnackbar("Can't run pipeline: " + (response.msg || response.r || response.error), { variant: 'error' });
                } else if (response.errors) {
                    response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
                } else {
                    RunState.runObject.merge({
                        runStart: response.created_at,
                        runEnd: null,
                    });
                }

                (async () => {
                    // Get a list of all pipeline runs
                    response = await getPipelineRuns({ pipelineID: pipelineId, environmentID: environmentId });

                    if (response?.length === 0) {
                        setRuns([]);
                    } else if (response.r || response.error) {
                        enqueueSnackbar("Can't get runs: " + (response.msg || response.r || response.error), { variant: 'error' });
                    } else if (response.errors) {
                        response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
                    } else {
                        setRuns(response);
                        setSelectedRun(response[0]);
                    }
                })();
            };

            wsconnect.onclose = () => {
                // Exit if closing the connection was intentional
                if (!reconnectOnClose.current) {
                    return;
                }

                if (ReconnectWS === false) {
                    return;
                }

                // Reconnect on close
                ConsoleLogHelper('ws trying to reconnect...');
                setTimeout(function () {
                    connect();
                }, 1000);
            };

            wsconnect.onmessage = (e) => {
                // ConsoleLogHelper('msg rcvd', e.data);

                const response = JSON.parse(e.data);

                // console.log("message:", response)

                // ConsoleLogHelper(
                //     '🧲',
                //     FlowState.elements.get().filter((a) => a.id === response.node_id)[0]?.data.name ||
                //         FlowState.elements.get().filter((a) => a.id === response.node_id)[0]?.type ||
                //         response.MSG,
                //     response.status
                // );

                // Add only if a node message, not MSG.
                if (response.node_id) {
                    RunState.runObject.nodes.merge({
                        [response.node_id]: {
                            status: response.status,
                            start_dt: response.start_dt,
                            end_dt: response.end_dt,
                            name: FlowState.elements.get().filter((a) => a.id === response.node_id)[0].data.name,
                            type: FlowState.elements.get().filter((a) => a.id === response.node_id)[0].type,
                            updated_by: 'websockets',
                        },
                    });
                }

                if (response.MSG === 'pipeline_complete') {
                    FlowState.isRunning.set(false);
                    RunState.runObject.runEnd.set(response.ended_at);

                    reconnectOnClose.current = false;
                    wsconnect.close();
                    setRunning(false);
                }

                if (response.status === 'Fail') {
                    const nodes = RunState.runObject.nodes.attach(Downgraded).get();

                    // console.log("n", nodes);

                    for (var key in nodes) {
                        if (nodes[key].status == 'Queue') {
                            RunState.runObject.nodes.merge({
                                [key]: {
                                    status: 'Fail',
                                    updated_by: 'failure',
                                },
                            });

                            // console.log("n", nodes[key]);
                        }
                    }

                    FlowState.isRunning.set(false);
                    RunState.runObject.runEnd.set(response.end_dt);
                    reconnectOnClose.current = false;
                    // wsconnect.close();
                    // setRunning(false)
                }
            };
        }

        if (Running === true) {
            connect();

            return () => {
                reconnectOnClose.current = false;
                wsconnect.close();
                setRunning(false);
            };
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [runId]);
}
