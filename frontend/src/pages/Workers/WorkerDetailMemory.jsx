import { Grid, Typography } from '@mui/material';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler } from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

export const options = {
    responsive: true,
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
            data: labels.map(() => Math.floor(Math.random() * Math.floor(1000)) / 10),
            borderColor: '#4777DF',
            backgroundColor: '#D8E2F8',
            yAxisID: 'y',
            fill: true,
        },
    ],
};

export default function WorkerDetailMemory({ row }) {
    const [percentage, mb] = row.value;
    console.count('🚀 ~ file: WorkerDetailMemory.jsx ~ line 46 ~ WorkerDetailMemory ~ mb', mb);

    return (
        <Grid container direction="row" alignItems="flex-start" pr={1}>
            <Grid item mr={1.5}>
                <Typography variant="h2" align="right" sx={{ fontWeight: 900 }}>
                    {percentage}%
                </Typography>
                <Typography variant="h2" align="right" sx={{ fontWeight: 900 }}>
                    {mb}MB
                </Typography>
                <Typography variant="body1" align="right" sx={{ fontSize: '1.0625rem' }}>
                    Memory
                </Typography>
            </Grid>

            <Grid item>
                <div style={{ position: 'relative', width: '240px' }}>
                    <Line options={options} data={data} />
                </div>
            </Grid>
        </Grid>
    );
}
