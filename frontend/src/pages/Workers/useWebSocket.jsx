import { useEffect, useRef, useState } from 'react';
import ConsoleLogHelper from '../../Helper/logger';
import { useGlobalAuthState } from '../../Auth/UserAuth';

var loc = window.location,
    new_uri;
if (loc.protocol === 'https:') {
    new_uri = 'wss:';
} else {
    new_uri = 'ws:';
}
new_uri += '//' + loc.host;

if (process.env.REACT_APP_DATAPLANE_ENV === 'build') {
    new_uri += process.env.REACT_APP_WEBSOCKET_ENDPOINT;
} else {
    new_uri = process.env.REACT_APP_WEBSOCKET_ENDPOINT;
}

const websocketEndpoint = new_uri;

export default function useWebSocket(workerId) {
    const reconnectOnClose = useRef(true);
    const ws = useRef(null);

    const [, triggerRender] = useState(1);
    const response = useRef(null);
    const time = useRef(new Date().valueOf());

    const { authToken } = useGlobalAuthState();

    useEffect(() => {
        function connect() {
            ws.current = new WebSocket(`${websocketEndpoint}/${workerId}?token=${authToken.get()}`);

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

                // Store messages in ref to not trigger a render
                if (resp.WorkerGroup === workerId) {
                    response.current = { ...response.current, [resp.WorkerID]: resp };
                }

                // Trigger a render every second
                if (new Date().valueOf() - time.current > 1000) {
                    triggerRender((a) => a * -1);
                    time.current = new Date().valueOf();
                }
            };
        }

        connect();

        return () => {
            reconnectOnClose.current = false;
            ws.current.close();
        };
    }, [workerId]);

    return response.current;
}
