import { gql, GraphQLClient } from 'graphql-request';
import { useGlobalAuthState } from '../../Auth/UserAuth';

const graphlqlEndpoint = import.meta.env.VITE_GRAPHQL_ENDPOINT_PRIVATE;

const UpdateEnvironment = gql`
    query getDeploymentRuns($deploymentID: String!, $environmentID: String!, $version: String!) {
        getDeploymentRuns(deploymentID: $deploymentID, environmentID: $environmentID, version: $version) {
            run_id
            pipeline_id
            status
            environment_id
            deploy_version
            run_json
            created_at
            ended_at
        }
    }
`;

export const useGetDeploymentRuns = () => {
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
            const res = await client.request(UpdateEnvironment, input);
            return res?.getDeploymentRuns;
        } catch (error) {
            return JSON.parse(JSON.stringify(error, undefined, 2)).response;
        }
    };
};
