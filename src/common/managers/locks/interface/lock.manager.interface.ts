export interface ILockManager {
    withLockBySrc<T>(resourceId: string, resourceType: string, operation: () => Promise<T>): Promise<T>;
}