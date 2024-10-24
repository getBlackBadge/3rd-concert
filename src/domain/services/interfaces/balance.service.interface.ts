export interface BalanceServiceInterface {
  getBalanceByUserId(userId: string): Promise<number>;
  chargeBalance(userId: string, amount: number): Promise<void>;
  decreaseBalance(userId: string, amount: number): Promise<void>;
}