// Node types
import ApiNode from '../../components/CustomNodesContent/ApiNode';
import PythonNode from '../../components/CustomNodesContent/PythonNode';
import BashNode from '../../components/CustomNodesContent/BashNode';
import CustomEdge from '../../components/CustomNodesContent/CustomEdge';
import PlayNode from '../../components/CustomNodesContent/PlayNode';
import ScheduleNode from '../../components/CustomNodesContent/ScheduleNode';
import CheckpointNode from '../../components/CustomNodesContent/CheckpointNode';

export const nodeTypes = {
    scheduleNode: ScheduleNode,
    playNode: PlayNode,
    apiNode: ApiNode,
    pythonNode: PythonNode,
    bashNode: BashNode,
    checkpointNode: CheckpointNode,
};
export const edgeTypes = {
    custom: CustomEdge,
};
