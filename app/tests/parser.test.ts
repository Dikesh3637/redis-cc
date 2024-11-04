import { describe, expect, it } from "bun:test";
import { decodeRESP } from "../parser";

describe("decodeRESP", () => {
	it("should decode simple string", () => {
		const result = decodeRESP("+OK\r\n");
		expect(result).toEqual(["OK"]);
	});

	it("should decode number", () => {
		const result = decodeRESP(":123\r\n");
		expect(result).toEqual([123]);
	});

	it("should decode bulk string", () => {
		const result = decodeRESP("$6\r\nfoobar\r\n");
		expect(result).toEqual(["foobar"]);
	});

	it("should decode multiple commands", () => {
		const result = decodeRESP("+PONG\r\n:456\r\n$5\r\nhello\r\n");
		expect(result).toEqual(["PONG", 456, "hello"]);
	});

	it("should decode array", () => {
		const result = decodeRESP("*2\r\n$4\r\nECHO\r\n$4\r\npear\r\n");
		expect(result).toEqual(["ECHO", "pear"]);
	});
});
