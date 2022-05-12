import { useEffect, useRef } from 'react';
import ConsoleLogHelper from '../../Helper/logger';
import { useGlobalPipelineRun } from './GlobalPipelineRunUIState';
import { useGlobalRunState } from './GlobalRunState';
import { Downgraded } from '@hookstate/core';

export default function EventRunOpen(runId, Running, setRunning, wsconnect, ReconnectWS) {
    // Global state
    const RunState = useGlobalRunState();
    const FlowState = useGlobalPipelineRun();

    // Websocket state
    const reconnectOnClose = useRef(true);

    // console.log("Run in function 1:", Running)
    // console.log("Run in function 1:", runId)

    return useEffect(() => {
        console.log('Running: ', Running);
        // if(Running===false && wsconnect){
        //     wsconnect.onopen = () => {
        //         ConsoleLogHelper('Not running, close ws');
        //         wsconnect.close();
        //         return;
        //     }
        // }

        function connect() {
            // 1. Set the run state as running
            FlowState.isRunning.set(true);
            RunState.selectedRunID.set(runId);

            console.log('Open trigger');
            console.log('wsconnect in:', wsconnect);

            // 3. On websocket open - trigger run
            wsconnect.onopen = () => {
                ConsoleLogHelper('ws opened - open run');
            };

            wsconnect.onclose = () => {
                // Exit if closing the connection was intentional
                if (!reconnectOnClose.current) {
                    return;
                }

                if (ReconnectWS === false) {
                    return;
                }

                // Reconnect on close
                ConsoleLogHelper('ws trying to reconnect...');
                setTimeout(function () {
                    connect();
                }, 1000);
            };

            wsconnect.onmessage = (e) => {
                //  ConsoleLogHelper('msg rcvd', e.data);

                const response = JSON.parse(e.data);

                // console.log("message:", response)

                // ConsoleLogHelper(
                //     '🧲',
                //     FlowState.elements.get().filter((a) => a.id === response.node_id)[0]?.data.name ||
                //         FlowState.elements.get().filter((a) => a.id === response.node_id)[0]?.type ||
                //         response.MSG,
                //     response.status
                // );

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
                    setRunning(false);
                }

                if (response.status === 'Fail') {
                    const nodes = RunState.runObject.nodes.attach(Downgraded).get();

                    // console.log("n", nodes);

                    for (var key in nodes) {
                        if (nodes[key].status === 'Queue') {
                            RunState.runObject.nodes.merge({
                                [key]: {
                                    status: 'Fail',
                                    updated_by: 'failure',
                                },
                            });

                            // console.log("n", nodes[key]);
                        }
                    }

                    FlowState.isRunning.set(false);
                    RunState.runObject.runEnd.set(response.end_dt);
                    reconnectOnClose.current = false;
                    wsconnect.close();
                    setRunning(false);
                }
            };
        }

        // console.log("Run in function:", Running)
        if (Running === true) {
            connect();

            return () => {
                reconnectOnClose.current = false;
                wsconnect.close();
                setRunning(false);
            };
        } else {
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [Running]);
}
