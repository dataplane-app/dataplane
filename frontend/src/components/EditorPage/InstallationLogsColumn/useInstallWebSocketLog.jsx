import { useSnackbar } from 'notistack';
import { useEffect, useRef, useState } from 'react';
import { useGlobalAuthState } from '../../../Auth/UserAuth';
import { useGetCodePackages } from '../../../graphql/codeEditor/getCodePackages.js';
import { useUpdateCodePackages } from '../../../graphql/codeEditor/updateCodePackages.js';
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
if (import.meta.env.VITE_DATAPLANE_ENV === 'build') {
    new_uri += import.meta.env.VITE_WEBSOCKET_ROOMS_ENDPOINT;
} else {
    new_uri = import.meta.env.VITE_WEBSOCKET_ROOMS_ENDPOINT;
}

const websocketEndpoint = new_uri;

export default function useInstallWebSocketLog(environmentID, workerGroup, pipelineID, setWebsocketResp, setPackages) {
    const [socketResponse, setSocketResponse] = useState('');
    const [isInstallationComplete, setIsInstallationComplete] = useState(false);
    const reconnectOnClose = useRef(true);
    const ws = useRef(null);

    // Global editor state
    const EditorGlobal = useGlobalEditorState();
    const { authToken } = useGlobalAuthState();

    // GraphQL hook
    const updateCodePackages = useUpdateCodePackages();
    const getCodePackages = useGetCodePackages();

    const { enqueueSnackbar } = useSnackbar();

    const language = 'Python';

    useEffect(() => {
        if (!workerGroup) return;
        if (EditorGlobal.installState.get() !== 'Running') return;

        // Clear logs before a new run
        setWebsocketResp('');

        function connect() {
            ws.current = new WebSocket(`${websocketEndpoint}/codepackage.${environmentID}.${workerGroup}?token=${authToken.get()}`);

            ws.current.onopen = async () => {
                ConsoleLogHelper('ws opened');

                EditorGlobal.installState.set('Running');

                // Update packages after websockets connection is established
                const response = await updateCodePackages({
                    environmentID,
                    pipelineID,
                    workerGroup,
                    language,
                    packages: EditorGlobal.selectedFile.diffValue.value,
                });

                if (response.r || response.error) {
                    enqueueSnackbar("Can't update packages: " + (response.msg || response.r || response.error), { variant: 'error' });
                } else if (response.errors) {
                    response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
                } else {
                    // Turns off orange circle
                    EditorGlobal.selectedFile.isEditing.set(false);
                    enqueueSnackbar('File saved.', { variant: 'success' });
                }
            };
            ws.current.onclose = () => {
                // Exit if closing the connection was intentional
                if (!reconnectOnClose.current) {
                    // EditorGlobal.installState.set(null);
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

                // If the run is complete, return
                if (resp.log_type === 'action' && resp.log === 'complete') {
                    EditorGlobal.installState.set('Success');
                    setIsInstallationComplete(true);
                    return;
                }

                let text = `${formatDate(resp.created_at)} ${resp.log}`;
                setSocketResponse(text);

                // TO BE IMPLEMENTED
                // If message is an error message, return after displaying it.
                // if (resp.log_type === 'action' && resp.log === 'Fail') {
                //     EditorGlobal.installState.set('Fail');

                //     // Get packages after installation failure
                //     (async () => {
                //         const response = await getCodePackages({ environmentID, pipelineID, workerGroup, language });

                //         if (response.r || response.error) {
                //             enqueueSnackbar("Can't get packages: " + (response.msg || response.r || response.error), { variant: 'error' });
                //         } else if (response.errors) {
                //             response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
                //         } else {
                //             setPackages(response.packages);
                //         }
                //     })();
                // }
            };
        }

        connect();

        return () => {
            reconnectOnClose.current = false;
            ws.current.close();
        };

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [EditorGlobal.installState.get()]);

    useEffect(() => {
        if (isInstallationComplete === false) return;

        // Get packages for packages column after a successful install
        (async () => {
            const response = await getCodePackages({ environmentID, pipelineID, workerGroup, language });

            if (response.r || response.error) {
                enqueueSnackbar("Can't get packages: " + (response.msg || response.r || response.error), { variant: 'error' });
            } else if (response.errors) {
                response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
            } else {
                setPackages(response.packages);
            }
        })();

        setIsInstallationComplete(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isInstallationComplete]);

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
