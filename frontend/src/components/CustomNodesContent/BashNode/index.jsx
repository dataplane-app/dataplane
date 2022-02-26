import { faRunning } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Grid, Typography, useTheme } from '@mui/material';
import { Box } from '@mui/system';
import { useEffect } from 'react';
import { useState } from 'react';
import { Handle, Position, useUpdateNodeInternals } from 'react-flow-renderer';
import { useGlobalFlowState } from '../../../pages/Flow';
import { customSourceConnected, customSourceHandle, customSourceHandleDragging, customTargetHandle } from '../../../utils/handleStyles';
import ProcessTypeEditorModeItem from '../../MoreInfoContent/ProcessTypeEditorModeItem';
import ProcessTypeNodeItem from '../../MoreInfoContent/ProcessTypeNodeItem';
import MoreInfoMenu from '../../MoreInfoMenu';

const BashNode = (props) => {
    // Theme hook
    const theme = useTheme();

    // Update node hook
    // (This will fix the line not having the right size when the node connects to other nodes)
    const updateNodeInternals = useUpdateNodeInternals();

    // Global state
    const FlowState = useGlobalFlowState();

    const [isEditorPage, setIsEditorPage] = useState(false);
    const [, setIsSelected] = useState(false);

    useEffect(() => {
        setIsEditorPage(FlowState.isEditorPage.get());
        setIsSelected(FlowState.selectedElement.get()?.id === props.id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        setIsEditorPage(FlowState.isEditorPage.get());
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [FlowState.isEditorPage.get()]);

    useEffect(() => {
        setIsSelected(FlowState.selectedElement.get()?.id === props.id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [FlowState.selectedElement.get()]);

    const onConnect = (params) => {
        FlowState.elementsWithConnection.set([...FlowState.elementsWithConnection.get(), params.source]);
        updateNodeInternals(props.id);
    };

    return (
        <Box sx={{ padding: '10px 15px', width: 160, borderRadius: '10px', border: '3px solid #c4c4c4' }}>
            <Handle type="target" position={Position.Left} isConnectable id="clear" className="handlePulseAnimation" style={customTargetHandle(theme.palette.mode)} />
            <Handle
                onConnect={onConnect}
                type="source"
                position={Position.Right}
                id="3"
                style={
                    FlowState.isDragging.get()
                        ? customSourceHandleDragging
                        : FlowState.elementsWithConnection.get().includes(props.id)
                        ? customSourceConnected(theme.palette.mode)
                        : customSourceHandle(theme.palette.mode)
                }
            />
            <Grid container alignItems="flex-start" wrap="nowrap" pb={2}>
                <Box component={FontAwesomeIcon} fontSize={19} color="secondary.main" icon={faRunning} />
                <Grid item ml={1.5} textAlign="left">
                    <Typography fontSize={11} fontWeight={900}>
                        {props.data.name}
                    </Typography>

                    <Typography fontSize={9} mt={0.4}>
                        {props.data.description}
                    </Typography>
                </Grid>
            </Grid>

            <Grid position="absolute" bottom={2} left={9} right={9} container wrap="nowrap" width="auto" alignItems="center" justifyContent="space-between">
                <Grid item>
                    <Typography fontSize={8}>{props.data.language}</Typography>
                </Grid>

                <Box mt={0}>
                    <MoreInfoMenu iconHorizontal iconColor="#0073C6" iconColorDark="#0073C6" iconSize={19} noPadding>
                        {isEditorPage ? <ProcessTypeEditorModeItem /> : <ProcessTypeNodeItem />}
                    </MoreInfoMenu>
                </Box>
            </Grid>
        </Box>
    );
};

export default BashNode;
