import { useSnackbar } from "notistack";
import { useHistory } from "react-router-dom";
import { prepareInputForFrontend } from "../../../utils/PipelinePrepareGraphInput";
import { useGlobalPipelineRun } from "../../PipelineRuns/GlobalPipelineRunUIState";
import { useGetDeploymentFlow } from "../../../graphql/getDeploymentFlow";


/* 
Get the structure for given pipeline ID and environment ID
Set the Elements in Flowstate that updates the graph on page
*/
export const GetDeploymentFlow = () => {

    // GraphQL hook
    const getDeploymentFlow = useGetDeploymentFlow();

    // React router
    const history = useHistory();

    // Global state
    const FlowState = useGlobalPipelineRun();

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    // Get members
    return async (inputs) => {

        console.log("Deployment ID:", inputs.pipelineId, inputs.environmentID, inputs.version)

        const rawResponse = await getDeploymentFlow({ pipelineID: inputs.pipelineId, environmentID: inputs.environmentID, version: inputs.version });

        console.log("Get deployment structure", rawResponse)
        const response = prepareInputForFrontend(rawResponse);

        if (response.length === 0) {
            FlowState.elements.set([]);

            // If there is no elements then navigate to edit pipelines
            // history.push(`/pipelines/flow/${inputs.pipelineId}`);
        } else if (response.r === 'error') {
            closeSnackbar();
            enqueueSnackbar("Can't get flow: " + response.msg, { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            FlowState.elements.set(response);
        }
    };
};