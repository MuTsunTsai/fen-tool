import { isInUAO } from "app/modules/ptt/uao";

describe("UAO code page", function() {

	it("Contains the Big5 Chinese characters", function() {
		expect(isInUAO("哈")).to.be.true;
	});

	it("Contains UAO characters", function() {
		expect(isInUAO("堃")).to.be.true;
		expect(isInUAO("あ")).to.be.true;
		expect(isInUAO("俥")).to.be.true;
	});

	it("Does not contain other characters", function() {
		expect(isInUAO("ὀ")).to.be.false;
		expect(isInUAO("㚰")).to.be.false;
		expect(isInUAO("丠")).to.be.false;
	});

	it("Excludes ASCII characters", function() {
		expect(isInUAO("a")).to.be.false;
	});

});
