import React, { useEffect, useState } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, TimeScale, TimeSeriesScale } from 'chart.js';
import 'chartjs-adapter-luxon';
import { Bar } from 'react-chartjs-2';
import { Button } from '@mui/material';
import { Downgraded } from '@hookstate/core';
import { Box } from '@mui/system';
import { useGlobalRunState } from './GlobalRunState';
import { useGlobalMeState } from '../../components/Navbar';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, TimeScale, TimeSeriesScale);

export function Analytics({ setIsOpenAnalytics }) {
    // Global states
    const RunState = useGlobalRunState();
    const MeData = useGlobalMeState();

    const [labels, setLabels] = useState([]);
    const [nodes, setNodes] = useState([]);
    const [data, setData] = useState(null);
    const [height, setHeight] = useState(100);

    // Set nodes on dropdown change
    useEffect(() => {
        if (!MeData.timezone.get()) return;
        RunState.runIDs[RunState.selectedRunID.get()]?.nodes?.attach(Downgraded).get() &&
            setNodes(Object.values(RunState.runIDs[RunState.selectedRunID.get()]?.nodes?.attach(Downgraded).get()).sort((a, b) => a.start_dt?.localeCompare(b.start_dt)));

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [RunState.selectedRunID.get(), MeData.timezone.get()]);

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
                        zone: MeData.timezone.get(),
                    },
                },
                time: {
                    // unit: 'second',
                },
                min: RunState.runIDs[RunState.selectedRunID.get()]?.runStart?.get(),
                max: RunState.runIDs[RunState.selectedRunID.get()]?.runEnd?.get(),
                grid: {
                    display: false,
                },
                ticks: {
                    maxTicksLimit: 8,
                    major: {
                        // enabled: true,
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
                    data: Object.values(RunState.runIDs[RunState.selectedRunID.get()]?.nodes.get())
                        .sort((a, b) => a.start_dt.localeCompare(b.start_dt))
                        .map((a) => [a.start_dt, a.end_dt]),
                    backgroundColor: '#0073C6',
                },
            ],
        });

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [labels]);

    return (
        <Box display="flex" alignItems="flex-start" mt={2}>
            <div style={{ position: 'relative', width: '800px', height, marginRight: 20 }}>
                {data ? ( //
                    <Bar options={options} data={data} />
                ) : null}
            </div>
            <Button onClick={() => setIsOpenAnalytics(false)} variant="outlined" sx={{ position: 'absolute', top: '17px', left: '1089px' }}>
                Close
            </Button>
        </Box>
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
