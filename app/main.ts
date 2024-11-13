import * as net from "net";
import { RESP } from "./parser";

let mulitFlag: boolean = false;
//key to [value,expiry,timestamp] map
let map = new Map<string, [string, number, number | null]>();

const server: net.Server = net.createServer((connection: net.Socket) => {
	connection.on("data", (data) => {
		const parser = new RESP(data.toString());
		const command_sequence = parser.parsedResult;
		console.log("command_sequence", command_sequence);
		let command = command_sequence[0] as string;
		if (command.toLowerCase() === "ping") {
			connection.write("+PONG\r\n");
		}
		if (command.toLowerCase() === "echo") {
			const message = command_sequence[1] as string;
			connection.write(`$${message.length}\r\n${message}\r\n`);
		}
		if (command.toLowerCase() === "set") {
			const key = command_sequence[1] as string;
			const value = command_sequence[2] as string;
			const expiryValue = parser.getExpiryFlag();
			console.log("expiryValue", expiryValue);
			if (expiryValue) {
				map.set(key, [value, Date.now(), expiryValue]);
			} else {
				map.set(key, [value, Date.now(), null]);
			}
			connection.write("+OK\r\n");
		}
		if (command.toLowerCase() === "get") {
			const key = command_sequence[1] as string;
			const value = map.get(key);
			if (!value) {
				connection.write("$-1\r\n");
			} else {
				let [keyValue, timestamp, expiry] = value;
				if (expiry && Date.now() - timestamp > expiry) {
					connection.write("$-1\r\n");
					map.delete(key);
				} else {
					connection.write(`$${keyValue.length}\r\n${keyValue}\r\n`);
				}
			}
		}
		if (command.toLowerCase() === "incr") {
			const key = command_sequence[1] as string;
			const value = map.get(key);
			if (value) {
				const [keyValue, timestamp, expiry] = value;
				if (!Number(keyValue)) {
					connection.write(`-ERR value is not an integer or out of range\r\n`);
				} else {
					map.set(key, [String(parseInt(keyValue) + 1), timestamp, expiry]);
					connection.write(`:${parseInt(keyValue) + 1}\r\n`);
				}
			} else {
				map.set(key, ["1", Date.now(), null]);
				connection.write(`:1\r\n`);
			}
		}

		if (command.toLowerCase() === "multi") {
			connection.write("+OK\r\n");
			mulitFlag = true;
		}

		if (command.toLowerCase() === "exec") {
			if (!mulitFlag) {
				connection.write("-ERR EXEC without MULTI\r\n");
				return;
			}
			//execution
			connection.write(`*0\r\n`);
			mulitFlag = false;
		}
	});
});

server.listen(6379, "127.0.0.1");
