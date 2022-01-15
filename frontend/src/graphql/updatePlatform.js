import { gql, GraphQLClient } from 'graphql-request';
import { useGlobalAuthState } from '../Auth/UserAuth';

const graphlqlEndpoint = process.env.REACT_APP_GRAPHQL_ENDPOINT_PRIVATE;

const UpdatePlatform = gql`
    mutation updatePlatform($input: updatePlatformInput!) {
        updatePlatform(input: $input)
    }
`;

export const useUpdatePlatform = () => {
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
            const res = await client.request(UpdatePlatform, input);
            return res?.updatePlatform;
        } catch (error) {
            return JSON.parse(JSON.stringify(error, undefined, 2)).response;
        }
    };
};
