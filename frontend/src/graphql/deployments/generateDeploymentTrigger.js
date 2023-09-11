import { gql, GraphQLClient } from 'graphql-request';
import { useGlobalAuthState } from '../../Auth/UserAuth';

const graphlqlEndpoint = import.meta.env.VITE_GRAPHQL_ENDPOINT_PRIVATE;

const query = gql`
    mutation generateDeploymentTrigger(
        $deploymentID: String!
        $environmentID: String!
        $triggerID: String!
        $apiKeyActive: Boolean!
        $publicLive: Boolean!
        $privateLive: Boolean!
        $dataSizeLimit: Float!
        $dataTTL: Float!
    ) {
        generateDeploymentTrigger(
            deploymentID: $deploymentID
            environmentID: $environmentID
            triggerID: $triggerID
            apiKeyActive: $apiKeyActive
            publicLive: $publicLive
            privateLive: $privateLive
            dataSizeLimit: $dataSizeLimit
            dataTTL: $dataTTL
        )
    }
`;

export const useGenerateDeploymentTrigger = () => {
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
            return res?.generateDeploymentTrigger;
        } catch (error) {
            return JSON.parse(JSON.stringify(error, undefined, 2)).response;
        }
    };
};
