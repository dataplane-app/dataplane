import { Box, Button, Typography } from '@mui/material';
import { useSnackbar } from 'notistack';
import React, { useEffect, useState } from 'react';
import { LazyLog, ScrollFollow } from 'react-lazylog';
import { useParams } from 'react-router-dom';
import { useGetNodeLogs } from '../../../graphql/getNodeLogs';
import { useGlobalRunState } from '../../../pages/View/useWebSocket';
import { faRunning, faTimes, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { RunningSpinner } from './AdjustIcon';
import useWebSocketLog, { formatDate } from './useWebSocketLog';

const LogsDrawer = ({ environmentId, handleClose }) => {
    const [websocketResp, setWebsocketResp] = useState('');
    const [filteredGraphqlResp, setFilteredGraphqlResp] = useState('');
    const [graphQlResp, setGraphQlResp] = useState([]);

    // Global state
    const RunState = useGlobalRunState();

    // Instantiate websocket
    const webSocket = useWebSocketLog(environmentId, RunState.run_id.get(), RunState.node_id.get());

    useEffect(() => {
        setWebsocketResp((t) => t + webSocket + '\n');
    }, [webSocket]);

    // Prepare filtered graphQL response
    useEffect(() => {
        let text = '';
        graphQlResp.forEach((log) => {
            if (!websocketResp.includes(log.uid)) {
                text += `\n${formatDate(log.created_at)} ${log.log}`;
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
            <Box sx={{ background: '#222', color: '#d6d6d6' }} display="flex" alignItems="flex-start" flexDirection="column" pl={6} pr={4} pt={3}>
                <Box display="flex" alignItems="center" width={'100%'} mb={1}>
                    <Box component={FontAwesomeIcon} fontSize={24} color="secondary.main" icon={faRunning} mr={2} />
                    <Box>
                        <Typography fontSize="0.875rem" fontWeight={900}>
                            {RunState.node_name.get()}
                        </Typography>
                        <Typography fontSize="0.75rem">{RunState.node_description.get()}</Typography>
                    </Box>
                    <Button
                        onClick={handleClose}
                        style={{
                            paddingLeft: '16px',
                            paddingRight: '16px',
                            color: '#65BEFF',
                            marginLeft: 'auto',
                        }}
                        variant="text"
                        startIcon={<FontAwesomeIcon style={{ fontSize: 16 }} icon={faTimes} />}>
                        Close
                    </Button>
                </Box>

                {RunState[RunState.node_id.value].end_dt?.get() ? (
                    <Box color="status.pipelineOnline" display="flex" alignItems="center" mt={0.5}>
                        <Box component={FontAwesomeIcon} fontSize={18} color="status.pipelineOnline" icon={faCheckCircle} />
                        <Typography ml={1.5} fontWeight={700} fontSize="0.875rem">
                            Complete
                        </Typography>
                    </Box>
                ) : (
                    <Box color="#65BEFF" display="flex" alignItems="center" mt={0.5}>
                        <RunningSpinner />
                        <Typography ml={1.5} fontWeight={700} fontSize="0.875rem">
                            Running
                        </Typography>
                    </Box>
                )}
            </Box>

            {/* LazyLog */}
            <Box height="100%" width="100%" bgcolor="#000">
                <ScrollFollow
                    startFollowing={true}
                    render={({ follow, onScroll }) => <LazyLog enableSearch text={filteredGraphqlResp + websocketResp} follow={follow} onScroll={onScroll} extraLines={2} />}
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
