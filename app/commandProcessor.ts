import * as net from "net";
import { MultiTransaction } from "./multiTransaction";
import { RESP, type RESPValue } from "./parser";

const write_commands = new Set<string>(["set", "incr"]);
const read_commands = new Set<string>(["get"]);
let map: Map<string, [string, number, number | null]> = new Map();

export class CommandProcessor {
	private multiTransaction: MultiTransaction = MultiTransaction.getInstance();
	private connection: net.Socket | null = null;

	constructor(connection: net.Socket) {
		this.connection = connection;
	}

	private handleSet(command_sequence: RESPValue[], parser: RESP): void {
		const key = command_sequence[1] as string;
		const value = command_sequence[2] as string;
		const expiryValue = parser.getExpiryFlag();
		if (expiryValue) {
			map.set(key, [value, Date.now(), expiryValue]);
		} else {
			map.set(key, [value, Date.now(), null]);
		}
		this.connection?.write("+OK\r\n");
	}

	private handleGet(command_sequence: RESPValue[]): void {
		const key = command_sequence[1] as string;
		const value = map.get(key);
		if (!value) {
			this.connection?.write("$-1\r\n");
		} else {
			let [keyValue, timestamp, expiry] = value;
			if (expiry && Date.now() - timestamp > expiry) {
				this.connection?.write("$-1\r\n");
				map.delete(key);
			} else {
				this.connection?.write(`$${keyValue.length}\r\n${keyValue}\r\n`);
			}
		}
	}

	private handleIncr(command_sequence: RESPValue[]): void {
		const key = command_sequence[1] as string;
		const value = map.get(key);
		if (value) {
			const [keyValue, timestamp, expiry] = value;
			if (!Number(keyValue)) {
				this.connection?.write(
					`-ERR value is not an integer or out of range\r\n`
				);
			} else {
				map.set(key, [String(parseInt(keyValue) + 1), timestamp, expiry]);
				this.connection?.write(`:${parseInt(keyValue) + 1}\r\n`);
			}
		} else {
			map.set(key, ["1", Date.now(), null]);
			this.connection?.write(`:1\r\n`);
		}
	}

	public processCommandSquence(commandSquenceString: string): void {
		const parser = new RESP(commandSquenceString);
		const command_sequence = parser.parsedResult;
		const command = command_sequence[0] as string;
		console.log("command_sequence", command_sequence);
		console.log("transactionFlag", this.multiTransaction.getTransactionFlag());
		this.multiTransaction.printCommandQueue();

		if (this.multiTransaction.getTransactionFlag()) {
			if (write_commands.has(command.toLowerCase())) {
				this.multiTransaction.addCommand(command_sequence);
				this.connection?.write("+QUEUED\r\n");
				return;
			}
		}

		switch (command.toLowerCase()) {
			case "ping":
				this.connection?.write("+PONG\r\n");
				break;

			case "echo":
				const message = command_sequence[1] as string;
				this.connection?.write(`$${message.length}\r\n${message}\r\n`);
				break;

			case "set":
				this.handleSet(command_sequence, parser);
				break;

			case "get":
				this.handleGet(command_sequence);
				break;
			case "incr":
				this.handleIncr(command_sequence);
				break;
			case "multi":
				this.multiTransaction.setTransactionFlag(true);
				this.connection?.write("+OK\r\n");
				break;
			case "exec":
				// this.handleExec();
				if (!this.multiTransaction.getTransactionFlag()) {
					this.connection?.write("-ERR EXEC without MULTI\r\n");
					return;
				}
				if (this.multiTransaction.getQueueSize() === 0) {
					this.connection?.write("*0\r\n");
					this.multiTransaction.setTransactionFlag(false);
				}
				break;
			default:
				this.connection?.write("-ERR unknown command\r\n");
		}
	}
}
