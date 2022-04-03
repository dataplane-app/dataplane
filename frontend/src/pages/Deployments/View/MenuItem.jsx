import { MenuItem } from '@mui/material';
import { useGlobalFlowState } from '../../Flow';
import { useGlobalRunState } from '../../View/useWebSocket';
import { useRunPipelinesHook } from './Timer';

const DeploymentViewPageItem = (props) => {
    // Global state
    const FlowState = useGlobalFlowState();
    const RunState = useGlobalRunState();

    // Graphql hook
    const runPipelines = useRunPipelinesHook();

    const handleAnalytics = () => {
        props.handleCloseMenu();
        props.setIsOpenAnalytics(true);
    };

    const handleRun = () => {
        FlowState.isRunning.set(true);
        RunState.set({ pipelineRunsTrigger: 1, prevRunTime: null });
        runPipelines(props.pipeline.environmentID);
        props.handleCloseMenu();
    };

    return (
        <>
            <MenuItem sx={{ color: 'cyan.main' }} onClick={handleRun}>
                Run
            </MenuItem>
            <MenuItem sx={{ color: 'cyan.main' }} onClick={handleAnalytics}>
                Analytics
            </MenuItem>
        </>
    );
};

export default DeploymentViewPageItem;
