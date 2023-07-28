import { gql, GraphQLClient } from 'graphql-request';
import { useGlobalAuthState } from '../../Auth/UserAuth';

const graphlqlEndpoint = process.env.REACT_APP_GRAPHQL_ENDPOINT_PRIVATE;

const query = gql`
    query getDeploymentTrigger($deploymentID: String!, $environmentID: String!) {
        getDeploymentTrigger(deploymentID: $deploymentID, environmentID: $environmentID) {
            triggerID
            deploymentID
            environmentID
            apiKeyActive
            publicLive
            privateLive
        }
    }
`;

export const useGetDeploymentTrigger = () => {
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
            return res?.getDeploymentTrigger;
        } catch (error) {
            return JSON.parse(JSON.stringify(error, undefined, 2)).response;
        }
    };
};
