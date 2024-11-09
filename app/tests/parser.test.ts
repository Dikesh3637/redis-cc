import { describe, expect, it } from "bun:test";
import { RESP } from "../parser";

describe("decode", () => {
	it("decodes a simple string", () => {
		expect(new RESP("+OK\r\n").decode()).toEqual(["OK"]);
	});

	it("decodes a number", () => {
		expect(new RESP(":123\r\n").decode()).toEqual([123]);
	});

	it("decodes a bulk string", () => {
		expect(new RESP("$6\r\nfoobar\r\n").decode()).toEqual(["foobar"]);
	});

	it("decodes multiple commands", () => {
		expect(new RESP("+PONG\r\n:456\r\n$5\r\nhello\r\n").decode()).toEqual([
			"PONG",
			456,
			"hello",
		]);
	});

	it("decodes an array", () => {
		expect(new RESP("*2\r\n$4\r\nECHO\r\n$4\r\npear\r\n").decode()).toEqual([
			["ECHO", "pear"],
		]);
	});

	it("decodes arrays within arrays", () => {
		expect(
			new RESP(
				"*2\r\n*3\r\n:1\r\n:2\r\n:3\r\n*2\r\n:4\r\n$6\r\nfoobar\r\n"
			).decode()
		).toEqual([
			[
				[1, 2, 3],
				[4, "foobar"],
			],
		]);
	});
});
