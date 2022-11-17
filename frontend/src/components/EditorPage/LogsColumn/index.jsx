import { faCheckCircle, faExclamationCircle, faRunning } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Box, Button, Typography } from '@mui/material';
import { forwardRef, useEffect, useState } from 'react';
import { LazyLog, ScrollFollow } from 'react-lazylog';
import CustomDragHandle from '../../CustomDragHandle';
import { RunningSpinner } from './RunningSpinner';
import useWebSocketLog, { formatDate } from './useWebSocketLog';
import { useGlobalEditorState } from '../../../pages/Editor';
import { useTheme } from '@mui/system';
import { useGlobalMeState } from '../../Navbar';

const LogsColumn = forwardRef(({ children, ...rest }, ref) => {
    const pipeline = rest.pipeline;

    const [websocketResp, setWebsocketResp] = useState('');
    const [filteredGraphqlResp, setFilteredGraphqlResp] = useState('');
    const [graphQlResp, setGraphQlResp] = useState([]);
    const [keys, setKeys] = useState([]);
    const [render, setRender] = useState(0);
    const [isHidden, setIsHidden] = useState(null);

    // Global states
    const EditorGlobal = useGlobalEditorState();
    const MeData = useGlobalMeState();

    // Instantiate websocket
    const webSocket = useWebSocketLog(pipeline.environmentID, EditorGlobal.runID.get(), setKeys, setGraphQlResp, keys, pipeline);

    useEffect(() => {
        setWebsocketResp((t) => t + webSocket + '\n');

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [webSocket]);

    useEffect(() => {
        setWebsocketResp('');
        setGraphQlResp([]);
    }, []);

    // Prepare filtered graphQL response
    useEffect(() => {
        let text = '';
        graphQlResp.forEach((log) => {
            if (!keys.includes(log.uid)) {
                text += log.log === 'Run' || log.log === 'Success' || log.log === 'Fail' ? `\n${formatDate(log.created_at, MeData.timezone.get())} ${log.log}` : `\n${log.log}`;
            }
        });
        text = text.replace(/\n/, '');
        if (text) {
            text = text + '\n';
        }

        setFilteredGraphqlResp(text);

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [graphQlResp]);

    useEffect(() => {
        if (!EditorGlobal.runID.get()) return;
        setWebsocketResp('');
        setGraphQlResp([]);

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [EditorGlobal.runID.get()]);

    // Handle tab change
    useEffect(() => {
        setWebsocketResp('');
        setFilteredGraphqlResp('');
        setRender((r) => r + 1);
    }, [EditorGlobal.selectedFile?.id?.value]);

    const theme = useTheme();

    // Show component on a new run
    const runState = EditorGlobal.runState.get();
    useEffect(() => {
        if (runState === 'Running') {
            setIsHidden(false);
        }
    }, [runState]);

    // Hide component on initial load, default behaviour
    let showLogs = EditorGlobal.showLogs.get();
    if (!showLogs && isHidden === null) return null;

    if (isHidden)
        return (
            <Button
                onClick={() => {
                    EditorGlobal.showLogs.set(true);
                    return setIsHidden(false);
                }}
                sx={{ position: 'absolute', zIndex: 1000, top: '11px', right: '16px' }}
                variant="contained"
                size="small">
                Show Logs
            </Button>
        );

    return (
        <div {...rest} ref={ref}>
            <Box
                sx={{
                    height: '100%',
                    background: theme.palette.editorPage.logBackground,
                    border: theme.palette.mode === 'dark' ? '1px solid' : 0,
                    borderColor: 'editorPage.borderColor',
                    pb: 4,
                }}>
                <Button
                    onClick={() => {
                        EditorGlobal.showLogs.set(false);
                        setIsHidden(true);
                    }}
                    sx={{ position: 'absolute', zIndex: 1, top: '17px', right: '16px' }}
                    variant="contained"
                    size="small">
                    Hide
                </Button>
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
                                selectableLines={true}
                                enableSearch
                                key={render}
                                text={filteredGraphqlResp + websocketResp + ' '}
                                follow={follow}
                                onScroll={onScroll}
                                style={{ background: theme.palette.editorPage.logBackground, fontFamily: 'Roboto', fontSize: '0.875rem' }}
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
