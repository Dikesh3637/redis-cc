import * as net from "net";
import { decodeRESP } from "./parser";

// You can use print statements as follows for debugging, they'll be visible when running tests.
const server: net.Server = net.createServer((connection: net.Socket) => {
	connection.on("data", (data) => {
		const command_sequence = decodeRESP(data.toString());
		let command = command_sequence[0] as string;
		if (command.toLowerCase() === "ping") {
			connection.write("+PONG\r\n");
		}
		if (command.toLowerCase() === "echo") {
			connection.write(
				`$${command_sequence[1].length}\r\n${command_sequence[1]}\r\n`
			);
		}
	});
});

server.listen(6379, "127.0.0.1");
