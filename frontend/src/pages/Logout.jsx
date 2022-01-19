import { useEffect } from 'react';
import { useLogoutUser } from '../graphql/logoutUser';
import { useHistory } from 'react-router-dom';

const Logout = () => {
    const logoutUser = useLogoutUser();
    const history = useHistory();

    useEffect(() => {
        (async () => {
            const response = await logoutUser();
            if (!response.errors) {
                localStorage.removeItem('refresh_token');
                history.push('/login');
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return null;
};

export default Logout;
