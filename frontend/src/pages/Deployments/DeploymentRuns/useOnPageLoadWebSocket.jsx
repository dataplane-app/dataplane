import { useEffect, useRef } from 'react';
import ConsoleLogHelper from '../../../Helper/logger';
import { useGlobalAuthState } from '../../../Auth/UserAuth';
import { useGlobalFlowState } from '../../Flow';
import { useGlobalDeploymentState } from './GlobalDeploymentState';
import { useHistory, useParams } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { prepareInputForFrontend } from '.';
import { useGetPipelineFlow } from '../../../graphql/getPipelineFlow';
import { useGetSinglepipelineRunAndTasks } from '../../../graphql/getSinglepipelineRunAndTasks';

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

export default function useOnPageLoadWebSocket(environmentId, setSelectedRun, setRuns, setIsNewFlow) {
    const DeploymentState = useGlobalDeploymentState();
    const FlowState = useGlobalFlowState();

    // URI parameter
    const { deploymentId } = useParams();

    // GraphQL hook
    const getSingleDeploymentRunAndTasks = useGetSinglepipelineRunAndTasks();

    const { enqueueSnackbar } = useSnackbar();

    const reconnectOnClose = useRef(true);
    const ws = useRef(null);

    const { authToken } = useGlobalAuthState();

    useEffect(() => {
        if (DeploymentState.onLoadTrigger.get() !== 1) return;

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

                // Get single deployment run and statuses
                let [singleRunResponse, tasksResponse] = await getSingleDeploymentRunAndTasks({
                    pipelineID: deploymentId,
                    runID: DeploymentState.selectedRunID.get(),
                    environmentID: environmentId,
                });

                // Single deployment run response
                if (singleRunResponse.length === 0) {
                    setSelectedRun([]);
                } else if (singleRunResponse.r || singleRunResponse.error) {
                    enqueueSnackbar("Can't get deployment run: " + (singleRunResponse.msg || singleRunResponse.r || singleRunResponse.error), { variant: 'error' });
                } else if (singleRunResponse.errors) {
                    singleRunResponse.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
                } else {
                    singleRunResponse = addDdash(singleRunResponse);

                    // Set dropdown value to latest run
                    setSelectedRun(singleRunResponse);

                    // Flow is first set here
                    FlowState.elements.set(singleRunResponse.run_json);
                    DeploymentState.runIDs.merge({
                        [singleRunResponse.run_id]: {
                            runStart: singleRunResponse.created_at,
                            runEnd: singleRunResponse.ended_at,
                        },
                    });
                }

                // Deployment tasks, statuses response
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
                    // Add status info for this run to DeploymentState
                    DeploymentState.runIDs[tasksResponse[0].run_id].nodes.set(nodes);
                }

                // Close websocket connection if the run is complete
                if (singleRunResponse.status !== 'Running') {
                    reconnectOnClose.current = false;
                    ws.current.close();
                } else {
                    // Needed for Stop button to show
                    DeploymentState.isRunning.set(true);
                }

                // Start a run if page loaded by clicking run on the pipelines table
                if (DeploymentState.tableRunTrigger.get() === 1) {
                    DeploymentState.merge({
                        runTrigger: 1,
                        tableRunTrigger: 0,
                    });
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
    }, [DeploymentState.onLoadTrigger.get()]);
}

const useGetPipelineFlowHook = () => {
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
    return async (environmentID) => {
        const rawResponse = await getPipelineFlow({ pipelineID: pipelineId, environmentID });
        const response = prepareInputForFrontend(rawResponse);

        if (response.length === 0) {
            FlowState.elements.set([]);
            history.push(`/pipelines/flow/${pipelineId}`);
        } else if (response.r === 'error') {
            closeSnackbar();
            enqueueSnackbar("Can't get flow: " + response.msg, { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            FlowState.elements.set(response);
        }
    };
};

// Utility function
// Add d- to nodes
export function addDdash(response) {
    let responseString = JSON.stringify(response);
    responseString = responseString.replaceAll('"id":"', '"id":"d-');
    responseString = responseString.replaceAll('"source":"', '"source":"d-');
    responseString = responseString.replaceAll('"target":"', '"target":"d-');
    return JSON.parse(responseString);
}
