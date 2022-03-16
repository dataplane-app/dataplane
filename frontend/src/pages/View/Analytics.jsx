import React, { useEffect, useState } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, TimeScale, TimeSeriesScale } from 'chart.js';
import 'chartjs-adapter-luxon';
import { Bar } from 'react-chartjs-2';
import { Button } from '@mui/material';
import { useGlobalRunState } from './useWebSocket';
import { Downgraded } from '@hookstate/core';
import { useMe } from '../../graphql/me';
import { useSnackbar } from 'notistack';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, TimeScale, TimeSeriesScale);

export function Analytics({ setIsOpenAnalytics }) {
    // Global states
    const RunState = useGlobalRunState();

    const [labels, setLabels] = useState([]);
    const [nodes, setNodes] = useState([]);
    const [data, setData] = useState(null);
    const [height, setHeight] = useState(100);
    const [timezone, setTimezone] = useState('');

    // Graphql hook
    const getMe = useMeHook(setTimezone);

    // Get user's timezone on load
    useEffect(() => {
        getMe();
    }, []);

    // Set nodes on dropdown change
    useEffect(() => {
        if (!timezone) return;
        setNodes(
            Object.entries(RunState.attach(Downgraded).get())
                .filter(([key, value]) => value?.status && value?.end_dt && value?.start_dt)
                .map((a) => a[1])
                .sort((a, b) => a.start_dt?.localeCompare(b.start_dt))
        );

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [RunState.dropdownRunId.get(), timezone]);

    // Set labels, chart height on nodes change
    useEffect(() => {
        setLabels(Object.keys(nodes).map((a) => nodes[a].name || formatType(nodes[a].type)));

        // 7 rows=>500px, 6=>440, 5=> 380, 4=> 320, 3 => 260,  2=>220, 1=>100
        if (nodes.length === 1) {
            setHeight(100);
        } else if (nodes.length === 2) {
            setHeight(220);
        } else if (nodes.length > 2) {
            setHeight(200 + (nodes.length - 2) * 60);
        }
    }, [nodes]);

    const options = {
        animation: { duration: 0 },
        skipNull: true,
        indexAxis: 'y',
        elements: {},
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                // backgroundColor: 'white',
                intersect: false,
                mode: 'y',
                padding: 8,
                displayColors: false,
                callbacks: {
                    label: function (context) {
                        return timeElapsed(context.raw[0], context.raw[1]);
                    },
                    // afterTitle: function (context) {
                    //     return 'hi';
                    // },
                },
            },
        },
        scales: {
            x: {
                type: 'time',
                adapters: {
                    date: {
                        zone: timezone,
                    },
                },
                time: {
                    // unit: 'second',
                },
                min: nodes[0]?.start_dt,
                grid: {
                    display: false,
                },
                ticks: {
                    maxTicksLimit: 8,
                    major: {
                        enabled: true,
                    },
                    // count: 100,
                    // precision: 1,
                    // stepsize: 10000000,
                },
            },
            y: {
                grid: {
                    display: false,
                },
            },
        },
    };

    // Set data on labels change
    useEffect(() => {
        setData({
            labels: labels,
            datasets: [
                {
                    // label: 'Dataset 1',
                    // barThickness: 50,
                    // categoryPercentage: 0.3,
                    // maxBarThickness: 8,
                    // minBarLength: 20,
                    data: nodes.map((a) => (!a['start_dt'] || !a['end_dt'] ? null : [a['start_dt'], a['end_dt']])),
                    backgroundColor: '#0073C6',
                },
            ],
        });
    }, [labels]);

    return (
        <>
            <Button onClick={() => setIsOpenAnalytics(false)}>Close</Button>
            <div style={{ position: 'relative', width: '800px', height }}>
                {data ? ( //
                    <Bar options={options} data={data} />
                ) : null}
            </div>
        </>
    );
}

function formatType(type) {
    type = type.replace('Node', '');
    return type.charAt(0).toUpperCase() + type.slice(1);
}

// Utility functions
function timeElapsed(startDate, endDate) {
    let ticks = new Date(endDate) - new Date(startDate); //?
    var hh = Math.floor(ticks / 3600 / 1000);
    var mm = Math.floor((ticks % 3600) / 60 / 1000);
    var ss = (ticks / 1000) % 60;

    return pad(hh, 2) + ':' + pad(mm, 2) + ':' + pad(ss, 2);
}

function pad(n, width) {
    const num = n + '';
    return num.length >= width ? num : new Array(width - num.length + 1).join('0') + n;
}

// ----- Custom hook
export const useMeHook = (setTimezone) => {
    // GraphQL hook
    const getMe = useMe();

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    // Get timezone
    return async () => {
        const response = await getMe();

        if (response.r === 'error') {
            closeSnackbar();
            enqueueSnackbar("Can't get timezone: " + response.msg, { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            setTimezone(response.timezone);
        }
    };
};
