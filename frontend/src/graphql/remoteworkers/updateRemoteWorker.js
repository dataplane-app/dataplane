import { gql, GraphQLClient } from 'graphql-request';
import { useGlobalAuthState } from '../../Auth/UserAuth.jsx';

const graphlqlEndpoint = import.meta.env.VITE_GRAPHQL_ENDPOINT_PRIVATE;

const query = gql`
    mutation updateRemoteWorker($workerID: String!, $environmentID: String!, $workerName: String!, $description: String!, $status: String!, $active: Boolean!) {
        updateRemoteWorker(workerID: $workerID, environmentID: $environmentID, workerName: $workerName, description: $description, status: $status, active: $active)
    }
`;

export const useUpdateRemoteWorker = () => {
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
            return res?.updateRemoteWorker;
        } catch (error) {
            return JSON.parse(JSON.stringify(error, undefined, 2)).response;
        }
    };
};
