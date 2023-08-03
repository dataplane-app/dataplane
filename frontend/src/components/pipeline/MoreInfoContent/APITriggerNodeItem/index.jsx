import { MenuItem } from '@mui/material';
import { useGlobalFlowState } from '../../../../pages/PipelineEdit';

const ApiTriggerNodeItem = (props) => {
    const FlowState = useGlobalFlowState();

    const handleDeleteElement = () => {
        FlowState.triggerDelete.set(FlowState.triggerDelete.get() + 1);
        props.handleCloseMenu();
    };

    const handleOpenAPI = () => {
        FlowState.isOpenAPIDrawer.set(true);
        props.handleCloseMenu();
    };

    return (
        <>
            <MenuItem sx={{ color: 'cyan.main' }} onClick={handleOpenAPI}>
                API
            </MenuItem>
            <MenuItem sx={{ color: 'error.main' }} onClick={handleDeleteElement}>
                Delete
            </MenuItem>
        </>
    );
};

export default ApiTriggerNodeItem;
