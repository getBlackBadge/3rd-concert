export abstract class IEventEmitterClient {
  abstract emit(event: string, payload: any): void;
}