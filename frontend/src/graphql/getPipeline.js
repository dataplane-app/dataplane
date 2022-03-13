import { gql, GraphQLClient } from 'graphql-request';
import { useGlobalAuthState } from '../Auth/UserAuth';

const graphlqlEndpoint = process.env.REACT_APP_GRAPHQL_ENDPOINT_PRIVATE;

const query = gql`
    query getPipeline($environmentID: String!, $pipelineID: String!) {
        getPipeline(environmentID: $environmentID, pipelineID: $pipelineID) {
            pipelineID
            name
            environmentID
            description
            active
            online
            current
            created_at
            updated_at
            node_type
            node_type_desc
            schedule
            schedule_type
        }
    }
`;

export const useGetPipeline = () => {
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
            return res?.getPipeline;
        } catch (error) {
            return JSON.parse(JSON.stringify(error, undefined, 2)).response;
        }
    };
};
