import type { NodeDefinition, NodeTypeId } from "./nodeRegistry";
import { nodeRegistry } from "./nodeRegistry";
import type { PipelineEdgeInstance, PipelineNodeInstance, VectorPipelineJson } from "./pipelineTypes";
import { NODE_NAME_REGEX } from "./pipelineTypes";

export type ExportResult =
  | {
      ok: true;
      json: VectorPipelineJson;
    }
  | {
      ok: false;
      errors: string[];
    };

type NodeRegistry = Record<NodeTypeId, NodeDefinition>;

export function exportPipelineToVectorJson(args: {
  nodes: PipelineNodeInstance[];
  edges: PipelineEdgeInstance[];
  registry?: NodeRegistry;
  dataDir: string;
}): ExportResult {
  const registry: NodeRegistry = args.registry ?? (nodeRegistry as NodeRegistry);

  const errors: string[] = [];

  const nodesById = new Map<string, PipelineNodeInstance>();
  for (const n of args.nodes) {
    if (!n.nodeTypeId || !registry[n.nodeTypeId]) {
      errors.push(`Unknown node type for node id "${n.id}".`);
      continue;
    }
    nodesById.set(n.id, n);
  }

  // Validate node names: required, regex, unique across all nodes (JSON keys must be unique)
  const usedNames = new Map<string, string>(); // name -> nodeId
  for (const n of args.nodes) {
    if (!n.name || typeof n.name !== "string") {
      errors.push(`Node "${n.id}" is missing a name.`);
      continue;
    }
    if (!NODE_NAME_REGEX.test(n.name)) {
      errors.push(
        `Node name "${n.name}" is invalid. Use lowercase, non-space characters (a-z, 0-9, "_" or "-").`
      );
      continue;
    }
    if (usedNames.has(n.name) && usedNames.get(n.name) !== n.id) {
      errors.push(`Duplicate node name "${n.name}" would overwrite JSON output.`);
    } else {
      usedNames.set(n.name, n.id);
    }
  }

  const incomingByTarget = new Map<string, PipelineEdgeInstance[]>();
  for (const e of args.edges) {
    if (!nodesById.has(e.sourceNodeId)) {
      errors.push(`Edge "${e.id}" references unknown source node "${e.sourceNodeId}".`);
      continue;
    }
    if (!nodesById.has(e.targetNodeId)) {
      errors.push(`Edge "${e.id}" references unknown target node "${e.targetNodeId}".`);
      continue;
    }
    const list = incomingByTarget.get(e.targetNodeId) ?? [];
    list.push(e);
    incomingByTarget.set(e.targetNodeId, list);
  }

  // Validate connections: single-input for non-source nodes + allowed upstream compatibility
  for (const n of args.nodes) {
    const def = registry[n.nodeTypeId];
    const incoming = incomingByTarget.get(n.id) ?? [];

    if (def.category === "source") {
      if (incoming.length > 0) {
        errors.push(`Source node "${n.name}" must not have incoming edges.`);
      }
      continue;
    }

    // transform or sink
    if (incoming.length !== 1) {
      errors.push(
        `Node "${n.name}" must have exactly one incoming edge (single-input rule).`
      );
      continue;
    }

    const parentNode = nodesById.get(incoming[0].sourceNodeId);
    if (!parentNode) continue;

    if (!def.allowedInputFromNodeTypeIds.includes(parentNode.nodeTypeId)) {
      errors.push(
        `Invalid connection to "${n.name}". Expected one of: ${def.allowedInputFromNodeTypeIds.join(
          ", "
        )}; got "${parentNode.nodeTypeId}".`
      );
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const sources: Record<string, unknown> = {};
  const transforms: Record<string, unknown> = {};
  const sinks: Record<string, unknown> = {};

  for (const n of args.nodes) {
    const def = registry[n.nodeTypeId];
    const incoming = incomingByTarget.get(n.id) ?? [];
    const inputNames = incoming.map((e) => nodesById.get(e.sourceNodeId)!.name);

    const cfg = def.buildVectorConfig({
      inputs: inputNames,
      formValues: n.formValues,
    });

    const key = n.name;
    if (def.category === "source") sources[key] = cfg;
    else if (def.category === "transform") transforms[key] = cfg;
    else sinks[key] = cfg;
  }

  const json: VectorPipelineJson = {
    data_dir: args.dataDir,
    sources,
    transforms,
    sinks,
  };

  return { ok: true, json };
}

