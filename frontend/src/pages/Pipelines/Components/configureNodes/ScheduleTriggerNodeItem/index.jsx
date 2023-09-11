import { MenuItem } from '@mui/material';
import { useGlobalFlowState } from '../../../PipelineEdit.jsx';
import { useGlobalPipelineRun } from '../../../../PipelineRuns/GlobalPipelineRunUIState.jsx';

const ScheduleTriggerNodeItem = (props) => {
    // Flow global state
    const FlowState = useGlobalFlowState();
    const PipelineRunState = useGlobalPipelineRun();

    const handleOpenScheduler = () => {
        props.handleCloseMenu();
        if (window.location.pathname.includes('view')) {
            PipelineRunState.isOpenSchedulerDrawer.set(true);
        } else {
            FlowState.isOpenSchedulerDrawer.set(true);
        }
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
            {FlowState.isEditorPage.get() && (
                <MenuItem sx={{ color: 'error.main' }} onClick={handleDeleteElement}>
                    Delete
                </MenuItem>
            )}
        </>
    );
};

export default ScheduleTriggerNodeItem;
