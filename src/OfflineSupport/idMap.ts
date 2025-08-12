export class IdMap {
  private map = new Map<string, string>();

  addMapping(offlineId: string, serverId: string): void {
    this.map.set(offlineId, serverId);
  }

  getServerId(offlineId: string): string | undefined {
    return this.map.get(offlineId);
  }

  getAllMappings(): Map<string, string> {
    return new Map(this.map);
  }

  clearMappings(): void {
    this.map.clear();
  }
}
