import { gql, GraphQLClient } from 'graphql-request';
import { useGlobalAuthState } from '../../Auth/UserAuth';

const graphlqlEndpoint = process.env.REACT_APP_GRAPHQL_ENDPOINT_PRIVATE;

const query = gql`
    query getDeployment($environmentID: String!, $pipelineID: String!, $version: String!) {
        getDeployment(environmentID: $environmentID, pipelineID: $pipelineID, version: $version) {
            pipelineID
            version
            name
            environmentID
            fromEnvironmentID
            description
            active
            online
            deploy_active
            current
            workerGroup
            created_at
            node_type
            node_type_desc
            schedule
            schedule_type
        }
    }
`;

export const useGetDeploymentSingle = () => {
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
