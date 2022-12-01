import { gql, GraphQLClient } from 'graphql-request';
import { useGlobalAuthState } from '../Auth/UserAuth';

const graphlqlEndpoint = process.env.REACT_APP_GRAPHQL_ENDPOINT_PRIVATE;

const query = gql`
    query getSingleRemoteWorker($environmentID: String!, $workerID: String!) {
        getSingleRemoteWorker(environmentID: $environmentID, workerID: $workerID) {
            WorkerID
            WorkerName
            Description
            Status
            Active
            LastPing
        }
    }
`;

export const useGetSingleRemoteWorker = () => {
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
            return res?.getSingleRemoteWorker;
        } catch (error) {
            return JSON.parse(JSON.stringify(error, undefined, 2)).response;
        }
    };
};