import { Grid } from '@mui/material';
import CustomChip from '../../components/CustomChip';
import { useGlobalFlowState } from '../Flow';
import { useGlobalRunState } from './GlobalRunState';

export default function StatusChips() {
    // Global state
    const RunState = useGlobalRunState();
    const FlowState = useGlobalFlowState();

    return (
        <Grid item display="flex" alignItems="center" sx={{ alignSelf: 'center' }} ml={3} mr={1}>
            <CustomChip amount={Object.values(FlowState.elements?.get()).filter((a) => a.type !== 'custom').length || '0'} label="Steps" margin={2} customColor="orange" />
            <CustomChip
                amount={(RunState.nodes.get() && Object.values(RunState.nodes.get())?.filter((a) => a?.status === 'Queue').length) || '0'}
                label="Queue"
                margin={2}
                customColor="purple"
            />
            <CustomChip
                amount={(RunState.nodes.get() && Object.values(RunState.nodes.get())?.filter((a) => a?.status === 'Run').length) || '0'}
                label="Running"
                margin={2}
                customColor="blue"
            />
            <CustomChip
                amount={(RunState.nodes.get() && Object.values(RunState.nodes.get())?.filter((a) => a?.status === 'Success').length) || '0'}
                label="Succeeded"
                margin={2}
                customColor="green"
            />
            <CustomChip
                amount={(RunState.nodes.get() && Object.values(RunState.nodes.get())?.filter((a) => a?.status === 'Fail').length) || '0'}
                label="Failed"
                margin={2}
                customColor="red"
            />
        </Grid>
    );
}
