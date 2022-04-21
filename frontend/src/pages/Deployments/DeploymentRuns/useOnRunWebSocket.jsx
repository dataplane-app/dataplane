import { useEffect, useRef } from 'react';
import ConsoleLogHelper from '../../../Helper/logger';
import { useGlobalAuthState } from '../../../Auth/UserAuth';
import { useGlobalFlowState } from '../../PipelineEdit';
import { useGlobalDeploymentState } from './GlobalDeploymentState';
import { useParams } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { v4 as uuidv4 } from 'uuid';
import { useRunPipelines } from '../../../graphql/runPipelines';
import { useGetDeploymentRuns } from '../../../graphql/getDeploymentRuns';

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

export default function useOnRunWebSocket(environmentId, setRuns, setSelectedRun) {
    // Global state
    const DeploymentState = useGlobalDeploymentState();
    const FlowState = useGlobalFlowState();

    // GraphQL hook - this is the Graphql to Run the pipeline
    const runPipelines = useRunPipelines();
    const getDeploymentRuns = useGetDeploymentRuns();

    const { enqueueSnackbar } = useSnackbar();

    // URI parameter
    const { deploymentId, version } = useParams();

    // Websocket state
    const reconnectOnClose = useRef(true);
    const ws = useRef(null);
    const { authToken } = useGlobalAuthState();

    return useEffect(() => {
        if (DeploymentState.runTrigger.get() === undefined || DeploymentState.runTrigger.get() < 1) return;
        function connect() {
            const runId = uuidv4();

            // Temporary fix, to be removed
            let ids = FlowState.elements
                .get()
                .filter((a) => a.type === 'pythonNode' || a.type === 'bashNode' || a.type === 'checkpointNode')
                .map((a) => a.id);
            let nodes = {};
            ids.map((a) => (nodes[a] = { status: 'Queue' }));
            //

            DeploymentState.batch((s) => {
                s.runIDs.merge({ [runId]: { nodes } }); // nodes to be removed, should be s.runIDs.merge({ [runId]: {} });
                s.selectedRunID.set(runId);
            }, 'run-batch');

            // Need to set isRunning to true when we set a new selectedRunID on RunState
            DeploymentState.isRunning.set(true);

            ws.current = new WebSocket(`${websocketEndpoint}/${environmentId}?subject=taskupdate.${environmentId}.${runId}&id=${runId}&token=${authToken.get()}`);

            ws.current.onopen = async () => {
                ConsoleLogHelper('ws opened');

                // Run pipeline
                let response = await runPipelines({
                    pipelineID: deploymentId,
                    environmentID: environmentId,
                    RunType: 'deployment',
                    RunID: runId,
                });
                if (response.r || response.error) {
                    enqueueSnackbar("Can't run pipeline: " + (response.msg || response.r || response.error), { variant: 'error' });
                } else if (response.errors) {
                    response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
                } else {
                    DeploymentState.runIDs[response.run_id].merge({
                        runStart: response.created_at,
                    });
                }

                // Get a list of all pipeline runs
                response = await getDeploymentRuns({ deploymentID: deploymentId, environmentID: environmentId, version });

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

                // To be removed
                if (response.status === 'Queue') return;
                //

                ConsoleLogHelper(
                    '🧲',
                    FlowState.elements.get().filter((a) => a.id === response.node_id?.data?.name) ||
                        FlowState.elements.get().filter((a) => a.id === response.node_id?.type) ||
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
    }, [DeploymentState.runTrigger.get()]);
}
