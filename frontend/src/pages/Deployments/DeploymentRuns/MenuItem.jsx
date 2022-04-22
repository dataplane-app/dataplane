import { MenuItem } from '@mui/material';
import { useParams } from 'react-router-dom';
import { useGlobalPipelineRun } from '../../PipelineRuns/GlobalPipelineRunUIState';
import { useGlobalRunState } from '../../PipelineRuns/GlobalRunState';


const DeploymentViewPageItem = (props) => {
    // Global state
    const FlowState = useGlobalPipelineRun();
    const RunState = useGlobalRunState();

    // URI parameter
    const { version } = useParams();

    const handleAnalytics = () => {
        props.handleCloseMenu();
        props.setIsOpenAnalytics(true);
    };

    const handleRun = () => {
        RunState.isRunning.set(true);
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
