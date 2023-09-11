import { gql, GraphQLClient } from 'graphql-request';
import { useGlobalAuthState } from '../../Auth/UserAuth.jsx';

const graphlqlEndpoint = import.meta.env.VITE_GRAPHQL_ENDPOINT_PRIVATE;

const query = gql`
    query getPipelineTrigger($pipelineID: String!, $environmentID: String!) {
        getPipelineTrigger(pipelineID: $pipelineID, environmentID: $environmentID) {
            triggerID
            pipelineID
            environmentID
            apiKeyActive
            publicLive
            privateLive
        }
    }
`;

export const useGetPipelineTrigger = () => {
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
            return res?.getPipelineTrigger;
        } catch (error) {
            return JSON.parse(JSON.stringify(error, undefined, 2)).response;
        }
    };
};
