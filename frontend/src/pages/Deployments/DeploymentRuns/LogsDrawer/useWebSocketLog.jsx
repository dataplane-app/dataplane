import { useEffect, useRef, useState } from 'react';
import { useGlobalAuthState } from '../../../../Auth/UserAuth';
import ConsoleLogHelper from '../../../../Helper/logger';
import { formatDateLog } from '../../../../utils/formatDate';
import { useGlobalRunState } from '../../../PipelineRuns/GlobalRunState';

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

export default function useWebSocketLog(environmentId, run_id, node_id, setKeys, timezone) {
    const [socketResponse, setSocketResponse] = useState('');
    const reconnectOnClose = useRef(true);
    const ws = useRef(null);

    // Global state
    const RunState = useGlobalRunState();

    const { authToken } = useGlobalAuthState();

    useEffect(() => {
        if (RunState.runObject?.nodes[node_id].status.get() !== 'Run') return;

        function connect() {
            ws.current = new WebSocket(`${websocketEndpoint}/workerlogs.${environmentId}.${run_id}.${node_id}?token=${authToken.get()}`);

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
                const resp = JSON.parse(e.data);
                setKeys((k) => [...k, resp.uid]);
                let text = `${formatDateLog(resp.created_at, timezone)} ${resp.log}`;
                setSocketResponse(text);
            };
        }

        connect();

        return () => {
            reconnectOnClose.current = false;
            ws.current.close();
        };

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [run_id]);

    return socketResponse;
}
