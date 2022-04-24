import { useEffect, useRef } from 'react';
import { useSnackbar } from 'notistack';
import { Downgraded } from '@hookstate/core';
import { useGlobalRunState } from '../../PipelineRuns/GlobalRunState';
import { useGlobalPipelineRun } from '../../PipelineRuns/GlobalPipelineRunUIState';
import { useRunPipelines } from '../../../graphql/runPipelines';
import { useGetDeploymentRuns } from '../../../graphql/getDeploymentRuns';
import ConsoleLogHelper from '../../../Helper/logger';

export default function EventRunButton(environmentId, pipelineId, runId, setRuns, setSelectedRun, Running, setRunning, wsconnect, version) {
    // Global state
    const RunState = useGlobalRunState();
    const FlowState = useGlobalPipelineRun();

    // GraphQL hook - this is the Graphql to Run the pipeline
    // Running a deployment is same as pipeline just with a deployment flag
    const runPipelines = useRunPipelines();
    const getDeploymentRuns = useGetDeploymentRuns();

    const { enqueueSnackbar } = useSnackbar();

    // Websocket state
    const reconnectOnClose = useRef(true);

    return useEffect(() => {
        // console.log("Test: ", FlowState.isRunning.get(), Running)

        function connect() {
            // 1. Set the run state as running
            FlowState.isRunning.set(true);
            RunState.selectedRunID.set(runId);

            // // Define nodes object if it hasn't been defined and set trigger node to Success
            // if (RunState.runObject.get() === null) {
            //     // Get trigger id
            //     const triggerNodeId = FlowState.elements.get().filter((a) => a.type === 'scheduleNode' || a.type === 'playNode')[0].id;
            //     RunState.runObject.set({ nodes: { [triggerNodeId]: { status: 'Success' } } });
            // }

            // 3. On websocket open - trigger run
            wsconnect.onopen = async () => {
                ConsoleLogHelper('ws opened');

                // Run pipeline
                let response = await runPipelines({
                    pipelineID: pipelineId,
                    environmentID: environmentId,
                    RunType: 'deployment',
                    RunID: runId,
                });
                if (response.r || response.error) {
                    enqueueSnackbar("Can't run deployment: " + (response.msg || response.r || response.error), { variant: 'error' });
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
                    response = await getDeploymentRuns({ deploymentID: pipelineId, environmentID: environmentId, version });

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

                ConsoleLogHelper(
                    '🧲',
                    FlowState.elements.get().filter((a) => a.id === response.node_id)[0]?.data.name ||
                        FlowState.elements.get().filter((a) => a.id === response.node_id)[0]?.type ||
                        response.MSG,
                    response.status
                );

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
