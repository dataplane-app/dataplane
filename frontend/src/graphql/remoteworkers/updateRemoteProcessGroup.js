import { gql, GraphQLClient } from 'graphql-request';
import { useGlobalAuthState } from '../../Auth/UserAuth.jsx';

const graphlqlEndpoint = import.meta.env.VITE_GRAPHQL_ENDPOINT_PRIVATE;

const query = gql`
    mutation updateRemoteProcessGroup(
        $remoteProcessGroupID: String!
        $environmentID: String!
        $name: String!
        $language: String!
        $packages: String!
        $description: String!
        $active: Boolean!
    ) {
        updateRemoteProcessGroup(
            remoteProcessGroupID: $remoteProcessGroupID
            environmentID: $environmentID
            name: $name
            language: $language
            packages: $packages
            description: $description
            active: $active
        )
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
