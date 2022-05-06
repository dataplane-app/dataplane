import { MenuItem } from '@mui/material';
import { useGlobalFlowState } from '../../../pages/PipelineEdit';

const PlayTriggerNodeItem = (props) => {
    const FlowState = useGlobalFlowState();

    const handleRemove = () => {
        FlowState.triggerDelete.set(FlowState.triggerDelete.get() + 1);
        props.handleCloseMenu();
    };

    return (
        <>
            <MenuItem sx={{ color: 'error.main' }} onClick={handleRemove}>
                Delete
            </MenuItem>
        </>
    );
};

export default PlayTriggerNodeItem;
