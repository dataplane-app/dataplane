import { gql, GraphQLClient } from "graphql-request";

const graphlqlEndpoint = "http://localhost:9000/private/graphql"

const GetEnvironments = gql`
    query getEnvironments(){
      getEnvironments{
                id
                name
        }
    }
`;

const jwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJkYXRhcGxhbmUuYXBwIiwic3ViIjoiZDhjMDAxZjYtMmRlZi00YzdmLWIwMWMtYWI3YmUzYWJjZTM1IiwiYXVkIjpbImRhdGFwbGFuZSJdLCJleHAiOjE2Mzk0MTc0OTAsIm5iZiI6MTYzOTQxNzE5MCwiaWF0IjoxNjM5NDE3MTkwLCJqdGkiOiJhMzc3NzY5OC03NGMwLTRjOGEtYjU2NS0wYzQ5MGY2M2EzYWQiLCJhdXRoZW50aWNhdGlvblR5cGUiOiJQQVNTV09SRCIsInByZWZlcnJlZF91c2VybmFtZSI6ImFkbWluQGVtYWlsLmNvbSIsInVzZXJfdHlwZSI6ImFkbWluIiwicGxhdGZvcm1faWQiOiIyZWVlNTdmNi0xZmUyLTQ3ZTEtOGNjZS04NmFmNWRhNjEwNmUifQ.7x9I5b0tGdxWTSVXSA1ORCipoikf5AoAYyOr-MKiaZ4"
export const useGetEnvironments = () => {    
    const client = new GraphQLClient(graphlqlEndpoint, { 
      headers: {
        Authorization: "Bearer " + jwt
      }
    });
  
    return async (input) => {
      try {
        const res = await client.request(GetEnvironments, input);
        console.log("FROM FILE", res);
        return res?.getEnvironments;
      } catch (error) {
        console.log("GraphQl request error:", JSON.parse(JSON.stringify(error)).response);
        return JSON.parse(JSON.stringify(error)).response.error;
      }
    };
  };