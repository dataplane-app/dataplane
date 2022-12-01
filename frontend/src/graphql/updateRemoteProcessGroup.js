import { gql, GraphQLClient } from 'graphql-request';
import { useGlobalAuthState } from '../Auth/UserAuth';

const graphlqlEndpoint = process.env.REACT_APP_GRAPHQL_ENDPOINT_PRIVATE;

const query = gql`
    mutation updateRemoteProcessGroup($id: String!, $environmentID: String!, $name: String!, $description: String!, $packages: String!, $language: String!, $active: Boolean!) {
        updateRemoteProcessGroup(id: $id, environmentID: $environmentID, name: $name, description: $description, packages: $packages, language: $language, active: $active)
    }
`;

export const useUpdateRemoteProcessGroup = () => {
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
            return res?.updateRemoteProcessGroup;
        } catch (error) {
            return JSON.parse(JSON.stringify(error, undefined, 2)).response;
        }
    };
};