/**
 * A bitmap representing all unicode characters that are in the
 * Big5 encoding (technically Code Page 950 by Mircorosft),
 * excluding the ASCII characters.
 * Each entry is a segment, with key being the start of the segment,
 * and the content is base64-encoded bitmap of the segment.
 * 
 * The data is generated from
 * https://www.unicode.org/Public/MAPPINGS/VENDORS/MICSFT/WINDOWS/CP950.TXT
 */
const map = {
	167: "AQcBAAAAAQAAAAE", // To include ASCII, replace this line by 0: "/////////////////////wAAAACAgIMAAACAAAAAgA",
	711: "XQAE",
	913: "///9Af///QE",
	8211: "YwYcgAQB",
	8364: "AQ",
	8451: "RQ",
	8544: "/wMAAAAAzwM",
	8725: "IU5xggEAACAAGAYAAAAAABEAAQAABA",
	9472: "BRARERAQEBAAAP////8fAP7/OAADAAwwwMgAADwAAABgAAAAAAAAAAU",
	12288: "D/83YP4D",
	12549: "/////x8",
	12963: "AQ",
	13198: "A8AJAAAAQACZ",
	19968: "i/9zw0BoDxus6UzzAAIIwFx5Psp2eUgG3y/w9zoD/6g37z8jBLBZ/crz//+f3vn//6v3fQDA7I6/7tv/A9D6ReH6/t/vv6sQ6/+q/D/v/SSteHZ/DPD/7fbP+iz592vr/R+/lXdmv7/7O7T+rnviEYGmvkE1FMNycH2RcQMAayfLV89wMkfvDdp+dPwG/rS9nz/Ki0l+AFiPIuzrXIq73WDv57YPpJPyuzeeVEvQr5sUxNT3sDAUCggv0Ih+/y8Z2v8H+/F/63vvxRAA/5n//dd5ZwXn/8v9/8NAQPdvjr3635cEwPT/W3vt59B+BOD4n/8+t/59Loj9/3++/oPE9lfz/biA1n3vZ1eIR33/38P/8Kk34H38cG8/muyzTIGGnj9c3Q33GUij/gcAVq//OA2YuO89QGC3ztg1kL9y/z/3fxF6u/f/qwD/vm88qXL+788b8WvbCvzmw37vnJsQ9kjw9Ba1/oJRsce7FYdu3/s/5M1j/8F+fuv9X317d/78C5bq2yli6FPfN+/99TaBvRjcvfzk0v//1z/g/29/+K+um9lu+/UV8al5+708Wq+tutusH/xxeYP3fF/D/99nBZr/Z4Q0FYvf8/lzM733Gl5Avz+g///rAcDf3c8AddOrw/jW7v1D/7evXidCrJuG9tcnvPaH97c1zap24edJn+JcVPKvPyvYYTv8uLvP/317lb/gHP19/0P2X/7/79POxLaNvK3cY+sRWd/QI7S+2/PnH8fbY//k+iuy92M77bqtAf7/fvf/vAL/Mj3v/P8FgPt39bwNAff/+/86v1cA/9977329iNvUyPP/fO3uXf9WDX5frJb/f9XuP0DB+W/n/5t3d46/bl3kz28fX3/g3/7b1/4BAP97+9T/3x8A+P//j/t7AAC/XH////MHoOvnPb/31/u//wNg/f/tv7vvfwJA/v3d//354gtoH/vj+/2vpJ/t9316D/i+7tUPXbuf/dvy+Tt//szraof6c/yV/J+fEPf6t93Nu374zexm8z88/f8/sPfpfgaulgb+dtXXX9E/86MHz7dv0Z9Ef1l73dM7r72pz306/+D76/YBtP//+nq/twDA/Q9//x///P7/lQAA3LVj7z4/f/sbAADo9vvvnt+4n/8/ANB7//Xb3/8/8P2/ACCEvbs3397/bf/zD0xg+177//v6Xv4ZAvR53vn3p/rr6wE0/9Prc+/Xr0DAu3L/3H/x2C/suAv+o90LHx2Pz0crsd7/7n9z2v8kxMtd9/LL/ezttPm/3U3dmY37f7t7r/vdWclP/LX6469fbf//fT8AeNv//7b/fq/7LwKb/8fvpf///wcAAMf/9/H//X+/AQDcvP31v///f///PikAAL7/+X//+25+/f/LngMA4937/8zf9v//fxEA+Pb77+c81+/+798LwL/t3/7N/fV7/UD//1+33/8w+d/7l9zz/vK/34+/338X5u1/D1M1fER+hxL6u0Xg7Z53F4DZv1V+id5vwUcE3npd9/9XBSn3hpX+s5cv8//PdZ/3cRf77jQZ7sw3Ye/Wn0zvj9bd+3N7723+1zGkf17Xl1sP2P+Dnc577CL/3D12h+/n3+39/0/8oHc7/NvtPdx/qW9w9fs/QCx//3+EV+y33pzmL/LrD7XV66/n7S+M8P9/U/Donbn/tWb/j+eB2RC+fJzB49GcMye8DG3/t/y379+g//8Lv3v+/6M/NcwTzZc3dif71s9sflDsMe18Zxz8+va/X7oPL66to/5/8Px03u//APK/+6L+rz3/vJT2uV+t848/bPIfoO//vwEodwVwNf8D2vvS+se/Px1cOv8z7K+3nP42Up96+r8i5/ef//y7Lx22Bu39Hdd93+8j62bx2X7ADT09v99FyYO60X3QnYd7c8/zn/XDDd/+xbMMAoN56MCuc8cPb339Pwnx/1cB+2L/AbT98zsTsLJD014w//8Pn+vv/gPy7z+J+6k3mZ753iynMzf2wa6BPv4gXffyhdXXaf////8H22///8R/2c7vD7578V7wz/a3//dehO/L198OCP///D/u////E//XD6/9f8e9+h8",
	32566: "neP0zuSv/7X7o//Z8d3Pvv+/+t9iv/3/7u/j329LXeSLIxce1UFCvo/Te7b9uLjbFPDez//tgf78nRWArfvqBphh8/9g3St/Hzb/gv43b/3699uevr/fcX7f/tzhn3Ty39Yqv39r7dvG57B/vP/u7/81APhr7/f+Of3PAGvV//p//v5/AQAA4Pcr//e/9T8HgP5/y+//fv/9a/s/ICDo/v/26127r+/nnxGBT/5ffl993vt/IwB+f/sX//vf7/8PoO2f6a/9/4l//f/P/X8f7p/3r5/e+/0ev897CH7/2/l9J+f1afu+b3qA8+3f+R7u//9vbP9z/YA//f85fP3f/XY/wf/////jP/iOfvdz8Pf/93147v/3cnu//ezr/n2/72/0sbs4vt7LP+y5P1t2GN8d+Nf/C2Z//5l7/R+7+7/nWWk+/3/5e3m7JaLne9ETmwcA8Pn+7Xx3d1a/p7PSTHnP1d8vPe39e/rjuh3tNxT996/671+n/3fft///9Xev+50//9+m90a+13XxXQM",
	35895: "9d3/42ntft9f7mx/734/+/9/K13t/+t2/upP8xU",
	36196: "vd+9MmP/p7naz29tnr/++/39Qd9v+v//r7Q3f/uX7/9vy9Vh//dfvvdBQFLg65k/vi3//f72359nzb/cv/7//gEAAAAAAICJFH4BSKfmD/DXFt//hzvv/wFuF2/p/rPXuN7//986u/xO+Beu2gT/+/P74/+/fv3//f/3vP/fXvhzzXvw7/rg/9r/a/euv3vD/ac7+m97b4UP9n0e9v/NtA9b9N/ep//z/8Gv8f//Oj59PPh9td/3/v+ONwHsf/+1SzPu1XBv/+5//QvQWX9/7x0F/p/s/zcQ8PX+G/95Ctbx/h//",
	38263: "eZr2P7J19sb903/+uH8AAAAAAACgPuoPfDv4N/I9eP/j8t98tyyvNjb///j/XQ7PX+vXn+b7v0vOuReIuo6uuvt/2iHv/vqQFfX18+dVQJbe/+uf86ZXSxf07h/3ex0/AAAAAAAA5p36rzQAEFldqexaL/6bZf9f6FW3/rcFAAAAAACA59Tzf1wc9f93ee2m//3d5fx6/e7P/+77nesf",
	39592: "qZvbx6R/kcr4zn56fefHvcuu3H79do/TkfN85QEvTHftYKPbB/he9x2BIeBrnDA6O976U3/1w81hugc",
	40165: "N/H3zR+oXW8bX05/4fT+Hfz8Xb3/qP7/vvX/du1///fb73//V/11Aw",
	40565: "sW3+8/SdFYvHaojf649P7/cdNm776vn/T3v+p9/f575/AgC5iag",
	64012: "Aw",
	65072: "+/8f/vf+fw8",
	65281: "vf///////0v///8/",
	65504: "Kw",
};

// Preprocess the bitmap into binary format.
for(const key in map) map[key] = atob(map[key]);

export function isInBig5(char) {
	let code = char.charCodeAt(0);
	if(code < 167 || code > 65509) return false; // Absolute range
	let k = 0;
	for(const key in map) {
		if(key > code) break;
		k = key;
	}
	code -= k;
	return Boolean(map[k].charCodeAt(code >>> 3) & (1 << (code % 8)))
}