import { gql, GraphQLClient } from "graphql-request";

const graphlqlEndpoint = process.env.REACT_APP_GRAPHQL_ENDPOINT_PRIVATE

const GetEnvironments = gql`
    query getEnvironments(){
      getEnvironments{
                id
                name
        }
    }
`;

const jwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJkYXRhcGxhbmUuYXBwIiwic3ViIjoiZDhjMDAxZjYtMmRlZi00YzdmLWIwMWMtYWI3YmUzYWJjZTM1IiwiYXVkIjpbImRhdGFwbGFuZSJdLCJleHAiOjE2Mzk0MjE1NTcsIm5iZiI6MTYzOTQyMTI1NywiaWF0IjoxNjM5NDIxMjU3LCJqdGkiOiIwZWJiYWVhNy0zOGE0LTQ0OWUtYjVjOC0xNmUwYzNjN2NkM2QiLCJhdXRoZW50aWNhdGlvblR5cGUiOiJQQVNTV09SRCIsInByZWZlcnJlZF91c2VybmFtZSI6ImFkbWluQGVtYWlsLmNvbSIsInVzZXJfdHlwZSI6ImFkbWluIiwicGxhdGZvcm1faWQiOiIyZWVlNTdmNi0xZmUyLTQ3ZTEtOGNjZS04NmFmNWRhNjEwNmUifQ.rrld2qRYiWbb444qo9JTS0gdL-d8OOF8zGy2EnMKUY4"
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