import { gql, GraphQLClient } from 'graphql-request';
import { useGlobalAuthState } from '../Auth/UserAuth';

const graphlqlEndpoint = process.env.REACT_APP_GRAPHQL_ENDPOINT_PRIVATE;

const query = gql`
    mutation addPipelineApiKey($pipelineID: String!, $environmentID: String!, $triggerID: String!, $apiKey: String!, $expiresAt: Time) {
        addPipelineApiKey(pipelineID: $pipelineID, environmentID: $environmentID, triggerID: $triggerID, apiKey: $apiKey, expiresAt: $expiresAt)
    }
`;

export const useAddPipelineApiKey = () => {
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
            return res?.addPipelineApiKey;
        } catch (error) {
            return JSON.parse(JSON.stringify(error, undefined, 2)).response;
        }
    };
};
