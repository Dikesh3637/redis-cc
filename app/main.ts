import * as net from "net";
import { CommandProcessor } from "./commandProcessor";
const startupCommands = process.argv.slice(2);

const dirIndex = startupCommands.indexOf("--dir");
const rdbFileIndex = startupCommands.indexOf("--dbfilename");
export let rdbconfig = [
	startupCommands[dirIndex + 1],
	startupCommands[rdbFileIndex + 1],
];
console.log(rdbconfig);

const server: net.Server = net.createServer((connection: net.Socket) => {
	connection.on("data", (data) => {
		const commandProcessor = new CommandProcessor(connection);
		commandProcessor.processCommandSquence(data.toString());
	});
});

server.listen(6379, "127.0.0.1");
