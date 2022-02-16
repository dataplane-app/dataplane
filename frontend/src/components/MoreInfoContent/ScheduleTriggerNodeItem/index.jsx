import { MenuItem } from '@mui/material';
import { useGlobalFlowState } from '../../../pages/Flow';

const ScheduleTriggerNodeItem = (props) => {
    // Flow global state
    const FlowState = useGlobalFlowState();

    const handleOpenScheduler = () => {
        props.handleCloseMenu();
        FlowState.isOpenSchedulerDrawer.set(true);
    };

    const handleDeleteElement = () => {
        FlowState.triggerDelete.set(FlowState.triggerDelete.get() + 1);
        props.handleCloseMenu();
    };

    return (
        <>
            <MenuItem sx={{ color: 'cyan.main' }} onClick={handleOpenScheduler}>
                Scheduler
            </MenuItem>
            <MenuItem sx={{ color: 'error.main' }} onClick={handleDeleteElement}>
                Delete
            </MenuItem>
        </>
    );
};

export default ScheduleTriggerNodeItem;
