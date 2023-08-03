import { gql, GraphQLClient } from 'graphql-request';
import { useGlobalAuthState } from '../Auth/UserAuth';

const graphlqlEndpoint = import.meta.env.VITE_GRAPHQL_ENDPOINT_PRIVATE;

const query = gql`
    mutation addDeploymentApiKey($deploymentID: String!, $environmentID: String!, $triggerID: String!, $apiKey: String!, $expiresAt: Time) {
        addDeploymentApiKey(deploymentID: $deploymentID, environmentID: $environmentID, triggerID: $triggerID, apiKey: $apiKey, expiresAt: $expiresAt)
    }
`;

export const useAddDeploymentApiKey = () => {
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
            return res?.addDeploymentApiKey;
        } catch (error) {
            return JSON.parse(JSON.stringify(error, undefined, 2)).response;
        }
    };
};
