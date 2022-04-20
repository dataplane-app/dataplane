import { useSnackbar } from "notistack";
import { useParams } from "react-router-dom";
import { usePipelineTasksRun } from "../../graphql/getPipelineTasksRun";
import { useGlobalRunState } from "./GlobalRunState";


export const usePipelineTasksRunHook = () => {
    // GraphQL hook
    const getPipelineTasksRun = usePipelineTasksRun();

    // URI parameter
    const { pipelineId } = useParams();

    const RunState = useGlobalRunState();

    const { enqueueSnackbar } = useSnackbar();

    // Get tasks
    return async (runID, environmentID) => {
        if (!runID) return;

        const response = await getPipelineTasksRun({ pipelineID: pipelineId, runID, environmentID });

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
            RunState.batch((s) => {
                s.selectedRunID.set(response[0].run_id);
                s.runIDs[response[0].run_id].nodes.set(nodes);
            }, 'tasks-batch');
        }
    };
};