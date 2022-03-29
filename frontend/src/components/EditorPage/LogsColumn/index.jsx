import { faCheckCircle, faExclamationCircle, faRunning } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Box, Typography } from '@mui/material';
import { forwardRef, useEffect, useState } from 'react';
import { LazyLog, ScrollFollow } from 'react-lazylog';
import { useGlobalRunState } from '../../../pages/View/useWebSocket';
import CustomDragHandle from '../../CustomDragHandle';
import { RunningSpinner } from './RunningSpinner';
import useWebSocketLog, { formatDate } from './useWebSocketLog';
import { useGetCodeFileRunLogs } from '../../../graphql/getCodeFileRunLogs';
import { useSnackbar } from 'notistack';
import { useParams } from 'react-router-dom';
import { useGlobalEditorState } from '../../../pages/Editor';

const LogsColumn = forwardRef(({ children, ...rest }, ref) => {
    const environmentID = rest.environmentID;
    const pipelineID = rest.pipelineID;

    const [websocketResp, setWebsocketResp] = useState('');
    const [filteredGraphqlResp, setFilteredGraphqlResp] = useState('');
    const [graphQlResp, setGraphQlResp] = useState([]);
    const [keys, setKeys] = useState([]);
    const [hasGetNodeLogsRun, setHasGetNodeLogsRun] = useState(0);

    // Global state
    const RunState = useGlobalRunState();

    // Global editor state
    const EditorGlobal = useGlobalEditorState();

    // Instantiate websocket
    const webSocket = useWebSocketLog(environmentID, EditorGlobal.runID.get(), setKeys);

    useEffect(() => {
        if (hasGetNodeLogsRun === 0) {
            setHasGetNodeLogsRun(1);
            getNodeLogs();
        }

        setWebsocketResp((t) => t + webSocket + '\n');

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [webSocket]);

    useEffect(() => {
        setWebsocketResp('');
        setGraphQlResp([]);
        setHasGetNodeLogsRun(0);
    }, []);

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
    const getNodeLogs = useGetNodeLogsHook(environmentID, pipelineID, EditorGlobal.runID.get(), setGraphQlResp, keys);

    useEffect(() => {
        if (!EditorGlobal.runID.get()) return;
        setWebsocketResp('');
        setGraphQlResp([]);
        setHasGetNodeLogsRun(0);

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [EditorGlobal.runID.get()]);

    // Handle tab change
    useEffect(() => {
        setWebsocketResp('');
        setFilteredGraphqlResp('');
    }, [EditorGlobal.selectedFile?.id?.value]);
    return (
        <div {...rest}>
            <Box sx={{ background: '#222', color: '#d6d6d6' }} display="flex" alignItems="flex-start" flexDirection="column" pl={6} pr={4} pt={3} pb={2}>
                <Box display="flex" alignItems="center" width={'100%'} mb={1}>
                    <Box component={FontAwesomeIcon} fontSize={24} color="secondary.main" icon={faRunning} mr={2} />
                    <Box>
                        <Typography fontSize="0.875rem" fontWeight={900}>
                            {RunState.node_name.get()}
                        </Typography>
                        <Typography fontSize="0.75rem">{RunState.node_description.get()}</Typography>
                    </Box>
                </Box>

                {/* {RunState.selectedNodeStatus.get() === 'Success' ? (
                    <Box color="status.pipelineOnline" display="flex" alignItems="center" mt={0.5}>
                        <Box component={FontAwesomeIcon} fontSize={18} color="status.pipelineOnline" icon={faCheckCircle} />
                        <Typography ml={1.5} fontWeight={700} fontSize="0.875rem">
                            Complete
                        </Typography>
                    </Box>
                ) : null}

                {RunState.selectedNodeStatus.get() === 'Run' ? (
                    <Box color="#65BEFF" display="flex" alignItems="center" mt={0.5}>
                        <RunningSpinner />
                        <Typography ml={1.5} fontWeight={700} fontSize="0.875rem">
                            Running
                        </Typography>
                    </Box>
                ) : null}

                {RunState.selectedNodeStatus.get() === 'Fail' ? (
                    <Box color="#F80000" display="flex" alignItems="center" mt={0.5}>
                        <Box component={FontAwesomeIcon} fontSize={18} color="#F80000" icon={faExclamationCircle} />
                        <Typography ml={1.5} fontWeight={700} fontSize="0.875rem">
                            Failed
                        </Typography>
                    </Box>
                ) : null} */}
            </Box>
            <Box height="calc(100% - 68px)" width="100%">
                <ScrollFollow
                    startFollowing={true}
                    render={({ follow, onScroll }) => (
                        <LazyLog style={{ paddingBottom: 20 }} enableSearch text={filteredGraphqlResp + '\n' + websocketResp} follow={follow} onScroll={onScroll} />
                    )}
                />
            </Box>
            {children}
            <CustomDragHandle color="#fff" left={16} />
        </div>
    );
});

export default LogsColumn;

// ----- Custom Hooks
const useGetNodeLogsHook = (environmentID, pipelineID, runID, setGraphQlResp, keys) => {
    // GraphQL hook
    const getNodeLogs = useGetCodeFileRunLogs();

    const { enqueueSnackbar } = useSnackbar();

    // Get logs
    return async () => {
        const response = await getNodeLogs({ environmentID, pipelineID, runID });

        if (response.r || response.error) {
            enqueueSnackbar("Can't get logs: " + (response.msg || response.r || response.error), { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            const resp250 = response.slice(response.length - 250);
            setGraphQlResp(resp250.filter((a) => !keys.includes(a.uid)));
        }
    };
};
