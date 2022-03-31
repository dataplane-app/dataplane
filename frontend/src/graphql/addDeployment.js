import { gql, GraphQLClient } from 'graphql-request';
import { useGlobalAuthState } from '../Auth/UserAuth';

const graphlqlEndpoint = process.env.REACT_APP_GRAPHQL_ENDPOINT_PRIVATE;

const query = gql`
    mutation addDeployment(
        $pipelineID: String!
        $fromEnvironmentID: String!
        $toEnvironmentID: String!
        $version: String!
        $workerGroup: String!
        $liveactive: Boolean!
        $nodeWorkerGroup: [WorkerGroupsNodes]
    ) {
        addDeployment(
            toEnvironmentID: $toEnvironmentID
            fromEnvironmentID: $fromEnvironmentID
            pipelineID: $pipelineID
            version: $version
            workerGroup: $workerGroup
            liveactive: $liveactive
            nodeWorkerGroup: $nodeWorkerGroup
        )
    }
`;

export const useAddDeployment = () => {
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
            return res?.addDeployment;
        } catch (error) {
            return JSON.parse(JSON.stringify(error, undefined, 2)).response;
        }
    };
};
