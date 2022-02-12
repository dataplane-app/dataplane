import { faRunning } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Grid, Typography } from '@mui/material';
import { Box } from '@mui/system';
import { useEffect } from 'react';
import { useState } from 'react';
import { Handle, Position } from 'react-flow-renderer';
import { useGlobalFlowState } from '../../../pages/Flow';
import ClearLogsEditorModeItem from '../../MoreInfoContent/ClearLogsEditorModeItem';
import ClearLogsNodeItem from '../../MoreInfoContent/ClearLogsNodeItem';
import MoreInfoMenu from '../../MoreInfoMenu';

const ClearLogsNode = (props) => {
    // Global state
    const FlowState = useGlobalFlowState();

    const [isEditorPage, setIsEditorPage] = useState(false);
    const [, setIsSelected] = useState(false);

    useEffect(() => {
        setIsEditorPage(FlowState.isEditorPage.get());
        setIsSelected(FlowState.selectedElementId.get() === props.id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        setIsEditorPage(FlowState.isEditorPage.get());
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [FlowState.isEditorPage.get()]);

    useEffect(() => {
        setIsSelected(FlowState.selectedElementId.get() === props.id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [FlowState.selectedElementId.get()]);

    return (
        <Box sx={{ padding: '10px 15px', width: 160, borderRadius: '10px', border: '3px solid #c4c4c4' }}>
            <Handle type="target" position={Position.Left} isConnectable id="clear" style={{ backgroundColor: 'red', height: 10, width: 10 }} />
            <Handle type="source" position={Position.Right} id="3" style={{ backgroundColor: 'red', height: 10, width: 10 }} />
            <Grid container alignItems="flex-start" wrap="nowrap" pb={2}>
                <Box component={FontAwesomeIcon} fontSize={19} color="secondary.main" icon={faRunning} />
                <Grid item ml={1.5} textAlign="left">
                    <Typography fontSize={11} fontWeight={900}>
                        Clear the logs
                    </Typography>

                    <Typography fontSize={9} mt={0.4}>
                        This process cleans down the logs
                    </Typography>
                </Grid>
            </Grid>

            <Grid position="absolute" bottom={2} left={9} right={9} container wrap="nowrap" width="auto" alignItems="center" justifyContent="space-between">
                <Grid item>
                    <Typography fontSize={8}>{props.data.language}</Typography>
                </Grid>

                <Box mt={0}>
                    <MoreInfoMenu iconHorizontal iconColor="#0073C6" iconColorDark="#0073C6" iconSize={19} noPadding>
                        {isEditorPage ? <ClearLogsEditorModeItem openConfigure={props.data.setIsOpenConfigure} openCommand={props.data.setIsOpenCommand} /> : <ClearLogsNodeItem />}
                    </MoreInfoMenu>
                </Box>
            </Grid>
        </Box>
    );
};

export default ClearLogsNode;
