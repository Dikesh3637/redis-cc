import * as net from "net";
import { MultiTransaction } from "./multiTransaction";
import { RESP, type RESPValue } from "./parser";
import { getExpiryFlag } from "./utils/commandFeatureExtraction";

let map: Map<string, [string, number, number | null]> = new Map();
let socketToTransaction: Map<net.Socket, MultiTransaction> = new Map();
let write_command: Set<string> = new Set(["set", "incr"]);
let read_command: Set<string> = new Set(["get"]);

export class CommandProcessor {
	private multiTransaction: MultiTransaction = MultiTransaction.getInstance();
	private connection: net.Socket;

	constructor(connection: net.Socket) {
		this.connection = connection;
	}

	private handleExec(): string {
		const commandQueue = this.multiTransaction.getCommandQueue();
		this.multiTransaction.setExecFlag(true);
		let commandSequence = commandQueue.dequeue();
		const results: string[] = [];
		while (commandSequence) {
			let res = this.processCommand(commandSequence);
			if (res) {
				results.push(res);
			}
			commandSequence = commandQueue.dequeue();
		}
		let arrayString = `*${results.length}\r\n`;
		for (const result of results) {
			if (result === "") {
				continue;
			}
			arrayString += result;
		}
		this.multiTransaction.discardTransaction();
		socketToTransaction.delete(this.connection);
		return arrayString;
	}

	private handleSet(command_sequence: RESPValue[]): string {
		const key = command_sequence[1] as string;
		const value = command_sequence[2] as string;
		const expiryValue = getExpiryFlag(command_sequence);
		if (expiryValue) {
			map.set(key, [value, Date.now(), expiryValue]);
		} else {
			map.set(key, [value, Date.now(), null]);
		}
		return "+OK\r\n";
	}

	private handleGet(command_sequence: RESPValue[]): string {
		const key = command_sequence[1] as string;
		const value = map.get(key);
		if (!value) {
			return "$-1\r\n";
		} else {
			let [keyValue, timestamp, expiry] = value;
			if (expiry && Date.now() - timestamp > expiry) {
				map.delete(key);
				return "$-1\r\n";
			} else {
				return `$${keyValue.length}\r\n${keyValue}\r\n`;
			}
		}
	}

	private handleIncr(command_sequence: RESPValue[]): string {
		const key = command_sequence[1] as string;
		const value = map.get(key);
		if (value) {
			const [keyValue, timestamp, expiry] = value;
			if (!Number(keyValue)) {
				return `-ERR value is not an integer or out of range\r\n`;
			} else {
				map.set(key, [String(parseInt(keyValue) + 1), timestamp, expiry]);
				return `:${parseInt(keyValue) + 1}\r\n`;
			}
		} else {
			map.set(key, ["1", Date.now(), null]);
			return `:1\r\n`;
		}
	}

	public processCommandSquence(input: string | RESPValue[]): void {
		let commandSequence: RESPValue[] = [];
		if (typeof input === "string") {
			let parser = new RESP(input);
			commandSequence = parser.parsedResult;
		} else {
			commandSequence = input as RESPValue[];
		}
		const message = this.processCommand(commandSequence);
		this.connection.write(message);
	}

	public processCommand(command_sequence: RESPValue[]): string {
		const command = command_sequence[0] as string;

		if (
			this.multiTransaction.getTransactionFlag() &&
			!this.multiTransaction.getExecFlag() &&
			socketToTransaction.has(this.connection)
		) {
			if (command.toLowerCase() !== "exec") {
				this.multiTransaction.addCommand(command_sequence);
				return "+QUEUED\r\n";
			}
		}

		switch (command.toLowerCase()) {
			case "ping":
				return "+PONG\r\n";

			case "echo":
				let message = command_sequence[1] as string;
				return `$${message.length}\r\n${message}\r\n`;

			case "set":
				return this.handleSet(command_sequence);

			case "get":
				return this.handleGet(command_sequence);

			case "incr":
				return this.handleIncr(command_sequence);

			case "multi":
				this.multiTransaction = MultiTransaction.getInstance();
				this.multiTransaction.setTransactionFlag(true);
				socketToTransaction.set(this.connection, this.multiTransaction);
				return "+OK\r\n";

			case "exec":
				if (!this.multiTransaction.getTransactionFlag()) {
					return "-ERR EXEC without MULTI\r\n";
				}
				if (this.multiTransaction.getQueueSize() === 0) {
					this.multiTransaction.setTransactionFlag(false);
					return "*0\r\n";
				}
				return this.handleExec();

			default:
				return "-ERR unknown command\r\n";
		}
	}
}
