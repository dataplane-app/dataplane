import { Box, Typography } from '@mui/material';
import { useSnackbar } from 'notistack';
import React, { useEffect, useState } from 'react';
import { LazyLog, ScrollFollow } from 'react-lazylog';
import { useParams } from 'react-router-dom';
import { useGetNodeLogs } from '../../../graphql/getNodeLogs';
import { useGlobalRunState } from '../../../pages/View/useWebSocket';
import { faRunning } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { AdjustIcon } from './AdjustIcon';
import useWebSocket, { formatDate } from './useWebSocket';

const LogsDrawer = ({ environmentId }) => {
    const [websocketResp, setWebsocketResp] = useState('');
    const [filteredGraphqlResp, setFilteredGraphqlResp] = useState('');
    const [graphQlResp, setGraphQlResp] = useState([]);

    // Global state
    const RunState = useGlobalRunState();

    // Instantiate websocket
    const webSocket = useWebSocket(environmentId, RunState.run_id.get(), RunState.node_id.get());

    useEffect(() => {
        setWebsocketResp((t) => t + webSocket + '\n');
    }, [webSocket]);

    // Prepare filtered graphQL response
    useEffect(() => {
        let text = '';
        graphQlResp.forEach((log) => {
            if (!websocketResp.includes(log.uid)) {
                text += `\n${formatDate(log.created_at)} UID: ${log.uid} Log: ${log.log} Log Type: ${log.log_type}`;
            }
        });
        text = text.replace(/\n/, '');

        setFilteredGraphqlResp(text);

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [graphQlResp]);

    // Graphql Hook
    const getNodeLogs = useGetNodeLogsHook(environmentId, RunState.run_id.get(), RunState.node_id.get(), setGraphQlResp);

    useEffect(() => {
        if (!RunState.run_id.get() || !RunState.node_id.get()) return;
        getNodeLogs();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [RunState.run_id.get(), RunState.node_id.get()]);

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
                    <AdjustIcon />
                    <Typography ml={1} fontWeight={700} fontSize={10}>
                        Running
                    </Typography>
                </Box>
            </Box>

            {/* LazyLog */}
            <Box height="100%" width="100%" bgcolor="#000">
                <ScrollFollow
                    startFollowing={true}
                    render={({ follow, onScroll }) => <LazyLog enableSearch text={filteredGraphqlResp + websocketResp} follow={follow} onScroll={onScroll} />}
                />
            </Box>
        </>
    );
};

export default LogsDrawer;

// ----- Custom Hooks
const useGetNodeLogsHook = (environmentID, runID, nodeID, setGraphQlResp) => {
    // GraphQL hook
    const getNodeLogs = useGetNodeLogs();

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    // URI parameter
    const { pipelineId } = useParams();

    // Get logs
    return async () => {
        const response = await getNodeLogs({ environmentID, pipelineID: pipelineId, nodeID, runID });

        if (response.r === 'error') {
            closeSnackbar();
            enqueueSnackbar("Can't get logs: " + response.msg, { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            setGraphQlResp(response);
        }
    };
};
