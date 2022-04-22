import { useSnackbar } from "notistack";
import { usePipelineTasksRun } from "../../../graphql/getPipelineTasksRun";
import { useGlobalRunState } from "../../PipelineRuns/GlobalRunState";



export const useDeploymentTasksColoursRun = () => {
    // GraphQL hook
    const getPipelineTasksRun = usePipelineTasksRun();
    const RunState = useGlobalRunState();
    const { enqueueSnackbar } = useSnackbar();

    // Get tasks
    return async (pipelineID, runID, environmentID, running) => {
        if (!runID) return;

        if (running === false){

        const response = await getPipelineTasksRun({ pipelineID: pipelineID, runID, environmentID });

        // console.log("tasks response:", response)

        if (response.r || response.error) {
            enqueueSnackbar("Can't get tasks: " + (response.msg || response.r || response.error), { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            const nodes = {};
            response.map(
                (a) =>
                    (nodes[a.node_id] = {
                        status: a.status,
                        end_dt: a.end_dt,
                        start_dt: a.start_dt,
                    })
            );

            RunState.merge({
                runObject: {
                    nodes: nodes
                },
            })
        }
    }
    };
};