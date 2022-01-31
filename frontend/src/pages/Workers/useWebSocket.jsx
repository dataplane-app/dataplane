import { useEffect, useRef, useState } from 'react';

export default function useWebSocket(workerId) {
    const [socketResponse, setSocketResponse] = useState([]);
    const ws = useRef(null);

    useEffect(() => {
        ws.current = new WebSocket(`ws://localhost:9000/ws/workerstats/${workerId}`);
        ws.current.onopen = () => console.log('ws opened');
        ws.current.onclose = () => console.log('ws closed');

        ws.current.onmessage = (e) => {
            setSocketResponse(JSON.parse(e.data));
        };

        return () => {
            ws.current.close();
        };
    }, [workerId]);

    // Make sure socket response is matching the worked id requested.
    if (socketResponse.WorkerGroup === workerId) {
        return socketResponse;
    } else {
        return [];
    }
}
