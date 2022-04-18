import { MenuItem } from '@mui/material';
import { useHistory, useParams } from 'react-router-dom';
import { useGlobalFlowState } from '../../../pages/Flow';

const ProcessTypeNodeItem = (props) => {
    const history = useHistory();
    const FlowState = useGlobalFlowState();

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
            <MenuItem sx={{ color: 'cyan.main' }} onClick={handleCodeClick}>
                Code
            </MenuItem>
            <MenuItem sx={{ color: 'cyan.main' }} onClick={() => props.handleCloseMenu()}>
                Run
            </MenuItem>
            <MenuItem sx={{ color: 'cyan.main' }} onClick={handleOpenLog}>
                Logs
            </MenuItem>
        </>
    );
};

export default ProcessTypeNodeItem;
