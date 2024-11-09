import * as net from "net";
import { RESP } from "./parser";

// You can use print statements as follows for debugging, they'll be visible when running tests.
const server: net.Server = net.createServer((connection: net.Socket) => {
	connection.on("data", (data) => {
		const parser = new RESP(data.toString());
		const command_sequence = parser.decode();
		let command = command_sequence[0] as string;
		if (command.toLowerCase() === "ping") {
			connection.write("+PONG\r\n");
		}
		if (command.toLowerCase() === "echo") {
			const message = command_sequence[1] as string;
			connection.write(`$${message.length}\r\n${message}\r\n`);
		}
		if (command.toLowerCase() === "set") {
		}
	});
});

server.listen(6379, "127.0.0.1");
