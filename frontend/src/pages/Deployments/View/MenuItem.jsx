import { MenuItem } from '@mui/material';
import { useParams } from 'react-router-dom';
import { useHistory } from 'react-router-dom';
import { useGlobalEnvironmentState } from '../../../components/EnviromentDropdown';
import { useGlobalFlowState } from '../../Flow';
import { useTurnOnOffDeploymentHook } from '../TurnOffDeploymentDrawer';

const DeploymentViewPageItem = (props) => {
    const history = useHistory();

    // // Global state
    // const FlowState = useGlobalFlowState();
    // const Environment = useGlobalEnvironmentState();

    // URI parameter
    const { pipelineId } = useParams();

    // // Graphql hook
    // const turnOnOffPipeline = useTurnOnOffDeploymentHook(pipelineId, Environment.id.get(), props.handleCloseMenu, props.getPipelineFlow, props.getPipeline);

    // // Handle turn off button
    // const handleTurnOffPipeline = () => {
    //     props.handleCloseMenu();
    //     FlowState.isOpenTurnOffPipelineDrawer.set(true);
    // };

    // // Handle turn on button
    // const handleTurnOnPipeline = () => {
    //     turnOnOffPipeline(true);
    // };

    const handleAnalytics = () => {
        props.handleCloseMenu();
        props.setIsOpenAnalytics(true);
    };

    return (
        <>
            <MenuItem sx={{ color: 'cyan.main' }} onClick={() => props.handleCloseMenu()}>
                Run
            </MenuItem>
            <MenuItem sx={{ color: 'cyan.main' }} onClick={handleAnalytics}>
                Analytics
            </MenuItem>
            {/* {props.pipeline.node_type_desc !== 'play' ? (
                <MenuItem sx={{ color: 'cyan.main' }} onClick={props.isPipelineOnline ? handleTurnOffPipeline : handleTurnOnPipeline}>
                    {props.isPipelineOnline ? 'Turn off' : 'Turn on'}
                </MenuItem>
            ) : null} */}
        </>
    );
};

export default DeploymentViewPageItem;
