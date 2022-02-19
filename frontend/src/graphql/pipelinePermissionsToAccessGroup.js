import { gql, GraphQLClient } from 'graphql-request';
import { useGlobalAuthState } from '../Auth/UserAuth';

const graphlqlEndpoint = process.env.REACT_APP_GRAPHQL_ENDPOINT_PRIVATE;

const query = gql`
    mutation pipelinePermissionsToAccessGroup($environmentID: String!, $resource: String!, $resourceID: String!, $access_group_id: String!, $access: String!, $checked: String!) {
        pipelinePermissionsToAccessGroup(
            environmentID: $environmentID
            resource: $resource
            resourceID: $resourceID
            access_group_id: $access_group_id
            access: $access
            checked: $checked
        )
    }
`;

export const usePipelinePermissionsToAccessGroup = () => {
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
            return res?.pipelinePermissionsToAccessGroup;
        } catch (error) {
            return JSON.parse(JSON.stringify(error, undefined, 2)).response;
        }
    };
};
