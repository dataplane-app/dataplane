import { Box } from '@mui/material';
import { useSnackbar } from 'notistack';
import React, { useEffect, useState } from 'react';
import { LazyLog, ScrollFollow } from 'react-lazylog';
import { useParams } from 'react-router-dom';
import { useGetNodeLogs } from '../../../graphql/getNodeLogs';
import { useGlobalRunState } from '../../../pages/View/useWebSocket';

const websocketEndpoint = process.env.REACT_APP_WEBSOCKET_ROOMS_ENDPOINT;

const LogsDrawer = ({ environmentId }) => {
    const [url, setUrl] = useState();
    const [firstMessageReceived, setFirstMessageReceived] = useState(false);
    const [text, setText] = useState('');

    // Global state
    const RunState = useGlobalRunState();

    // Graphql Hook
    const getNodeLogs = useGetNodeLogsHook(environmentId, RunState.run_id.get(), RunState.node_id.get(), setText);

    useEffect(() => {
        if (!RunState.node_id.get() || !RunState.run_id.get()) return;
        setUrl(`${websocketEndpoint}/${environmentId}?subject=workerlogs.${RunState.run_id.get()}.${RunState.node_id.get()}&id=${RunState.run_id.get()}.${RunState.node_id.get()}`);

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [RunState.node_id.get(), RunState.run_id.get()]);

    useEffect(() => {
        if (firstMessageReceived) {
            getNodeLogs();
            setFirstMessageReceived();
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [firstMessageReceived]);

    return (
        <>
            {url ? (
                <Box height="100%" width="100%" bgcolor="#000">
                    <ScrollFollow
                        startFollowing={true}
                        render={({ follow, onScroll }) => (
                            <LazyLog //
                                url={url}
                                websocket
                                stream
                                text={text}
                                follow={follow}
                                onScroll={onScroll}
                                websocketOptions={{
                                    formatMessage: (e) => {
                                        if (firstMessageReceived === false) setFirstMessageReceived(true);
                                        return e;
                                    },
                                }}
                            />
                        )}
                    />
                </Box>
            ) : null}
        </>
    );
};

export default LogsDrawer;

// ----- Custom Hooks
const useGetNodeLogsHook = (environmentID, runID, nodeID, setText) => {
    // GraphQL hook
    const getNodeLogs = useGetNodeLogs();

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    // URI parameter
    const { pipelineId } = useParams();

    // Get logs
    return async () => {
        const response = await getNodeLogs({ environmentID, pipelineID: pipelineId, nodeID, runID });

        if (response === null) {
            setText();
        } else if (response.r === 'error') {
            closeSnackbar();
            enqueueSnackbar("Can't get logs: " + response.msg, { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            let text = '';
            response.map((a) => (text += `${JSON.stringify(a)}\n`));
            setText(text);
        }
    };
};
