import { Box, Button, Typography } from '@mui/material';
import { useSnackbar } from 'notistack';
import React, { useEffect, useState } from 'react';
import { LazyLog, ScrollFollow } from 'react-lazylog';
import { useParams } from 'react-router-dom';
import { useGetNodeLogs } from '../../../graphql/pipelines/getNodeLogs.js';
import { faRunning, faTimes, faCheckCircle, faExclamationCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { RunningSpinner } from './RunningSpinner';
import useWebSocketLog from './useWebSocketLog';
import { useGlobalRunState } from '../../../pages/PipelineRuns/GlobalRunState';
import { useGlobalPipelineRun } from '../../../pages/PipelineRuns/GlobalPipelineRunUIState';
import { useGlobalMeState } from '../../Navbar';
import { formatDateLog } from '../../../utils/formatDate';

const LogsDrawer = ({ environmentId, handleClose }) => {
    const [websocketResp, setWebsocketResp] = useState('');
    const [filteredGraphqlResp, setFilteredGraphqlResp] = useState('');
    const [graphQlResp, setGraphQlResp] = useState([]);
    const [keys, setKeys] = useState([]);

    // Global state
    const RunState = useGlobalRunState();
    const FlowState = useGlobalPipelineRun();
    const MeData = useGlobalMeState();

    // Instantiate websocket
    const webSocket = useWebSocketLog(environmentId, RunState.selectedRunID.get(), RunState.node_id.get(), setKeys, MeData.timezone.get());

    useEffect(() => {
        setWebsocketResp((t) => t + webSocket + '\n');
    }, [webSocket]);

    // Prepare filtered graphQL response
    useEffect(() => {
        let text = '';
        graphQlResp.forEach((log) => {
            if (!websocketResp.includes(log.uid)) {
                text += `\n${formatDateLog(log.created_at, MeData.timezone.get())} ${log.log}`;
            }
        });
        text = text.replace(/\n/, '');

        setFilteredGraphqlResp(text);

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [graphQlResp]);

    // Graphql Hook
    const getNodeLogs = useGetNodeLogsHook(environmentId, RunState.selectedRunID.get(), RunState.node_id.get(), setGraphQlResp, keys);

    useEffect(() => {
        if (!RunState.selectedRunID.get() || !RunState.node_id.get()) return;
        getNodeLogs();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [RunState.selectedRunID.get(), RunState.node_id.get()]);

    return (
        <>
            <Box sx={{ background: '#222', color: '#d6d6d6' }} display="flex" alignItems="flex-start" flexDirection="column" pl={6} pr={4} pt={3}>
                <Box display="flex" alignItems="center" width={'100%'} mb={1}>
                    <Box component={FontAwesomeIcon} fontSize={24} color="secondary.main" icon={faRunning} mr={2} />
                    <Box>
                        <Typography fontSize="0.875rem" fontWeight={900}>
                            {FlowState.elements.get().filter((a) => a.id === RunState.node_id.get())[0].data.name}
                        </Typography>
                        <Typography fontSize="0.75rem">{FlowState.elements.get().filter((a) => a.id === RunState.node_id.get())[0].data.description}</Typography>
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

                {RunState.runObject.nodes[RunState.node_id.get()]?.status?.get() === 'Success' ? (
                    <Box color="status.pipelineOnline" display="flex" alignItems="center" mt={0.5}>
                        <Box component={FontAwesomeIcon} fontSize={18} color="status.pipelineOnline" icon={faCheckCircle} />
                        <Typography ml={1.5} fontWeight={700} fontSize="0.875rem">
                            Complete
                        </Typography>
                    </Box>
                ) : null}

                {RunState.runObject.nodes[RunState.node_id.get()]?.status?.get() === 'Run' ? (
                    <Box color="#65BEFF" display="flex" alignItems="center" mt={0.5}>
                        <RunningSpinner />
                        <Typography ml={1.5} fontWeight={700} fontSize="0.875rem">
                            Running
                        </Typography>
                    </Box>
                ) : null}

                {RunState.runObject.nodes[RunState.node_id.get()]?.status?.get() === 'Fail' ? (
                    <Box color="#F80000" display="flex" alignItems="center" mt={0.5}>
                        <Box component={FontAwesomeIcon} fontSize={18} color="#F80000" icon={faExclamationCircle} />
                        <Typography ml={1.5} fontWeight={700} fontSize="0.875rem">
                            Failed
                        </Typography>
                    </Box>
                ) : null}
            </Box>

            {/* LazyLog */}
            <Box height="100%" width="100%">
                <ScrollFollow
                    startFollowing={true}
                    render={({ follow, onScroll }) => (
                        <LazyLog
                            style={{ fontFamily: 'Roboto', fontSize: '0.875rem' }}
                            selectableLines={true}
                            enableSearch
                            text={filteredGraphqlResp + websocketResp}
                            follow={follow}
                            onScroll={onScroll}
                        />
                    )}
                />
            </Box>
        </>
    );
};

export default LogsDrawer;

// ----- Custom Hooks
const useGetNodeLogsHook = (environmentID, runID, nodeID, setGraphQlResp, keys) => {
    // GraphQL hook
    const getNodeLogs = useGetNodeLogs();

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    // URI parameter
    const { pipelineId, deploymentId } = useParams();
    if (deploymentId) {
        nodeID = 'd-' + nodeID;
    }

    // Get logs
    return async () => {
        const response = await getNodeLogs({ environmentID, pipelineID: pipelineId || deploymentId, nodeID, runID });

        if (response.r === 'error') {
            closeSnackbar();
            enqueueSnackbar("Can't get logs: " + response.msg, { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            const resp250 = response.slice(response.length - 250);
            setGraphQlResp(resp250.filter((a) => !keys.includes(a.uid)));
        }
    };
};
