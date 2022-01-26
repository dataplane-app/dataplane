import { Grid, Typography } from '@mui/material';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler } from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

export const options = {
    // responsive: true,
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
        },
    },
};

const labels = ['15:14', '15:16', '15:20', '15:23', '15:26'];

export const data = {
    labels,
    datasets: [
        {
            label: 'Dataset 1',
            data: labels.map(() => Math.random().toFixed(2)),
            borderColor: '#5CC362',
            backgroundColor: '#D5F3DF',
            yAxisID: 'y',
            fill: true,
        },
    ],
};

export default function WorkerDetailCPU({ row }) {
    // const [percentage, load] = row.value;
    console.count('🚀 ~ file: WorkerDetailCPU.jsx ~ line 46 ~ WorkerDetailCPU ~ load');

    return (
        <Grid container direction="row" alignItems="flex-start" justifyContent="end" pr={1}>
            {/* <Grid item mr={1.5}>
                <Typography variant="h2" align="right" sx={{ fontWeight: 900 }}>
                    {percentage}%
                </Typography>
                <Typography variant="body1" align="right" sx={{ fontSize: '1.0625rem' }}>
                    CPU
                </Typography>
                <Typography mt={1} variant="subtitle1" align="right">
                    {load} Load
                </Typography>
            </Grid>

            <Grid item>
                <div style={{ position: 'relative', width: '240px' }}>
                    <Line options={options} data={data} />
                </div>
            </Grid> */}
        </Grid>
    );
}
