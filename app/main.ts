import * as net from "net";
import { CommandProcessor } from "./commandProcessor";

const server: net.Server = net.createServer((connection: net.Socket) => {
	connection.on("data", (data) => {
		const commandProcessor = new CommandProcessor(connection);
		commandProcessor.processCommandSquence(data.toString());
	});
});

server.listen(6379, "127.0.0.1");
