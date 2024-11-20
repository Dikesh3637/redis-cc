import type { RESPValue } from "./parser";
import { Queue } from "./utils/queue";

export class MultiTransaction {
    private static instance: MultiTransaction | null = null;
    private transactionFlag: boolean = false;
    private commandQueue: Queue<RESPValue[]> = new Queue<RESPValue[]>();

    private constructor() {}

    public static getInstance(): MultiTransaction {
        if (!MultiTransaction.instance) {
            MultiTransaction.instance = new MultiTransaction();
        }
        return MultiTransaction.instance;
    }

    public static resetInstance(): void {
        MultiTransaction.instance = null;
    }

    public printCommandQueue(): void {
        this.commandQueue.print(); 
    }

    public getQueueSize(): number {
        return this.commandQueue.getSize();
    }

    public getTransactionFlag(): boolean {
        return this.transactionFlag;
    }

    public setTransactionFlag(flag: boolean): void {
        this.transactionFlag = flag;
    }

    public addCommand(command: RESPValue[]): void {
        if (!this.transactionFlag) {
            throw new Error('No transaction in progress');
        }
        this.commandQueue.enqueue(command);
    }

    public executeTransaction(): void {
		//execute the transaction
    }

    public discardTransaction(): void {
        this.commandQueue = new Queue<RESPValue[]>();
        this.transactionFlag = false;
    }
}