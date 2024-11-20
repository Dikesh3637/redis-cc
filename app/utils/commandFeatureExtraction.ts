import type { RESPValue } from "../parser";

export function getExpiryFlag(command: RESPValue[]): number | null {
	for (let i = 0; i < command.length; i++) {
		if (command[i]?.toString().toUpperCase() === "PX") {
			return parseInt(command[i + 1] as string);
		}
	}
	return null;
}
