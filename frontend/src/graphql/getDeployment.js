import { gql, GraphQLClient } from 'graphql-request';
import { useGlobalAuthState } from '../Auth/UserAuth';

const graphlqlEndpoint = process.env.REACT_APP_GRAPHQL_ENDPOINT_PRIVATE;

const query = gql`
    query getDeployment($environmentID: String!, $pipelineID: String!) {
        getDeployment(environmentID: $environmentID, pipelineID: $pipelineID) {
            pipelineID
            version
            name
            environmentID
            fromEnvironmentID
            description
            active
            online
            current
            workerGroup
            node_type
            node_type_desc
            schedule
            schedule_type
        }
    }
`;

export const useGetDeployment = () => {
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
            return res?.getDeployment;
        } catch (error) {
            return JSON.parse(JSON.stringify(error, undefined, 2)).response;
        }
    };
};
