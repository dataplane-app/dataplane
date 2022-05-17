import { faCheckCircle, faExclamationCircle, faRunning } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Box, Typography } from '@mui/material';
import { forwardRef, useEffect, useState } from 'react';
import { LazyLog, ScrollFollow } from 'react-lazylog';
import CustomDragHandle from '../../CustomDragHandle';
import { RunningSpinner } from './RunningSpinner';
import { useGlobalEditorState } from '../../../pages/Editor';
import { useTheme } from '@mui/system';
import useInstallWebSocketLog from './useInstallWebSocketLog';

const InstallationLogsColumn = forwardRef(({ children, setPackages, environmentID, workerGroup, pipelineID, ...rest }, ref) => {
    // Global editor state
    const EditorGlobal = useGlobalEditorState();

    // Local state for logs
    const [websocketResp, setWebsocketResp] = useState('\n');

    // Instantiate websockets connection
    const webSocketInstall = useInstallWebSocketLog(environmentID, workerGroup, pipelineID, setWebsocketResp, setPackages);

    // Clear websockets logs on load and tab change
    useEffect(() => {
        setWebsocketResp('');
    }, []);

    // Append to websockets as they are recieved
    useEffect(() => {
        setWebsocketResp((t) => t + webSocketInstall + '\n');

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [webSocketInstall]);

    const theme = useTheme();

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
                <Box sx={{ background: 'editorPage.logBackground', color: '#d6d6d6' }} display="flex" alignItems="flex-start" flexDirection="row" pl={6} pr={4} pt={3} pb={0}>
                    <Box component={FontAwesomeIcon} fontSize={24} color="secondary.main" icon={faRunning} mr={2} />

                    {/* Package installation status messages */}
                    {EditorGlobal.installState.get() === 'Success' ? (
                        <Box color="status.pipelineOnline" display="flex" alignItems="center">
                            <Box component={FontAwesomeIcon} fontSize={18} color="status.pipelineOnline" icon={faCheckCircle} />
                            <Typography ml={1.5} fontWeight={700} fontSize="0.875rem">
                                Complete
                            </Typography>
                        </Box>
                    ) : null}

                    {EditorGlobal.installState.get() === 'Running' ? (
                        <Box color="#65BEFF" display="flex" alignItems="center">
                            <RunningSpinner />
                            <Typography ml={1.5} fontWeight={700} fontSize="0.875rem">
                                Running
                            </Typography>
                        </Box>
                    ) : null}

                    {EditorGlobal.installState.get() === 'Fail' ? (
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
                            <LazyLog enableSearch text={websocketResp} follow={follow} onScroll={onScroll} style={{ background: theme.palette.editorPage.logBackground }} />
                        )}
                    />
                </Box>
                {children}
                <CustomDragHandle color="#fff" left={16} />
            </Box>
        </div>
    );
});

export default InstallationLogsColumn;
