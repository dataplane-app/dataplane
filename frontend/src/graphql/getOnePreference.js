import { gql, GraphQLClient } from "graphql-request";
import { useGlobalAuthState } from "../Auth/UserAuth";

const graphlqlEndpoint = process.env.REACT_APP_GRAPHQL_ENDPOINT_PRIVATE

const GetOnePreference = gql`
    query getOnePreference($preference: String!){
      getOnePreference(preference: $preference){
    value
    }
  }
`;

export const useGetOnePreference = () => { 
    const authState = useGlobalAuthState();
    const jwt = authState.authToken.get();

    const headers = {
      Authorization: "Bearer " + jwt,
    };
  
    const client = new GraphQLClient(graphlqlEndpoint, {
      headers,
    });
  
    return async (input) => {
      try {
        const res = await client.request(GetOnePreference, input);
        return res?.getOnePreference;
      } catch (error) {
        return JSON.parse(JSON.stringify(error, undefined, 2)).response
      }
    };
  };