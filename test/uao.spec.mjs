import { expect } from "chai";
import { isInUAO } from "../src/js/modules/uao.mjs";

describe("UAO code page", function() {

	it("Contains the Big5 Chinese characters", function() {
		expect(isInUAO("哈")).to.be.true;
	});

	it("Contains UAO characters", function() {
		expect(isInUAO("堃")).to.be.true;
		expect(isInUAO("あ")).to.be.true;
	});

	it("Excludes ASCII characters", function() {
		expect(isInUAO("a")).to.be.false;
	});

});
