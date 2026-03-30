import type { NodeCategory, NodeFormValues, NodeTypeId } from "./nodeRegistry";

export interface PipelineNodeInstance {
  id: string; // ReactFlow node id
  nodeTypeId: NodeTypeId;
  name: string; // exported JSON key
  category: NodeCategory;
  formValues: NodeFormValues;
  position: { x: number; y: number };
}

export interface PipelineEdgeInstance {
  id: string;
  sourceNodeId: string; // internal node id
  targetNodeId: string; // internal node id
}

export interface VectorPipelineJson {
  data_dir: string;
  sources: Record<string, unknown>;
  transforms: Record<string, unknown>;
  sinks: Record<string, unknown>;
}

export const NODE_NAME_REGEX = /^[a-z0-9_-]+$/;

