import { Grid, Typography } from '@mui/material';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler } from 'chart.js';
import { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

export const options = {
    interaction: {
        mode: 'index',
        intersect: false,
    },
    stacked: false,
    plugins: {
        legend: {
            display: false,
        },
    },
    scales: {
        y: {
            type: 'linear',
            display: true,
            position: 'left',
            min: 0,
            max: 100,
            ticks: {
                stepSize: 5,
            },
        },
    },
};

export default function WorkerDetailMemory({ row }) {
    const [dataStream, setDataStream] = useState([]);
    const [labels, setLabels] = useState(['']);

    useEffect(() => {
        // Make sure date is not null
        if (row.value[2]) {
            // If labels length is 5, remove the oldest.
            if (labels.length > 4) {
                setLabels([...labels.slice(1), timeLabel(row.value[2])]);
            } else {
                setLabels([...labels, timeLabel(row.value[2])]);
            }

            // If dataStrem length is 5, remove the oldest.
            if (dataStream.length > 4) {
                setDataStream([...dataStream.slice(1), { MemoryPerc: row.value[0], Interval: row.value[1], T: row.value[2] }]);
            } else {
                setDataStream([...dataStream, { MemoryPerc: row.value[0], Interval: row.value[1], T: row.value[2] }]);
            }
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [row.value]);

    const chartData = {
        labels,
        datasets: [
            {
                data: dataStream.map((a) => a.MemoryPerc),
                borderColor: '#4777DF',
                backgroundColor: '#D8E2F8',
                yAxisID: 'y',
                fill: true,
            },
        ],
    };

    const [percentage, mb] = row.value;

    return (
        <Grid container direction="row" alignItems="flex-start" pr={1}>
            <Grid item mr={1.5}>
                <Typography variant="h2" align="right" sx={{ fontWeight: 900 }}>
                    {percentage}%
                </Typography>
                <Typography variant="h2" align="right" sx={{ fontWeight: 900 }}>
                    {mb}
                </Typography>
                <Typography variant="body1" align="right" sx={{ fontSize: '1.0625rem' }}>
                    Memory
                </Typography>
            </Grid>

            <Grid item>
                <div style={{ position: 'relative', width: '240px' }}>
                    <Line options={options} data={chartData} />
                </div>
            </Grid>
        </Grid>
    );
}

// ----------- Utility Functions

/**
 * Takes a date string, returns minutes with seconds
 * @param {string} dateString 2022-01-20T13:27:08Z
 * @return {string} 27:08
 * @example "2022-01-20T13:27:08Z" => "27:08"
 */
function timeLabel(dateString) {
    let dd = new Date(dateString);
    return `${('0' + dd.getMinutes()).slice(-2)}:${('0' + dd.getSeconds()).slice(-2)}`;
}
