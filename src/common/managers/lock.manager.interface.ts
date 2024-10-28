export interface LockManagerInterface {
    withLock(src_type: string, src_id: string): Promise<>;
  }