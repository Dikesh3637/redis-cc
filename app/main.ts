import * as net from "net";
import { CommandProcessor } from "./commandProcessor";
import { MultiTransaction } from "./multiTransaction";

//key to [value,expiry,timestamp] map
let map = new Map<string, [string, number, number | null]>();
let transaction = MultiTransaction.getInstance();

const server: net.Server = net.createServer((connection: net.Socket) => {
	connection.on("data", (data) => {
		const commandProcessor = new CommandProcessor(connection);
		commandProcessor.processCommandSquence(data.toString());
	});
});

server.listen(6379, "127.0.0.1");
