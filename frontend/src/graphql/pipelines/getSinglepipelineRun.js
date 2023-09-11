import { gql, GraphQLClient } from 'graphql-request';
import { useGlobalAuthState } from '../../Auth/UserAuth.jsx';

const graphlqlEndpoint = import.meta.env.VITE_GRAPHQL_ENDPOINT_PRIVATE;

const query = gql`
    query getSinglepipelineRun($pipelineID: String!, $environmentID: String!, $runID: String!) {
        getSinglepipelineRun(pipelineID: $pipelineID, environmentID: $environmentID, runID: $runID) {
            run_id
            pipeline_id
            status
            environment_id
            run_json
            created_at
            ended_at
        }
    }
`;

export const useGetSinglepipelineRun = () => {
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
            return res?.getSinglepipelineRun;
        } catch (error) {
            return JSON.parse(JSON.stringify(error, undefined, 2)).response;
        }
    };
};
