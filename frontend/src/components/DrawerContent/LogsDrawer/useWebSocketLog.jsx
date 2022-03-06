import { useEffect, useRef, useState } from 'react';
import ConsoleLogHelper from '../../../Helper/logger';

const websocketEndpoint = process.env.REACT_APP_WEBSOCKET_ROOMS_ENDPOINT;

export default function useWebSocketLog(environmentId, run_id, node_id) {
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
                const resp = JSON.parse(e.data);
                let text = `${formatDate(resp.created_at)} ${resp.log}`;
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

export function formatDate(dateString) {
    const date = new Date(dateString);
    return (
        date.getFullYear() +
        '/' +
        ('0' + (date.getMonth() + 1)) +
        '/' +
        ('0' + date.getDate()).slice(-2) +
        ' ' +
        ('0' + date.getHours()).slice(-2) +
        ':' +
        ('0' + date.getMinutes()).slice(-2) +
        ':' +
        ('0' + date.getSeconds()).slice(-2)
    );
}
