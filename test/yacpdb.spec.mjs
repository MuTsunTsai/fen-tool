import { expect } from "chai";
import { toYACPDB } from "../src/js/fen.mjs";

describe("YACPDB syntax", function() {

	it("Is the same for orthodox pieces", function() {
		expect(toYACPDB("k")).to.equal("k");
		expect(toYACPDB("N")).to.equal("N");
	});

	it("Use ! for neutral pieces", function() {
		expect(toYACPDB("-k")).to.equal("(!k)");
		expect(toYACPDB("-N")).to.equal("(!N)");
	});

	it("Use number after pieces for rotation", function() {
		expect(toYACPDB("*1k")).to.equal("(k1)");
		expect(toYACPDB("-*2N")).to.equal("(!N2)");
	});

	it("Doesn't support text", function() {
		expect(toYACPDB("''12")).to.equal("");
	});

});