import * as net from "net";
import { RESP } from "./parser";

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
			console.log("value", value);
			if (!value) {
				connection.write("$-1\r\n");
			} else {
				let [keyValue, timestamp, expiry] = value;
				if (expiry !== null) {
					if (Date.now() - timestamp >= expiry) {
						connection.write("$-1\r\n");
						map.delete(key);
					} else {
						connection.write(`$${keyValue.length}\r\n${keyValue}\r\n`);
					}
				}
			}
		}
	});
});

server.listen(6379, "127.0.0.1");
