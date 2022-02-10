import { MenuItem } from '@mui/material';
import { useGlobalFlowState } from '../../../pages/Flow';

const ScheduleTriggerNodeItem = (props) => {
    // Flow global state
    const FlowState = useGlobalFlowState();

    const handleOpenScheduler = () => {
        props.handleCloseMenu();
        FlowState.isOpenSchedulerDrawer.set(true);
    };

    return (
        <>
            <MenuItem sx={{ color: 'cyan.main' }} onClick={handleOpenScheduler}>
                Scheduler
            </MenuItem>
        </>
    );
};

export default ScheduleTriggerNodeItem;
