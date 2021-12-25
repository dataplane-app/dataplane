import { gql, GraphQLClient } from "graphql-request";
import { useGlobalAuthState } from "../Auth/UserAuth";

const graphlqlEndpoint = process.env.REACT_APP_GRAPHQL_ENDPOINT_PRIVATE

const GetPlatform = gql`
    query getPlatform(){
      getPlatform{
                id
                business_name
                timezone
                complete
        }
    }
`;

export const useGetPlatform = () => { 
    const authState = useGlobalAuthState();
    const jwt = authState.authToken.get();

    const headers = {
      Authorization: "Bearer " + jwt,
    };
  
    const client = new GraphQLClient(graphlqlEndpoint, {
      headers,
    });
  
    return async () => {
      try {
        const res = await client.request(GetPlatform);
        return res?.getPlatform;
      } catch (error) {
        return JSON.parse(JSON.stringify(error, undefined, 2)).response
      }
    };
  };