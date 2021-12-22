import { gql, GraphQLClient } from "graphql-request";
import { useGlobalAuthState } from "../Auth/UserAuth";

const graphlqlEndpoint = process.env.REACT_APP_GRAPHQL_ENDPOINT_PRIVATE

const Me = gql`{
	    me{
        user_id
        first_name
        last_name
        email
        job_title
        timezone
    }
}
`;

export const useMe = () => { 
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
        const res = await client.request(Me);
        return res?.me;
      } catch (error) {
        return JSON.parse(JSON.stringify(error, undefined, 2)).response
      }
    };
  };