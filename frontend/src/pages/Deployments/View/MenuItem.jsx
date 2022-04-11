import { MenuItem } from '@mui/material';
import { useParams } from 'react-router-dom';
import { useGlobalFlowState } from '../../Flow';
import { useGlobalRunState } from '../../PipelineRuns/GlobalRunState';
import { useRunPipelinesHook } from './Timer';

const DeploymentViewPageItem = (props) => {
    // Global state
    const FlowState = useGlobalFlowState();
    const RunState = useGlobalRunState();

    // Graphql hook
    const runPipelines = useRunPipelinesHook();

    // URI parameter
    const { version } = useParams();

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
            {props.version === version ? (
                <MenuItem sx={{ color: 'cyan.main' }} onClick={handleRun}>
                    Run
                </MenuItem>
            ) : null}
            <MenuItem sx={{ color: 'cyan.main' }} onClick={handleAnalytics}>
                Analytics
            </MenuItem>
        </>
    );
};

export default DeploymentViewPageItem;
