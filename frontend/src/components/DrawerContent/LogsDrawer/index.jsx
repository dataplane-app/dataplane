import { Box, Typography } from '@mui/material';
import { useSnackbar } from 'notistack';
import React, { useEffect, useState } from 'react';
import { LazyLog, ScrollFollow } from 'react-lazylog';
import { useParams } from 'react-router-dom';
import { useGetNodeLogs } from '../../../graphql/getNodeLogs';
import { useGlobalRunState } from '../../../pages/View/useWebSocket';
import { faRunning, faBullseye } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

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
            <Box sx={{ background: '#222', color: '#d6d6d6' }} display="flex" alignItems="center" pl={6} pr={4} pt={3}>
                <Box component={FontAwesomeIcon} fontSize={19} color="secondary.main" icon={faRunning} mr={2} />
                <Box>
                    <Typography fontSize={11} fontWeight={900}>
                        Clear the logs
                    </Typography>
                    <Typography fontSize={9}>This process cleans down the logs</Typography>
                </Box>
                <Box ml={'auto'} color="#65BEFF" display="flex" alignItems="center">
                    <Box component={FontAwesomeIcon} fontSize={19} color="#65BEFF" icon={faBullseye} mr={2} />
                    <Typography>Running</Typography>
                </Box>
            </Box>
            {url ? (
                <Box height="100%" width="100%" bgcolor="#000">
                    <ScrollFollow
                        startFollowing={true}
                        render={({ follow, onScroll }) => (
                            <LazyLog //
                                url={url}
                                websocket
                                stream
                                enableSearch
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
