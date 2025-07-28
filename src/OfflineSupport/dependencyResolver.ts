import { OfflineWritesEntry } from "./AppcacheDB";

/**
 * Build a dependency graph from the list of writes.
 * Each node is a write ID, and edges point from parent to child.
 */
export function buildDependencyGraph(
  writes: OfflineWritesEntry[],
): Map<string, string[]> {
  const graph = new Map<string, string[]>();

  // Initialize every node with an empty array
  for (const write of writes) {
    graph.set(write.id, []);
  }

  // Add edges: for each write, add itself as a child to each of its parents
  for (const write of writes) {
    for (const parentId of write.parentMutationIds || []) {
      if (graph.has(parentId)) {
        graph.get(parentId)!.push(write.id);
      }
    }
  }

  return graph;
}

/**
 * Topologically sort the writes so parents come before children.
 * Siblings (same level) are sorted by clientTimestamp (oldest first).
 */
export function topologicalSort(
  writes: OfflineWritesEntry[],
): OfflineWritesEntry[] {
  const graph = buildDependencyGraph(writes);
  const inDegree = new Map<string, number>();
  const idToWrite = new Map<string, OfflineWritesEntry>();

  // Initialize in-degree and idToWrite
  for (const write of writes) {
    idToWrite.set(write.id, write);
    inDegree.set(write.id, 0);
  }

  // Compute in-degree for each node
  for (const write of writes) {
    for (const _ of write.parentMutationIds || []) {
      inDegree.set(write.id, (inDegree.get(write.id) || 0) + 1);
    }
  }

  // Initialize queue with nodes of in-degree 0, sorted by clientTimestamp
  let queue = writes
    .filter((w) => inDegree.get(w.id) === 0)
    .sort((a, b) => (a.clientTimestamp || 0) - (b.clientTimestamp || 0));

  const result: OfflineWritesEntry[] = [];

  // Process queue
  while (queue.length > 0) {
    const current = queue.shift()!;
    result.push(current);

    for (const childId of graph.get(current.id) || []) {
      inDegree.set(childId, inDegree.get(childId)! - 1);
      if (inDegree.get(childId) === 0) {
        queue.push(idToWrite.get(childId)!);
        // Keep queue sorted by clientTimestamp
        queue.sort(
          (a, b) => (a.clientTimestamp || 0) - (b.clientTimestamp || 0),
        );
      }
    }
  }

  return result;
}
