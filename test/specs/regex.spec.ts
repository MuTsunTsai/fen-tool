import { createAbbrExp } from "app/meta/regex";

describe("RegExp utility", function() {

	it("Match initials of words", function() {
		const remark = new RegExp(createAbbrExp("remark"), "i");
		expect("s remar hello".match(remark)![0]).to.equal("remar");
		expect("sremark hello".match(remark)).to.equal(null);
		expect("remat hello".match(remark)).to.equal(null);
	});
});
