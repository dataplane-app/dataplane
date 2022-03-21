import { faCheckCircle, faExclamationCircle, faRunning } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Box, Typography } from '@mui/material';
import { forwardRef } from 'react';
import { LazyLog, ScrollFollow } from 'react-lazylog';
import { useGlobalRunState } from '../../../pages/View/useWebSocket';
import CustomDragHandle from '../../CustomDragHandle';
import { RunningSpinner } from '../../DrawerContent/LogsDrawer/AdjustIcon';

const url = 'https://gist.githubusercontent.com/shadow-fox/5356157/raw/1b63df47e885d415705d175b7f6b87989f9d4214/mongolog';

const LogsColumn = forwardRef(({ children, ...rest }, ref) => {
    // Global state
    const RunState = useGlobalRunState();

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

                {RunState.selectedNodeStatus.get() === 'Success' ? (
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
                ) : null}
            </Box>
            <Box height="calc(100% - 74px)" width="100%">
                <ScrollFollow
                    startFollowing={true}
                    render={({ follow, onScroll }) => <LazyLog url={url} style={{ paddingBottom: 20 }} stream follow={follow} onScroll={onScroll} />}
                />
            </Box>
            {children}
            <CustomDragHandle color="#fff" left={16} />
        </div>
    );
});

export default LogsColumn;
