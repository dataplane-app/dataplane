import { useEffect, useRef, useState } from 'react';
import ConsoleLogHelper from '../../../Helper/logger';
import { useGlobalAuthState } from '../../../Auth/UserAuth';

var loc = window.location,
    new_uri;
if (loc.protocol === 'https:') {
    new_uri = 'wss:';
} else {
    new_uri = 'ws:';
}
new_uri += '//' + loc.host;

if (import.meta.env.VITE_DATAPLANE_ENV === 'build') {
    new_uri += import.meta.env.VITE_WEBSOCKET_ROOMS_ENDPOINT;
} else {
    new_uri = import.meta.env.VITE_WEBSOCKET_ROOMS_ENDPOINT;
}

const websocketEndpoint = new_uri;

export default function useWebSocket(workerId) {
    const reconnectOnClose = useRef(true);
    const ws = useRef(null);

    const { authToken } = useGlobalAuthState();

    const [online, setOnline] = useState(null);
    const [time, setTime] = useState('');

    // Purge stale workers older than 5 seconds.
    const internalTime = useRef(new Date());
    useEffect(() => {
        const timer = setInterval(() => {
            if (new Date().valueOf() - internalTime.current.valueOf() > 5000) {
                setOnline(false);
            }
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        function connect() {
            ws.current = new WebSocket(`${websocketEndpoint}/remoteworkeronline.${workerId}?token=${authToken.get()}`);

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
                if (resp.Status === 'Online') {
                    internalTime.current = new Date();
                    setTime(new Date().toJSON());
                    setOnline(true);
                }
            };
        }

        connect();

        return () => {
            reconnectOnClose.current = false;
            ws.current.close();
        };

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [workerId]);

    return [online, time];
}
