// Node types
import ApiNode from '../../components/pipeline/CustomNodesContent/ApiNode';
import PythonNode from '../../components/pipeline/CustomNodesContent/PythonNode';
import BashNode from '../../components/pipeline/CustomNodesContent/BashNode';
import RpaNode from '../../components/pipeline/CustomNodesContent/RpaNode';
import CustomEdge from '../../components/pipeline/CustomNodesContent/CustomEdge';
import PlayNode from '../../components/pipeline/CustomNodesContent/PlayNode';
import ScheduleNode from '../../components/pipeline/CustomNodesContent/ScheduleNode';
import CheckpointNode from '../../components/pipeline/CustomNodesContent/CheckpointNode';

export const nodeTypes = {
    scheduleNode: ScheduleNode,
    playNode: PlayNode,
    apiNode: ApiNode,
    pythonNode: PythonNode,
    bashNode: BashNode,
    rpaNode: RpaNode,
    checkpointNode: CheckpointNode,
};
export const edgeTypes = {
    custom: CustomEdge,
};
