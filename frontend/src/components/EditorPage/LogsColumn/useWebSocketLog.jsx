import { useSnackbar } from 'notistack';
import { useEffect, useRef, useState } from 'react';
import { useGlobalAuthState } from '../../../Auth/UserAuth';
import { useGetCodeFileRunLogs } from '../../../graphql/getCodeFileRunLogs';
import { useRunCEFile } from '../../../graphql/runCEFile';
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
if (process.env.REACT_APP_DATAPLANE_ENV === 'build') {
    new_uri += process.env.REACT_APP_WEBSOCKET_ROOMS_ENDPOINT;
} else {
    new_uri = process.env.REACT_APP_WEBSOCKET_ROOMS_ENDPOINT;
}

const websocketEndpoint = new_uri;

export default function useWebSocketLog(environmentId, run_id, setKeys, setGraphQlResp, keys, pipeline) {
    const [socketResponse, setSocketResponse] = useState('');
    const reconnectOnClose = useRef(true);
    const ws = useRef(null);

    // Global editor state
    const EditorGlobal = useGlobalEditorState();

    // GraphQL hook
    const getNodeLogs = useGetCodeFileRunLogs();
    const runCEFile = useRunCEFile();

    const { enqueueSnackbar } = useSnackbar();

    const { authToken } = useGlobalAuthState();

    useEffect(() => {
        if (!run_id) return;

        function connect() {
            // 1. Connect to websockets
            ws.current = new WebSocket(`${websocketEndpoint}/${environmentId}?subject=coderunfilelogs.${run_id}&id=${run_id}&token=${authToken.get()}`);

            ws.current.onopen = async () => {
                EditorGlobal.runState.set('Running');
                ConsoleLogHelper('ws opened');

                // 2. Start the run
                const response = await runCEFile({
                    environmentID: environmentId,
                    pipelineID: pipeline.pipelineID,
                    nodeID: pipeline.nodeID,
                    fileID: EditorGlobal.selectedFile?.id?.get(),
                    NodeTypeDesc: pipeline.nodeTypeDesc,
                    workerGroup: pipeline.workerGroup,
                    runID: run_id,
                });

                if (response.r || response.error) {
                    enqueueSnackbar("Can't get files: " + (response.msg || response.r || response.error), { variant: 'error' });
                } else if (response.errors) {
                    response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
                }

                // 3. Get the logs
                const responseLogs = await getNodeLogs({ environmentID: environmentId, pipelineID: pipeline.pipelineID, runID: run_id });

                if (responseLogs.r || responseLogs.error) {
                    enqueueSnackbar("Can't get logs: " + (responseLogs.msg || responseLogs.r || responseLogs.error), { variant: 'error' });
                } else if (responseLogs.errors) {
                    responseLogs.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
                } else {
                    const resp250 = responseLogs.slice(responseLogs.length - 250);
                    setGraphQlResp(resp250.filter((a) => !keys.includes(a.uid)));
                }
            };
            ws.current.onclose = () => {
                // Exit if closing the connection was intentional
                if (!reconnectOnClose.current) {
                    ConsoleLogHelper('ws closed');
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
                if ((resp.log_type === 'action' && resp.log === 'Fail') || (resp.log_type === 'action' && resp.log === 'Success')) {
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
