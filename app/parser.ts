enum DataType {
	string = "+",
	number = ":",
	error = "-",
	bulk = "$",
	array = "*",
}

export function decodeRESP(str: string): any[] {
	const commandArray: string[] = str.split("\r\n");
	let res: any[] = [];
	let i = 0;
	while (i < commandArray.length) {
		const element = commandArray[i];
		if (element[0] === DataType.string) {
			res.push(element.substring(1));
		}
		if (element[0] === DataType.number) {
			res.push(parseInt(element.substring(1)));
		}
		if (element[0] === DataType.bulk) {
			res.push(commandArray[i + 1]);
		}
		i++;
	}
	return res;
}
