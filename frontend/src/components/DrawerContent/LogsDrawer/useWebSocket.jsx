import { useEffect, useRef, useState } from 'react';
import ConsoleLogHelper from '../../../Helper/logger';

const websocketEndpoint = process.env.REACT_APP_WEBSOCKET_ROOMS_ENDPOINT;

export default function useWebSocket(environmentId, run_id, node_id) {
    const [socketResponse, setSocketResponse] = useState([]);
    const reconnectOnClose = useRef(true);
    const ws = useRef(null);

    useEffect(() => {
        function connect() {
            ws.current = new WebSocket(`${websocketEndpoint}/${environmentId}?subject=workerlogs.${run_id}.${node_id}&id=${run_id}.${node_id}`);

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
                setSocketResponse(e.data);
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
