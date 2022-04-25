import { MenuItem } from '@mui/material';
import { useHistory, useParams } from 'react-router-dom';
import { useGlobalPipelineRun } from '../../../pages/PipelineRuns/GlobalPipelineRunUIState';

const ProcessTypeNodeItem = (props) => {
    const history = useHistory();
    const FlowState = useGlobalPipelineRun();

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
        </>
    );
};

export default ProcessTypeNodeItem;
