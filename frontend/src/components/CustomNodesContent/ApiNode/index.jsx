import { faGlobe } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Grid, Tooltip, Typography, useTheme } from '@mui/material';
import { Box } from '@mui/system';
import { useEffect, useState } from 'react';
import { Handle } from 'react-flow-renderer';
import { useLocation } from 'react-router-dom';
import { useGlobalPipelineRun } from '../../../pages/PipelineRuns/GlobalPipelineRunUIState';
import { useGlobalRunState } from '../../../pages/PipelineRuns/GlobalRunState';
import customNodeStyle from '../../../utils/customNodeStyle';
import { customSourceHandle, customSourceHandleDragging } from '../../../utils/handleStyles';
import ApiTriggerNodeItem from '../../MoreInfoContent/APITriggerNodeItem';
import MoreInfoMenu from '../../MoreInfoMenu';
import { getColor } from '../utils';

const ApiNode = (props) => {
    // Theme hook
    const theme = useTheme();

    // Global state
    const FlowState = useGlobalPipelineRun();
    const RunState = useGlobalRunState();

    const [isEditorPage, setIsEditorPage] = useState(false);
    const [, setIsSelected] = useState(false);
    const [borderColor, setBorderColor] = useState('#c4c4c4');

    // Determine if editor page
    const { pathname } = useLocation();
    useEffect(() => {
        if (pathname.includes('/pipelines/flow/')) {
            setIsEditorPage(true);
        }
    }, [pathname]);

    useEffect(() => {
        setIsSelected(FlowState.selectedElement.get()?.id === props.id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Set border color on node status change
    let nodeStatus = RunState.runObject?.nodes?.get() && RunState.runObject?.nodes[props.id].status?.get();
    useEffect(() => {
        if (nodeStatus) {
            setBorderColor(getColor(nodeStatus));
        } else {
            setBorderColor(getColor());
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [nodeStatus]);

    return (
        <Box sx={{ ...customNodeStyle, border: `3px solid ${borderColor}` }}>
            <Handle type="source" position="right" id="schedule" style={FlowState.isDragging.get() ? customSourceHandleDragging : customSourceHandle(theme.palette.mode)} />

            <Grid container alignItems="flex-start" wrap="nowrap">
                <Box component={FontAwesomeIcon} fontSize={19} color="secondary.main" icon={faGlobe} />
                <Tooltip title={'Node ID: ' + props.id} placement="top">
                    <Grid item ml={1.5} textAlign="left">
                        <Typography fontSize={11} fontWeight={900}>
                            API trigger
                        </Typography>

                        <Typography fontSize={10} mt={1}>
                            Receive webhooks and API calls.
                        </Typography>
                    </Grid>
                </Tooltip>
            </Grid>

            {isEditorPage && (
                <Grid position="absolute" bottom={2} right={9} container wrap="nowrap" width="auto" alignItems="center" justifyContent="space-between">
                    <Box mt={2}>
                        <MoreInfoMenu iconHorizontal iconColor="#0073C6" iconColorDark="#0073C6" iconSize={19} noPadding>
                            <ApiTriggerNodeItem />
                        </MoreInfoMenu>
                    </Box>
                </Grid>
            )}
        </Box>
    );
};

export default ApiNode;
