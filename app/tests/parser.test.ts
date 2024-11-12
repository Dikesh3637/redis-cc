import { describe, expect, it } from "bun:test";
import { RESP } from "../parser";

describe("decode", () => {
	it("decodes a simple string", () => {
		expect(new RESP("*1\r\n+OK\r\n").parsedResult).toEqual(["OK"]);
	});

	it("decodes a number", () => {
		expect(new RESP("*1\r\n:123\r\n").parsedResult).toEqual([123]);
	});

	it("decodes a bulk string", () => {
		expect(new RESP("*1\r\n$6\r\nfoobar\r\n").parsedResult).toEqual(["foobar"]);
	});

	it("decodes multiple commands", () => {
		expect(
			new RESP("*3\r\n+PONG\r\n:456\r\n$5\r\nhello\r\n").parsedResult
		).toEqual(["PONG", 456, "hello"]);
	});

	it("decodes an array", () => {
		expect(new RESP("*2\r\n$4\r\nECHO\r\n$4\r\npear\r\n").parsedResult).toEqual(
			["ECHO", "pear"]
		);
	});

	it("decodes arrays within arrays", () => {
		expect(
			new RESP("*2\r\n*3\r\n:1\r\n:2\r\n:3\r\n*2\r\n:4\r\n$6\r\nfoobar\r\n")
				.parsedResult
		).toEqual([
			[1, 2, 3],
			[4, "foobar"],
		]);
	});

	it("parses an expiry flag", () => {
		expect(
			new RESP(
				"*3\r\n$3\r\nSET\r\n$3\r\nfoo\r\n$2\r\npx\r\n$4\r\n1000\r\n"
			).getExpiryFlag()
		).toEqual(1000);
	});
});
