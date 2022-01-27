import { useEffect, useRef, useState } from 'react';

export default function useWebSocket() {
    const [socketResponse, setSocketResponse] = useState([]);
    const ws = useRef(null);

    useEffect(() => {
        ws.current = new WebSocket('ws://localhost:9000/ws/workerstats/python_1');
        ws.current.onopen = () => console.log('ws opened');
        ws.current.onclose = () => console.log('ws closed');

        ws.current.onmessage = (e) => {
            setSocketResponse(JSON.parse(e.data));
        };

        return () => {
            ws.current.close();
        };
    }, []);

    return socketResponse;
}
