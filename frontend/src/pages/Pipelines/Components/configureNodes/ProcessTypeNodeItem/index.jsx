import { MenuItem } from '@mui/material';
import { useHistory, useParams } from 'react-router-dom';
import { useGlobalFlowState } from '../../../PipelineEdit.jsx';
import { useGlobalPipelineRun } from '../../../../PipelineRuns/GlobalPipelineRunUIState.jsx';

const ProcessTypeNodeItem = (props) => {
    const history = useHistory();
    const FlowState = useGlobalPipelineRun();
    const DrawerState = useGlobalFlowState();

    const { deploymentId, pipelineId } = useParams();

    const handleCodeClick = () => {
        history.push(`/editor/${deploymentId?.replace('d-', '') || pipelineId}/${deploymentId ? props.nodeId.replace('d-', '') : props.nodeId}`);
        props.handleCloseMenu();
    };

    const handleOpenLog = () => {
        props.handleCloseMenu();
        if (props.nodeId.substring(0, 2) === 'd-') {
            FlowState.isOpenDepLogDrawer.set(true);
        } else {
            FlowState.isOpenLogDrawer.set(true);
        }
    };

    const handleOpenConfigure = () => {
        props.handleCloseMenu();
        DrawerState.isOpenConfigureDrawer.set(true);
    };

    return (
        <>
            {pipelineId ? (
                <MenuItem sx={{ color: 'cyan.main' }} onClick={handleCodeClick}>
                    Code
                </MenuItem>
            ) : null}
            <MenuItem sx={{ color: 'cyan.main' }} onClick={handleOpenLog}>
                Logs
            </MenuItem>
            {pipelineId ? (
            <MenuItem sx={{ color: 'cyan.main' }} onClick={handleOpenConfigure}>
                Configure
            </MenuItem>
             ) : null}
        </>
    );
};

export default ProcessTypeNodeItem;
