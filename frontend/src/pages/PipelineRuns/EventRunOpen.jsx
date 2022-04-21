import { useEffect, useRef } from 'react';
import ConsoleLogHelper from '../../Helper/logger';
import { useGlobalPipelineRun} from './GlobalPipelineRunUIState'
import { useGlobalRunState } from './GlobalRunState';


export default function EventRunOpen(runId, Running, setRunning, wsconnect) {
    // Global state
    const RunState = useGlobalRunState();
    const FlowState = useGlobalPipelineRun();

    // Websocket state
    const reconnectOnClose = useRef(true);

    return useEffect(() => {

        function connect() {

            // 1. Set the run state as running
            FlowState.isRunning.set(true);

            // 3. On websocket open - trigger run
            wsconnect.onopen = () => {
                ConsoleLogHelper('ws opened');

            };

            wsconnect.onclose = () => {
                // Exit if closing the connection was intentional
                if (!reconnectOnClose.current) {
                    return;
                }

                // Reconnect on close
                ConsoleLogHelper('ws trying to reconnect...');
                setTimeout(function () {
                    connect();
                }, 1000);
            };

            wsconnect.onmessage = (e) => {
                // ConsoleLogHelper('msg rcvd', e.data);
                
                const response = JSON.parse(e.data);

                // console.log("message:", response)

                ConsoleLogHelper(
                    '🧲',
                    FlowState.elements.get().filter((a) => a.id === response.node_id)[0]?.data.name ||
                        FlowState.elements.get().filter((a) => a.id === response.node_id)[0]?.type ||
                        response.MSG,
                    response.status
                );

                // Add only if a node message, not MSG.
                if (response.node_id) {
                    RunState.runObject?.nodes.merge({
                        [response.node_id]: {
                            status: response.status,
                            start_dt: response.start_dt,
                            end_dt: response.end_dt,
                            name: FlowState.elements.get().filter((a) => a.id === response.node_id)[0].data.name,
                            type: FlowState.elements.get().filter((a) => a.id === response.node_id)[0].type,
                            updated_by: 'websockets',
                        },
                    });
                }

                if (response.MSG === 'pipeline_complete') {
                    FlowState.isRunning.set(false);
                    RunState.runObject?.runEnd.set(response.ended_at);

                    reconnectOnClose.current = false;
                    wsconnect.close();
                    setRunning(false)
                }
            };
        }

        if (Running === true){
        connect();
        

        return () => {
            reconnectOnClose.current = false;
            wsconnect.close();
            setRunning(false)
        };
    }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [runId]);
}
