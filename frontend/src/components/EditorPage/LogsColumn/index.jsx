import { faCheckCircle, faExclamationCircle, faRunning } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Box, Typography } from '@mui/material';
import { forwardRef, useEffect, useState } from 'react';
import { LazyLog, ScrollFollow } from 'react-lazylog';
import CustomDragHandle from '../../CustomDragHandle';
import { RunningSpinner } from './RunningSpinner';
import useWebSocketLog, { formatDate } from './useWebSocketLog';
import { useGetCodeFileRunLogs } from '../../../graphql/getCodeFileRunLogs';
import { useSnackbar } from 'notistack';
import { useGlobalEditorState } from '../../../pages/Editor';
import { useTheme } from '@mui/system';

const LogsColumn = forwardRef(({ children, ...rest }, ref) => {
    const environmentID = rest.environmentID;
    const pipelineID = rest.pipelineID;

    const [websocketResp, setWebsocketResp] = useState('');
    const [filteredGraphqlResp, setFilteredGraphqlResp] = useState('');
    const [graphQlResp, setGraphQlResp] = useState([]);
    const [keys, setKeys] = useState([]);
    // const [hasGetNodeLogsRun, setHasGetNodeLogsRun] = useState(0);
    const [render, setRender] = useState(0);

    // Global editor state
    const EditorGlobal = useGlobalEditorState();

    // Instantiate websocket
    const webSocket = useWebSocketLog(environmentID, EditorGlobal.runID.get(), setKeys, pipelineID, setGraphQlResp, keys);

    useEffect(() => {
        // if (hasGetNodeLogsRun === 0 && EditorGlobal.runID.get()) {
        // setHasGetNodeLogsRun(1);
        //     getNodeLogs();
        // }

        setWebsocketResp((t) => t + webSocket + '\n');

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [webSocket]);

    useEffect(() => {
        setWebsocketResp('');
        setGraphQlResp([]);
        // setHasGetNodeLogsRun(0);
    }, []);

    // Prepare filtered graphQL response
    useEffect(() => {
        let text = '';
        graphQlResp.forEach((log) => {
            if (!keys.includes(log.uid)) {
                text += `\n${formatDate(log.created_at)} ${log.log}`;
            }
        });
        text = text.replace(/\n/, '');

        setFilteredGraphqlResp(text);

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [graphQlResp]);

    // Graphql Hook
    // const getNodeLogs = useGetNodeLogsHook(environmentID, pipelineID, EditorGlobal.runID.get(), setGraphQlResp, keys);

    useEffect(() => {
        if (!EditorGlobal.runID.get()) return;
        setWebsocketResp('');
        setGraphQlResp([]);
        // setHasGetNodeLogsRun(0);

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [EditorGlobal.runID.get()]);

    // Handle tab change
    useEffect(() => {
        setWebsocketResp('');
        setFilteredGraphqlResp('');
        setRender((r) => r + 1);
    }, [EditorGlobal.selectedFile?.id?.value]);

    const theme = useTheme();

    return (
        <div {...rest}>
            <Box
                sx={{
                    height: '100%',
                    background: theme.palette.editorPage.logBackground,
                    border: theme.palette.mode === 'dark' ? '1px solid' : 0,
                    borderColor: 'editorPage.borderColor',
                    pb: 4,
                }}>
                <Box sx={{ background: 'editorPage.logBackground', color: '#d6d6d6' }} display="flex" alignItems="flex-start" flexDirection="row" pl={6} pr={4} pt={3} pb={0}>
                    <Box component={FontAwesomeIcon} fontSize={24} color="secondary.main" icon={faRunning} mr={2} />

                    {/* Code file update status messages */}
                    {EditorGlobal.runState.get() === 'Success' ? (
                        <Box color="status.pipelineOnline" display="flex" alignItems="center">
                            <Box component={FontAwesomeIcon} fontSize={18} color="status.pipelineOnline" icon={faCheckCircle} />
                            <Typography ml={1.5} fontWeight={700} fontSize="0.875rem">
                                Complete
                            </Typography>
                        </Box>
                    ) : null}

                    {EditorGlobal.runState.get() === 'Running' ? (
                        <Box color="#65BEFF" display="flex" alignItems="center">
                            <RunningSpinner />
                            <Typography ml={1.5} fontWeight={700} fontSize="0.875rem">
                                Running
                            </Typography>
                        </Box>
                    ) : null}

                    {EditorGlobal.runState.get() === 'Fail' ? (
                        <Box color="#F80000" display="flex" alignItems="center">
                            <Box component={FontAwesomeIcon} fontSize={18} color="#F80000" icon={faExclamationCircle} />
                            <Typography ml={1.5} fontWeight={700} fontSize="0.875rem">
                                Failed
                            </Typography>
                        </Box>
                    ) : null}
                </Box>
                <Box
                    height="calc(100% - 44px)"
                    width="calc(100% - 1px)"
                    sx={{
                        background: 'editorPage.logBackground',
                        '& div': { background: theme.palette.editorPage.logBackground },
                        '& div span:before': { content: 'none' },
                    }}>
                    <ScrollFollow
                        startFollowing={true}
                        render={({ follow, onScroll }) => (
                            <LazyLog
                                enableSearch
                                key={render}
                                text={filteredGraphqlResp + '\n' + websocketResp}
                                follow={follow}
                                onScroll={onScroll}
                                style={{ background: theme.palette.editorPage.logBackground }}
                            />
                        )}
                    />
                </Box>
                {children}
                <CustomDragHandle color="#fff" left={16} />
            </Box>
        </div>
    );
});

export default LogsColumn;

// ----- Custom Hooks
// const useGetNodeLogsHook = (environmentID, pipelineID, runID, setGraphQlResp, keys) => {
//     // GraphQL hook
//     const getNodeLogs = useGetCodeFileRunLogs();

//     const { enqueueSnackbar } = useSnackbar();

//     // Get logs
//     return async () => {
//         const response = await getNodeLogs({ environmentID, pipelineID, runID });

//         if (response.r || response.error) {
//             enqueueSnackbar("Can't get logs: " + (response.msg || response.r || response.error), { variant: 'error' });
//         } else if (response.errors) {
//             response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
//         } else {
//             const resp250 = response.slice(response.length - 250);
//             setGraphQlResp(resp250.filter((a) => !keys.includes(a.uid)));
//         }
//     };
// };
