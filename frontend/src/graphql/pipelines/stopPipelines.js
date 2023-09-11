import { gql, GraphQLClient } from 'graphql-request';
import { useGlobalAuthState } from '../../Auth/UserAuth.jsx';

const graphlqlEndpoint = import.meta.env.VITE_GRAPHQL_ENDPOINT_PRIVATE;

const query = gql`
    mutation stopPipelines($pipelineID: String!, $runID: String!, $environmentID: String!, $RunType: String!) {
        stopPipelines(pipelineID: $pipelineID, runID: $runID, environmentID: $environmentID, RunType: $RunType) {
            run_id
            pipeline_id
            status
            environment_id
            created_at
            ended_at
            updated_at
        }
    }
`;

export const useStopPipelines = () => {
    const authState = useGlobalAuthState();
    const jwt = authState.authToken.get();

    const headers = {
        Authorization: 'Bearer ' + jwt,
    };

    const client = new GraphQLClient(graphlqlEndpoint, {
        headers,
    });

    return async (input) => {
        try {
            const res = await client.request(query, input);
            return res?.stopPipelines;
        } catch (error) {
            return JSON.parse(JSON.stringify(error, undefined, 2)).response;
        }
    };
};
