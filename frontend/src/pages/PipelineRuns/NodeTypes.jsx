// Node types
import ApiNode from '../Pipelines/Components/NodeTypes/ApiNode';
import PythonNode from '../Pipelines/Components/NodeTypes/PythonNode';
import BashNode from '../Pipelines/Components/NodeTypes/BashNode';
import RpaNode from '../Pipelines/Components/NodeTypes/RpaNode';
import CustomEdge from '../Pipelines/Components/NodeTypes/CustomEdge';
import PlayNode from '../Pipelines/Components/NodeTypes/PlayNode';
import ScheduleNode from '../Pipelines/Components/NodeTypes/ScheduleNode';
import CheckpointNode from '../Pipelines/Components/NodeTypes/CheckpointNode';

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
