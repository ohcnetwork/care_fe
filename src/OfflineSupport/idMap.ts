/**
 * Utility for mapping offline-generated IDs to server-generated IDs after sync.
 */
export class IdMap {
  private map = new Map<string, string>();

  /**
   * Add a mapping from an offline ID to a server ID.
   */
  addMapping(offlineId: string, serverId: string): void {
    this.map.set(offlineId, serverId);
  }

  /**
   * Get the server ID for a given offline ID, or undefined if not mapped.
   */
  getServerId(offlineId: string): string | undefined {
    return this.map.get(offlineId);
  }

  /**
   * Remove mappings that are no longer needed (not in usedOfflineIds).
   * Call this after syncing to keep the map clean.
   */
  pruneUnusedMappings(usedOfflineIds: string[]): void {
    for (const key of this.map.keys()) {
      if (!usedOfflineIds.includes(key)) {
        this.map.delete(key);
      }
    }
  }
}
