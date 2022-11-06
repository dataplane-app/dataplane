import { gql, GraphQLClient } from 'graphql-request';
import { useGlobalAuthState } from '../Auth/UserAuth';

const graphlqlEndpoint = process.env.REACT_APP_GRAPHQL_ENDPOINT_PRIVATE;

const query = gql`
    query getDeploymentApiKeys($deploymentID: String!, $environmentID: String!) {
        getDeploymentApiKeys(deploymentID: $deploymentID, environmentID: $environmentID) {
            triggerID
            apiKey
            apiKeyTail
            deploymentID
            environmentID
            expiresAt
        }
    }
`;

export const useGetDeploymentApiKeys = () => {
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
            return res?.getDeploymentApiKeys;
        } catch (error) {
            return JSON.parse(JSON.stringify(error, undefined, 2)).response;
        }
    };
};
