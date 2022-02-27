import { useEffect, useRef, useState } from 'react';
import ConsoleLogHelper from '../../Helper/logger';
import { useGlobalAuthState } from '../../Auth/UserAuth';
import { createState, useState as useHookState } from '@hookstate/core';

const websocketEndpoint = process.env.REACT_APP_WEBSOCKET_ROOMS_ENDPOINT;

// Global flow states
export const globalRunState = createState({});

export const useGlobalRunState = () => useHookState(globalRunState);

export default function useWebSocket(environmentId, runId) {
    const RunState = useGlobalRunState();

    const [socketResponse, setSocketResponse] = useState([]);
    const reconnectOnClose = useRef(true);
    const ws = useRef(null);

    const { authToken } = useGlobalAuthState();

    useEffect(() => {
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
                setSocketResponse(JSON.parse(e.data));
                RunState[JSON.parse(e.data).node_id].set(JSON.parse(e.data).status);
            };
        }

        // if (runId !== '') {
        connect();
        // }

        return () => {
            reconnectOnClose.current = false;
            ws.current.close();
        };
    }, [runId]);

    // Make sure socket response is matching the worked id requested.
    if (socketResponse.WorkerGroup === runId) {
        return socketResponse;
    } else {
        return [];
    }
}
