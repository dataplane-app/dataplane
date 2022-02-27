import { faRunning } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Grid, Typography } from '@mui/material';
import { Box } from '@mui/system';
import { useEffect } from 'react';
import { useState } from 'react';
import { Handle, Position } from 'react-flow-renderer';
import { useGlobalFlowState } from '../../../pages/Flow';
import { useGlobalRunState } from '../../../pages/View/useWebSocket';
import ProcessTypeEditorModeItem from '../../MoreInfoContent/ProcessTypeEditorModeItem';
import ProcessTypeNodeItem from '../../MoreInfoContent/ProcessTypeNodeItem';
import MoreInfoMenu from '../../MoreInfoMenu';
import { getColor } from '../utils';

const PythonNode = (props) => {
    // Global state
    const FlowState = useGlobalFlowState();
    const RunState = useGlobalRunState();

    const [isEditorPage, setIsEditorPage] = useState(false);
    const [, setIsSelected] = useState(false);
    const [borderColor, setBorderColor] = useState('#c4c4c4');

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

    // Set border color on node status change
    useEffect(() => {
        setBorderColor(getColor(RunState[props.id]?.get()));

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [RunState[props.id].get()]);

    return (
        <Box sx={{ padding: '10px 15px', width: 160, borderRadius: '10px', border: `3px solid ${borderColor}` }}>
            <Handle type="target" position={Position.Left} isConnectable id="clear" style={{ backgroundColor: 'red', height: 10, width: 10 }} />
            <Handle type="source" position={Position.Right} id="3" style={{ backgroundColor: 'red', height: 10, width: 10 }} />
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

export default PythonNode;
