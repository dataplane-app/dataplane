import { useEffect, useRef } from 'react';
import ConsoleLogHelper from '../../Helper/logger';
import { useGlobalAuthState } from '../../Auth/UserAuth';
import { useGlobalFlowState } from '../Flow';
import { useGlobalRunState } from './GlobalRunState';
import { useParams } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { v4 as uuidv4 } from 'uuid';
import { useRunPipelines } from '../../graphql/runPipelines';
import { useGetPipelineRuns } from '../../graphql/getPipelineRuns';

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
    const RunState = useGlobalRunState();
    const FlowState = useGlobalFlowState();

    // GraphQL hook - this is the Graphql to Run the pipeline
    const runPipelines = useRunPipelines();
    const getPipelineRuns = useGetPipelineRuns();

    const { enqueueSnackbar } = useSnackbar();

    // URI parameter
    const { pipelineId } = useParams();

    // Websocket state
    const reconnectOnClose = useRef(true);
    const ws = useRef(null);
    const { authToken } = useGlobalAuthState();

    return useEffect(() => {
        if (RunState.runTrigger.get() === undefined || RunState.runTrigger.get() < 1) return;
        function connect() {
            const runId = uuidv4();

            RunState.batch((s) => {
                s.runIDs.merge({ [runId]: {} });
                s.selectedRunID.set(runId);
            }, 'run-batch');

            ws.current = new WebSocket(`${websocketEndpoint}/${environmentId}?subject=taskupdate.${environmentId}.${runId}&id=${runId}&token=${authToken.get()}`);

            ws.current.onopen = async () => {
                ConsoleLogHelper('ws opened');

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
                    RunState.runIDs[response.run_id].merge({
                        runStart: response.created_at,
                        runEnd: response.ended_at,
                    });
                }

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
                    RunState.runIDs[response.run_id].nodes.merge({
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
                    reconnectOnClose.current = false;

                    RunState.runIDs[response.run_id].runEnd.set(response.ended_at);

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
    }, [RunState.runTrigger.get()]);
}
