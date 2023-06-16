import { gql, GraphQLClient } from 'graphql-request';
import { useGlobalAuthState } from '../Auth/UserAuth';

const graphlqlEndpoint = process.env.REACT_APP_GRAPHQL_ENDPOINT_PRIVATE;

const query = gql`
    mutation addRemoteWorkerActivationKey($workerID: String!, $environmentID: String!, $activationKey: String!, $expiresAt: Time) {
        addRemoteWorkerActivationKey(workerID: $workerID, environmentID: $environmentID, activationKey: $activationKey, expiresAt: $expiresAt)
    }
`;

export const useAddRemoteWorkerActivationKey = () => {
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
            return res?.addRemoteWorkerActivationKey;
        } catch (error) {
            return JSON.parse(JSON.stringify(error, undefined, 2)).response;
        }
    };
};
