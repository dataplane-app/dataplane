import { useEffect, useRef } from 'react';
import ConsoleLogHelper from '../../../Helper/logger';
import { useGlobalAuthState } from '../../../Auth/UserAuth';
import { useGlobalFlowState } from '../../PipelineEdit';
import { useGlobalDeploymentState } from './GlobalDeploymentState';
import { useParams } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { useGetSinglepipelineRunAndTasks } from '../../../graphql/getSinglepipelineRunAndTasks';
import { addDdash } from './useOnPageLoadWebSocket';

var loc = window.location,
    new_uri;
if (loc.protocol === 'https:') {
    new_uri = 'wss:';
} else {
    new_uri = 'ws:';
}
new_uri += '//' + loc.host;

if (process.env.REACT_APP_DATAPLANE_ENV === 'build') {
    new_uri += process.env.REACT_APP_WEBSOCKET_ROOMS_ENDPOINT;
} else {
    new_uri = process.env.REACT_APP_WEBSOCKET_ROOMS_ENDPOINT;
}

const websocketEndpoint = new_uri;

export default function useOnChangeDropdownWebSocket(environmentId, setSelectedRun) {
    const DeploymentState = useGlobalDeploymentState();
    const FlowState = useGlobalFlowState();

    // GraphQL hook
    const getSinglepipelineRunAndTasks = useGetSinglepipelineRunAndTasks();

    // URI parameter
    const { deploymentId } = useParams();

    const { enqueueSnackbar } = useSnackbar();

    const reconnectOnClose = useRef(true);
    const ws = useRef(null);

    const { authToken } = useGlobalAuthState();

    useEffect(() => {
        if (!DeploymentState.onChangeTrigger.get() >= 1) return;

        // Check if the selected run is active. If so, don't start another websocket connection
        if (DeploymentState.runIDs[DeploymentState.selectedRunID?.get()]?.get() && !DeploymentState.runIDs[DeploymentState.selectedRunID?.get()]?.runEnd?.get()) {
            return;
        }

        function connect() {
            ws.current = new WebSocket(
                `${websocketEndpoint}/${environmentId}?subject=taskupdate.${environmentId}.${DeploymentState.selectedRunID.get()}&id=${DeploymentState.selectedRunID.get()}&token=${authToken.get()}`
            );

            ws.current.onopen = async () => {
                ConsoleLogHelper('ws opened');

                // Get single pipelines run and statuses
                let [singleRunResponse, tasksResponse] = await getSinglepipelineRunAndTasks({
                    pipelineID: deploymentId,
                    runID: DeploymentState.selectedRunID.get(),
                    environmentID: environmentId,
                });

                if (singleRunResponse.length === 0) {
                    setSelectedRun([]);
                } else if (singleRunResponse.r || singleRunResponse.error) {
                    enqueueSnackbar("Can't get pipeline run: " + (singleRunResponse.msg || singleRunResponse.r || singleRunResponse.error), { variant: 'error' });
                } else if (singleRunResponse.errors) {
                    singleRunResponse.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
                } else {
                    singleRunResponse = addDdash(singleRunResponse);
                    setSelectedRun(singleRunResponse);
                    DeploymentState.selectedRunID.get();
                    FlowState.elements.set(singleRunResponse.run_json);
                    DeploymentState.runIDs.merge({
                        [singleRunResponse.run_id]: {
                            runStart: singleRunResponse.created_at,
                            runEnd: singleRunResponse.ended_at,
                        },
                    });
                }

                if (tasksResponse.r || tasksResponse.error) {
                    enqueueSnackbar("Can't update statuses: " + (tasksResponse.msg || tasksResponse.r || tasksResponse.error), { variant: 'error' });
                } else if (tasksResponse.errors) {
                    tasksResponse.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
                } else {
                    const nodes = {};
                    tasksResponse.map(
                        (a) =>
                            (nodes[a.node_id] = {
                                status: a.status,
                                end_dt: a.end_dt,
                                start_dt: a.start_dt,
                                name: singleRunResponse.run_json.filter((b) => b.id === a.node_id)[0].data.name,
                                type: singleRunResponse.run_json.filter((b) => b.id === a.node_id)[0].type,
                                updated_by: 'graphql',
                            })
                    );
                    DeploymentState.batch((s) => {
                        s.selectedRunID.set(tasksResponse[0].run_id);
                        s.runIDs[tasksResponse[0].run_id].nodes.set(nodes);
                    }, 'tasks-batch');
                }

                // Close websocket connection if the run is complete
                if (singleRunResponse.status !== 'Running') {
                    reconnectOnClose.current = false;
                    ws.current.close();
                } else {
                    // Needed for Stop button to show
                    DeploymentState.isRunning.set(true);
                }
            };

            ws.current.onclose = () => {
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

            ws.current.onmessage = (e) => {
                const response = JSON.parse(e.data);

                ConsoleLogHelper(
                    '🧲',
                    FlowState.elements.get().filter((a) => a.id === response.node_id)[0]?.data.name ||
                        FlowState.elements.get().filter((a) => a.id === response.node_id)[0]?.type ||
                        response.MSG,
                    response.status
                );

                // Add only if a node message, not MSG.
                if (response.node_id) {
                    DeploymentState.runIDs[response.run_id].nodes.merge({
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
                    DeploymentState.isRunning.set(false);
                    DeploymentState.runIDs[response.run_id].runEnd.set(response.ended_at);

                    reconnectOnClose.current = false;
                    ws.current.close();
                }
            };
        }

        connect();

        return () => {
            reconnectOnClose.current = false;
            ws.current.close();
        };

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [DeploymentState.onChangeTrigger.get()]);
}
