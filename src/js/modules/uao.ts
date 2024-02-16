/* eslint-disable @typescript-eslint/no-magic-numbers */

/** The actual map in use. */
const map = {} as Record<string, string>;

{
	/**
	 * A bitmap representing all unicode characters that are in the
	 * Unicode-at-on (Unicode 補完計畫, UAO) project, a Big5 extension.
	 * Each entry is a segment, with key being the start of the segment,
	 * and the content is base64-encoded bitmap of the segment
	 * (or if the bitmap is small, directly written as number).
	 *
	 * The data is generated from
	 * https://moztw.org/docs/big5/table/uao250-b2u.txt
	 */
	const rawMap = {
		161: "yeLh+v///+////9vAQAEBAAEAAAAEgQAAAQAAAAAAg",
		462: "VVU",
		593: "Cx8BQpAARAoCAEgAAABgVwAB",
		913: "///9Af///QEAAAAAAAABgP////////9/AQ",
		7739: "AUE",
		7922: 3,
		8208: "GTPiACUY",
		8364: 1,
		8451: "RQAIyAABAAEAAP/vf+B/AADgfwAggGAAAAECAHgAAKAhAYQ4xQsWAACAAGAYAACAGQBEAAQAABA",
		8962: "AQAB",
		9216: "/////wI",
		9312: "//////////////////////8HAAAPEBEREBAQEABA/////x8A/v84AAMATDDQyAADPAAAAGZABtgBgP8+BQAAAP8U",
		9986: "wQAKgIAAAAgAIAAAAADwPw",
		11904: "gRSgAABA",
		12288: "7///YP4DAAD+////////////H3j+/////////////3/g/////wM",
		12751: 1,
		12832: "/wMG",
		12963: 1,
		13198: "A8CJAAAAUACZBAAAAABA",
		13393: 1,
		13535: 1,
		13649: 1,
		13774: "EQEAACAAAQAAAACAAAAAAEA",
		14023: 1,
		14776: 1,
		14890: "AQAAAAAgBA",
		15341: 1,
		15569: 1,
		15820: 1,
		16089: 1,
		16485: 1,
		16607: 1,
		17462: 1,
		17553: "AQAAAEAAAAAAAAACAAQ",
		17935: 1,
		18825: 1,
		19326: 1,
		19460: "CQAAAAAAgA",
		19581: 1,
		19968: "2//7//b93/+8+/3/RwYLwf//Pt//e+2e/+/69zp//7k/77//9b/d/+77//+/3v3//6/3fe///a6//9v/e/f/5+n7/t////te7//r/X///e2veXd/7PP//fbv++/793v7/3//lXduv7/7f/f+v3/7O+e3/3/13/97+f/f+de+e///f///+2//v9/+9/6//7+/n7/f/1//PtqvOu/r34q/3+/v57bf9J////f+9d/6v/90/vz3/X9dii5/169//+9/2v////v//3vv7/+b/7///ff9/3///9////v/9//vjr3+/99N/f3/2/v/7/D+fu773/8/9/5///7//////p/v/nfz//m/9v/vb/edf3//39///r33//3+8m9/2u2/7L/u3798/c33ne/v/pf+96///H2/vf//fn3/39n99//y/3//fzd6//f/r5P/vv88u3/+78+f9+vfb//m3///vdvf/vz+97+1/pZXt8/7Pa9///v/593v/9////v/3397/////7/u37v+/nP/N////3/z/17d//733v//3////39//++uu/vu//3V8fv9+798f/+9v/vt//99+eP/fv/r/99v3/7/f/W9NZv/9/97c//3Wt9mv//////r/fbf/89z9/O/z/j37/3z//fvX+97rLv///d/vfaX//c377r/6e/Lv+p+3/e//+vbeb/9uPvf/33/37//3v19/2P+////79ff37///63/5/tfe///M/6+3/v/H+/b8//+/n+y9/u77bvtf/7/fv//vp7/Pj3v/f/t//t/9fzdv///+/+6/9/7///7/3+/39vV+Pf/f///3f92j35/v5b//9fvv1/F/W/3/9v//+///t3vz38/X///3/7/1//9d/97+/z//7/v+///j/t777///v////PXvvvnv7//1/u//79////v///vf//n/v3d//397/9tH//j+/+/vL/v9336//+/7t1v/7/f/fv2//t//v3ravf6+/y9/Z//W//6t//t+3743+7v8/+9/f8/8//pf96+v/7+/t/ff/9/96fX7///0/9Ef9l7//8///3r7//6///76/b/////+vq/9////49//9///f7//7//3/1n7/5///9/sv/r9vv/v9+53/9/Nv3///Xb3/8///+/n3+1/ft/3/7/////f/9n+9/////63/576/d73v//v/7/7/9///v7/+//r17Xv/b//v///m/uvxv/t91LHz2Pz+e/sf7/7n//2v+m3N/f//7P/+z/vP///d/fna3//7v7v//f/+/P/rX/9+9/7///fb/+/t////7//q//7////8fv9f/////tnt//9/f/////+/vfvv/1v///f///f73/+7///3//++7////L3tNt+93//8z///////93+/b////+1//+///76P/93/7d//d///D//3//3/8+/9/7/937/vL/35+/33+/9/3/v/P3f+5+t/v6u3///f//17v7/3X++f9v23/c//7/9/9f73331/f/v7e/9//P97/3eXf77/b57vx/5//Xv+3/z9b9//f//+3/9/fnf3/X31//3/+f3e/7/v//3z/3h+/v///9/9/++ff//f/t//9//+/+//+/9/5///+X/+///r////bvf7X//6/37y+d/f//0/fpv/n/927/v//1/zq+/f7d593+9+e/3H//v//3/9+v//+vv/v//78//c3z39f//3//389vfnLst+9899//+va/X7r/L+79q/5/+/x33+//hP+/+67/r7///rz+uX/t+9//b/P/9e//v/+9f/9wdf+X3vvz+t+/v39f+v+/77/3v/72Up96+v9///ef//+/r5/3/+3/v/d/3+97/3bx3/7TLX19v99N7Y/+/f/Tna978+/7v//zbf//3b+vbv//7sHvf98/7/3/f1/9/3ct//L/T/X99//fv7ZD0947//9/3//v/v/67z+p+7+327/5/j3/f3/3+f79Pv+vf//3xfX/f/////+n22////1//c7v7757+/7+3/+///f+///71/9uuv///P/u////P///7//9/8///5//v+/n/////+/v//3/+/6/////57//v/3vf///7v/+/P/z///v/rf57/+////59/v31/v7zL1X/d6X/+P9nm2///729f/383/7v39/7/f/776+32fc/X/e9/rf/92/qv/9X////7ev7//33N/3f/f9b////7XK//9+////ve2f////+/+//f/b//3////78n/9v/6////f3f//+P3q/////d//9///+vu/////+v5fOf/////9f/////v/79X73/+f/1f/9/7f/v/f3//t///3+/+7f/9//u////9f///7/9/f++f/6+/3f//H//e+29//93/f7fl/3r7/n/7nfP93v7//////2/9c//9P/3+uX/93v93P+//////7//673/08/////1/f///9/N7///u7///v+3/9/G6///fyv/vv35d99/f//vX//tn///de///+/v953rrf/3/+3t7vj/r9/vbM9vfff/7/u9/dndXv+aw+2/9z9/dLz3v/3v6+f1f7v1X//bv+/9ft/9/3/f////3r/u/////tv5fvf1193//v/fd///7///v////9/7/////+7v/ztHa/7z939r//v//9/7/1/v7/f79//b//+/7//////3l/3/v/Lzf+f5rr//7X//n7/9/fv///9/////979/f///7/t//d9///9/u/R3Zt/579//v2/+9///959v3L/////9/7///+7/vf6ev///b///9/7/n/f////t/g/vu2/v97v/v9//+vu+vv1X/vus37//+/v///6/f/3/9/z/v///e/1//3//6P/r///3////v//n/69//3/1b6f//3c///7//43/////o//3/+3v//v+v7/9//3/t97///f1////ff/3/7f//39///97+v3f3///9R+//b//8v83/v//+/v229///77/+9/v////9/f+f7v///9////+9+//ff9/bf+/6/z73t/9/b/3/n/uk/f90/7/9/f//39h/1f7///3v5/r//ffvv/3u/19/7///+/y+P/+//70/7//9/79+r7v93f9///++X/3/93u//+/3z635v7//1//3b+707+v//+/2f////t9v99/fe/99fLt/v/3Z2rXf//7P/r/+vf//7rv/3tPOt/3v6/T8//vv/v/929//+/n/+///3/3/3/d/9//v/953P/b+p3//3vP/Tz/ze/n7//8e9777e//93j9OT9/zv6e/sd+1zq9uH/n7/P7eh9X+9uHv7//7z//3nzWP+n+Zpt9z/a/89+Pz58+Q+/779U/Xrb//b6//f3/+z/7///5/d//+//v//////fvv9///+v/9vv+7n/t+iXdg/K///f///9//z/9/zf//17///x+/tX////2v//////973z/l/N781AAM",
		57344: "/////w8",
		57508: "FycEDgJkFQgIAYUAAACgJCAIQRhBAAAAQACAwAAQABACBBAABQCIQACAgBAACABCAAAKAAAAAAgAAMBAIAMgGg0AiBI",
		58305: 1,
		58591: 27,
		58701: "AwMOfQUBwAAAAAAgAAAACA",
		59183: 1,
		59338: "EQBAABAA8A",
		59459: "EYhIAwEAEADwzw",
		59697: 3,
		59852: 13,
		60009: 1,
		60294: 35,
		60436: "AW2gAQAAAAAAgA/kAZP/PwC4PwQWYNAH",
		60817: 3,
		60958: "EQAAAAAAAFQD",
		61110: 1,
		61305: 1,
		63462: "Bf8f",
		63561: "////Hw",
		64012: "rxG4OQ",
		65072: "+/8f/vf+fw8",
		65281: "/////////1////8//////////38",
		65504: 63,
	};

	// Preprocess the bitmap into binary format.
	for(const key in rawMap) {
		const n = Number(key) as keyof typeof rawMap;
		const value = rawMap[n];
		map[key] = typeof value == "number" ? String.fromCharCode(value) : atob(value);
	}
}

export function isInUAO(char: string): boolean {
	let code = char.charCodeAt(0);
	if(code < 161 || code > 65509) return false; // Absolute range
	let k = 0;
	for(const key in map) {
		const n = Number(key);
		if(n > code) break;
		k = n;
	}
	code -= k;
	const byte = map[k].charCodeAt(code >>> 3); // NaN if out of range
	return Boolean(byte & 1 << code % 8);
}
