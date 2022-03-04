import { Box } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { LazyLog, ScrollFollow } from 'react-lazylog';
import { useGlobalRunState } from '../../../pages/View/useWebSocket';

const websocketEndpoint = process.env.REACT_APP_WEBSOCKET_ROOMS_ENDPOINT;

const LogsDrawer = ({ environmentId }) => {
    const [url, setUrl] = useState();

    const RunState = useGlobalRunState();

    useEffect(() => {
        if (!RunState.node_id.get() || !RunState.run_id.get()) return;
        setUrl(`${websocketEndpoint}/${environmentId}?subject=workerlogs.${RunState.run_id.get()}.${RunState.node_id.get()}&id=${RunState.run_id.get()}.${RunState.node_id.get()}`);

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [RunState.node_id.get(), RunState.run_id.get()]);

    return (
        <>
            {url ? (
                <Box height="100%" width="100%" bgcolor="#000">
                    <ScrollFollow startFollowing={true} render={({ follow, onScroll }) => <LazyLog url={url} websocket stream follow={follow} onScroll={onScroll} />} />
                </Box>
            ) : null}
        </>
    );
};

export default LogsDrawer;
