enum DataType {
	String = "+",
	Number = ":",
	Error = "-",
	Bulk = "$",
	Array = "*",
}

type RESPValue = string | number | null | RESPValue[];

class RESPError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "RESPError";
	}
}

export class RESP {
	private commandIdx: number = 0;
	private readonly commandArray: string[];
	public parsedResult: RESPValue[] = [];

	constructor(input: string) {
		//Start decoding at the second command to avoid returning an array as the first element
		this.commandIdx = 1;
		// Filter out empty strings that might come from trailing \r\n
		this.commandArray = input.split("\r\n").filter((line) => line.length > 0);
		//store the parsed result
		this.parsedResult = this.decode();
	}

	private getCurrentCommand(): string {
		if (this.commandIdx >= this.commandArray.length) {
			throw new RESPError("Unexpected end of input");
		}
		return this.commandArray[this.commandIdx];
	}

	private validateDataType(command: string, expectedType: DataType): void {
		if (!command.startsWith(expectedType)) {
			throw new RESPError(
				`Expected ${expectedType} but got ${command[0]} at position ${this.commandIdx}`
			);
		}
	}

	public parseSimpleString(command: string): string {
		this.validateDataType(command, DataType.String);
		return command.substring(1);
	}

	public parseError(command: string): never {
		this.validateDataType(command, DataType.Error);
		throw new RESPError(command.substring(1));
	}

	public parseNumber(command: string): number {
		this.validateDataType(command, DataType.Number);
		const num = parseInt(command.substring(1), 10);
		return num;
	}

	public parseBulkString(): string | null {
		const command = this.getCurrentCommand();
		this.validateDataType(command, DataType.Bulk);

		const length = parseInt(command.substring(1), 10);
		if (length === -1) {
			return null;
		}

		if (length < 0) {
			throw new RESPError(`Invalid bulk string length: ${length}`);
		}

		this.commandIdx++;
		if (this.commandIdx >= this.commandArray.length) {
			throw new RESPError("Unexpected end of input while parsing bulk string");
		}

		const str = this.commandArray[this.commandIdx];
		if (str.length !== length) {
			throw new RESPError(
				`Bulk string length mismatch: expected ${length} but got ${str.length}`
			);
		}

		return str;
	}

	public parseArray(command: string): RESPValue[] | null {
		this.validateDataType(command, DataType.Array);

		const length = parseInt(command.substring(1), 10);
		if (length === -1) {
			return null;
		}

		if (length < 0) {
			throw new RESPError(`Invalid array length: ${length}`);
		}

		const stack: RESPValue[] = [];

		for (let i = 0; i < length; i++) {
			this.commandIdx++;
			if (this.commandIdx >= this.commandArray.length) {
				throw new RESPError("Unexpected end of input while parsing array");
			}

			const element = this.getCurrentCommand();
			const type = element[0] as DataType;

			switch (type) {
				case DataType.String:
					stack.push(this.parseSimpleString(element));
					break;
				case DataType.Number:
					stack.push(this.parseNumber(element));
					break;
				case DataType.Bulk:
					stack.push(this.parseBulkString());
					break;
				case DataType.Array:
					stack.push(this.parseArray(element));
					break;
				case DataType.Error:
					this.parseError(element);
					break;
				default:
					throw new RESPError(`Unknown data type: ${type}`);
			}
		}

		return stack;
	}

	public decode(): RESPValue[] {
		const result: RESPValue[] = [];

		while (this.commandIdx < this.commandArray.length) {
			const command = this.getCurrentCommand();
			const type = command[0] as DataType;

			switch (type) {
				case DataType.String:
					result.push(this.parseSimpleString(command));
					break;
				case DataType.Number:
					result.push(this.parseNumber(command));
					break;
				case DataType.Bulk:
					result.push(this.parseBulkString());
					break;
				case DataType.Array:
					result.push(this.parseArray(command));
					break;
				case DataType.Error:
					this.parseError(command);
					break;
				default:
					throw new RESPError(`Unknown data type: ${type}`);
			}

			this.commandIdx++;
		}
		return result;
	}
	public getExpiryFlag(): number | null {
		let i = 0;
		for (i; i < this.parsedResult.length; i++) {
			console.log(this.parsedResult[i], typeof this.parsedResult[i]);
			if (this.parsedResult[i] === "PX") {
				return parseInt(this.commandArray[i + 1]);
			}
		}
		return null;
	}
}
