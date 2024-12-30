export interface Thread {
  id: string;
  title: string;
}

export interface ThreadsResponse {
  count: number;
  results: Thread[];
}
