import { gql, GraphQLClient } from 'graphql-request';
import { useGlobalAuthState } from '../Auth/UserAuth';

const graphlqlEndpoint = process.env.REACT_APP_GRAPHQL_ENDPOINT_PRIVATE;

const query = gql`
    query getSingleRemoteProcessGroup($environmentID: String!, $ID: String!) {
        getSingleRemoteProcessGroup(environmentID: $environmentID, ID: $ID) {
            ID
            Name
            Description
            Packages
            Language
            LB
            WorkerType
            Active
        }
    }
`;

export const useGetSingleRemoteProcessGroup = () => {
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
            return res?.getSingleRemoteProcessGroup;
        } catch (error) {
            return JSON.parse(JSON.stringify(error, undefined, 2)).response;
        }
    };
};
