import { useEffect, useRef, useState } from 'react';
import ConsoleLogHelper from '../../Helper/logger';
import { useGlobalAuthState } from '../../Auth/UserAuth';

export default function useWebSocket(workerId) {
    const [socketResponse, setSocketResponse] = useState([]);
    const reconnectOnClose = useRef(true);
    const ws = useRef(null);

    const { authToken } = useGlobalAuthState();

    useEffect(() => {
        function connect() {
            ws.current = new WebSocket(`ws://localhost:9000/ws/workerstats/${workerId}?token=${authToken.get()}`);

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
            };
        }

        connect();

        return () => {
            reconnectOnClose.current = false;
            ws.current.close();
        };
    }, [workerId]);

    // Make sure socket response is matching the worked id requested.
    if (socketResponse.WorkerGroup === workerId) {
        return socketResponse;
    } else {
        return [];
    }
}
