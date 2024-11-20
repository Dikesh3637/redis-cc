import type { RESPValue } from "./parser";
import { Queue } from "./utils/queue";

export class MultiTransaction {
	private transactionFlag: boolean = false;
	private execFlag: boolean = false;
	private commandQueue: Queue<RESPValue[]> = new Queue<RESPValue[]>();

	constructor() {}

	public printCommandQueue(): void {
		this.commandQueue.print();
	}

	public getCommandQueue(): Queue<RESPValue[]> {
		return this.commandQueue;
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

	public getExecFlag(): boolean {
		return this.execFlag;
	}

	public setExecFlag(flag: boolean): void {
		this.execFlag = flag;
	}

	public addCommand(command: RESPValue[]): void {
		if (!this.transactionFlag) {
			throw new Error("No transaction in progress");
		}
		this.commandQueue.enqueue(command);
	}

	public discardTransaction(): void {
		this.commandQueue = new Queue<RESPValue[]>();
		this.transactionFlag = false;
		this.execFlag = false;
	}
}
