import { MenuItem } from '@mui/material';
import { useParams } from 'react-router-dom';
import { useHistory } from 'react-router-dom';
import { useGlobalFlowState } from '../../../pages/PipelineEdit';
import { useTurnOnOffPipelineHook } from '../../DrawerContent/TurnOffPipelineDrawer';
import { useGlobalEnvironmentState } from '../../EnviromentDropdown';

const ViewPageItem = (props) => {
    const history = useHistory();

    // Global state
    const FlowState = useGlobalFlowState();
    const Environment = useGlobalEnvironmentState();

    // URI parameter
    const { pipelineId } = useParams();

    // Graphql hook
    const turnOnOffPipeline = useTurnOnOffPipelineHook(pipelineId, Environment.id.get(), props.handleCloseMenu, props.getPipeline);

    // Handle edit button
    const handleGoToEditorPage = () => {
        FlowState.isEditorPage.set(true);
        history.push(`/pipelines/flow/${pipelineId}`);
    };

    // Handle turn off button
    const handleTurnOffPipeline = () => {
        props.handleCloseMenu();
        FlowState.isOpenTurnOffPipelineDrawer.set(true);
    };

    // Handle turn on button
    const handleTurnOnPipeline = () => {
        turnOnOffPipeline(true);
    };

    const handleAnalytics = () => {
        props.handleCloseMenu();
        props.setIsOpenAnalytics(true);
    };

    const handleDeploy = () => {
        history.push(`/pipelines/deploy/${pipelineId}`);
    };

    const handleRun = () => {
        props.handleCloseMenu();

        var clickEvent = new MouseEvent('click', { view: window, bubbles: true, cancelable: false });
        const runButton = document.getElementById('pipeline-run-button');
        runButton.dispatchEvent(clickEvent);
    };

    return (
        <>
            <MenuItem sx={{ color: 'cyan.main' }} onClick={handleRun}>
                Run
            </MenuItem>
            <MenuItem sx={{ color: 'cyan.main' }} onClick={handleGoToEditorPage}>
                Edit
            </MenuItem>
            <MenuItem sx={{ color: 'cyan.main' }} onClick={handleAnalytics}>
                Analytics
            </MenuItem>
            <MenuItem sx={{ color: 'cyan.main' }} onClick={handleDeploy}>
                Deploy
            </MenuItem>
            {props.pipeline.node_type_desc !== 'play' ? (
                <MenuItem sx={{ color: 'cyan.main' }} onClick={props.isPipelineOnline ? handleTurnOffPipeline : handleTurnOnPipeline}>
                    {props.isPipelineOnline ? 'Turn off' : 'Turn on'}
                </MenuItem>
            ) : null}
        </>
    );
};

export default ViewPageItem;
