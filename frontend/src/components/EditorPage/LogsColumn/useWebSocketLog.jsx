import { useEffect, useRef, useState } from 'react';
import { useGlobalAuthState } from '../../../Auth/UserAuth';
import ConsoleLogHelper from '../../../Helper/logger';
import { useGlobalEditorState } from '../../../pages/Editor';

var loc = window.location,
    new_uri;
if (loc.protocol === 'https:') {
    new_uri = 'wss:';
} else {
    new_uri = 'ws:';
}
new_uri += '//' + loc.host;

// console.log("websockets loc:", new_uri)
if (process.env.REACT_APP_DATAPLANE_ENV == 'build') {
    new_uri += process.env.REACT_APP_WEBSOCKET_ROOMS_ENDPOINT;
} else {
    new_uri = process.env.REACT_APP_WEBSOCKET_ROOMS_ENDPOINT;
}

const websocketEndpoint = new_uri;

export default function useWebSocketLog(environmentId, run_id, setKeys) {
    const [socketResponse, setSocketResponse] = useState('');
    const reconnectOnClose = useRef(true);
    const ws = useRef(null);

    // Global editor state
    const EditorGlobal = useGlobalEditorState();

    const { authToken } = useGlobalAuthState();

    useEffect(() => {
        if (!run_id) return;

        function connect() {
            ws.current = new WebSocket(`${websocketEndpoint}/${environmentId}?subject=coderunfilelogs.${run_id}&id=${run_id}&token=${authToken.get()}`);

            ws.current.onopen = () => {
                EditorGlobal.runState.set('Running');
                ConsoleLogHelper('ws opened');
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
                const resp = JSON.parse(e.data);
                // Return if not a log message
                if (resp.run_id) return;
                setKeys((k) => [...k, resp.uid]);
                let text = `${formatDate(resp.created_at)} ${resp.log}`;
                setSocketResponse(text);
                if (resp.log === 'Fail' || resp.log === 'Success') {
                    EditorGlobal.runState.set(resp.log);
                    reconnectOnClose.current = false;
                    ws.current.close();
                }
            };
        }

        connect();

        return () => {
            reconnectOnClose.current = false;
            ws.current.close();
            ConsoleLogHelper('ws closed');
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
