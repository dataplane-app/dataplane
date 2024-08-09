// This function will call the api on a public route of the backend
const PublicAPI = async (endpoint, body, method = 'POST') => {
    try {
        var myHeaders = new Headers();

        myHeaders.append('Content-Type', 'application/json');

        var requestOptions = {};

        if (method === 'GET') {
            requestOptions = {
                method: method,
                headers: myHeaders,
            };
        } else {
            requestOptions = {
                method: method,
                headers: myHeaders,
                body: body,
            };
        }

        let res = await fetch(import.meta.env.VITE_API_ENDPOINT_PUBLIC + endpoint, requestOptions);
        return { status: await res.status, body: await res.json() };
    } catch (error) {
        console.error('API Error:', error);
        return { status: 500, body: { error: 'api error' } };
    }
};

export default PublicAPI;
