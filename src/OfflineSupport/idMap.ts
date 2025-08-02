// Utility for mapping offline-generated IDs to server-generated IDs after sync.

export class IdMap {
  private map = new Map<string, string>();

  // Add a mapping from an offline ID to a server ID.

  addMapping(offlineId: string, serverId: string): void {
    this.map.set(offlineId, serverId);
  }

  // Get the server ID for a given offline ID, or undefined if not mapped.

  getServerId(offlineId: string): string | undefined {
    return this.map.get(offlineId);
  }

  // Pre-populate IdMap with all successful sync records from pending writes
  prePopulateFromSuccessfulSyncs(successfulWrites: any[]): void {
    console.log("Pre-populating IdMap from successful sync records...");

    let mappingsAdded = 0;

    for (const write of successfulWrites) {
      // Check if this is an offline ID that was successfully synced
      if (write.id.startsWith("offline-") && write.response) {
        const response = write.response as any;

        // Extract server ID from response based on resource type
        let serverId: string | undefined;

        if (response.id) {
          serverId = response.id;
        } else if (response.data?.id) {
          serverId = response.data.id;
        }
        if (serverId) {
          // Add mapping if it doesn't already exist
          if (!this.map.has(write.id)) {
            this.addMapping(write.id, serverId);
            mappingsAdded++;
            console.log(
              `Added mapping: ${write.id} → ${serverId} (${write.type})`,
            );
          } else {
            // Update existing mapping if server ID is different
            const existingServerId = this.map.get(write.id);
            if (existingServerId !== serverId) {
              this.addMapping(write.id, serverId);
              console.log(
                `Updated mapping: ${write.id} → ${serverId} (was: ${existingServerId})`,
              );
            }
          }
        }
      }
    }

    console.log(
      `Pre-populated IdMap with ${mappingsAdded} mappings from ${successfulWrites.length} successful sync records`,
    );
  }

  // Get all current mappings (for debugging)
  getAllMappings(): Map<string, string> {
    return new Map(this.map);
  }

  // Clear all mappings (for testing)
  clearMappings(): void {
    this.map.clear();
  }

  // pruneUnusedMappings(usedOfflineIds: string[]): void {
  //   for (const key of this.map.keys()) {
  //     if (!usedOfflineIds.includes(key)) {
  //       this.map.delete(key);
  //     }
  //   }
  // }
}
