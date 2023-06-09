import { expect } from "chai";
import { isInBig5 } from "../src/js/modules/big5.mjs";

describe("Big5 code page", function() {

	it("Contains the Big5 Chinese characters", function() {
		expect(isInBig5("哈")).to.be.true;
		expect(isInBig5("堃")).to.be.false;
	});

	it("Excludes ASCII characters", function() {
		expect(isInBig5("a")).to.be.false;
	});

});
