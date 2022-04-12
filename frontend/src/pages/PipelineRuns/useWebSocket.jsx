import { useEffect, useRef } from 'react';
import ConsoleLogHelper from '../../Helper/logger';
import { useGlobalAuthState } from '../../Auth/UserAuth';
import { useGlobalFlowState } from '../Flow';
import { useGlobalRunState } from './GlobalRunState';
import { usePipelineTasksRunHook } from './RunsDropdown';

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

export default function useWebSocket(environmentId, runId) {
    const RunState = useGlobalRunState();
    const FlowState = useGlobalFlowState();

    const getPipelineTasksRun = usePipelineTasksRunHook();

    const reconnectOnClose = useRef(true);
    const ws = useRef(null);

    const { authToken } = useGlobalAuthState();

    useEffect(() => {
        if (!runId) return;
        if (!FlowState.isRunning.get()) return;
        function connect() {
            ws.current = new WebSocket(`${websocketEndpoint}/${environmentId}?subject=taskupdate.${environmentId}.${runId}&id=${runId}&token=${authToken.get()}`);

            ws.current.onopen = () => ConsoleLogHelper('ws opened');
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

                // Add only if a node message, not MSG.
                if (response.node_id) {
                    RunState.runIDs[response.run_id].nodes.merge({
                        [response.node_id]: {
                            status: response.status,
                            start_dt: response.start_dt,
                            end_dt: response.end_dt,
                        },
                    });
                    RunState.run_id.set(response.run_id);
                }

                if (response.MSG) {
                    FlowState.isRunning.set(false);
                    reconnectOnClose.current = false;
                    RunState.selectedNodeStatus.set(response.status); // to be removed

                    RunState.runIDs[response.run_id].runEnd.set(response.ended_at);
                    ws.current.close();

                    // getPipelineTasksRun(response.run_id, environmentId);
                }
            };
        }

        connect();

        return () => {
            reconnectOnClose.current = false;
            ws.current.close();
        };

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [runId]);
}