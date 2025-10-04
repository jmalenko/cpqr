// Load common.js dynamically and wait for it to load
(function () {
    const script = document.createElement('script');
    script.src = 'common.js';
    script.type = 'text/javascript';
    script.onload = () => onLoad();
    document.head.appendChild(script);
})();

/*
    Tests & Simulation
    ==================
 */

const testFrames = [
    // Prepared with the same content.

    // Content fits 2 frames. (The capacity is 70.)

    {
        name: "2 frames, send all the content frames",
        frames: [
            '1102651112104065018274223C%3A%5Cfakepath%5Ca.txt279data:text/plain;base', // Frame 0
            '11125964,SmVkbmEsDQpEdsSbLg0KVMWZaQ0KxJvFocSNxZnFvsO9w6HDrcOpDQo=', // Frame 1
            // '130,1AAABAAMMBwUdYVxmX1JbcEN1aUJyUEFhUQ9CAwpzeBQ8ADpVOxk+HmNaIDJgDCIadEFKK1gDV3IwFxs7XzQ9DlRuO2Jhc2U=', // Correction frame
        ]
    },

    {
        name: "2 frames, send all the content frames in opposite direction",
        frames: [
            '11125964,SmVkbmEsDQpEdsSbLg0KVMWZaQ0KxJvFocSNxZnFvsO9w6HDrcOpDQo=', // Frame 1
            '1102651112104065018274223C%3A%5Cfakepath%5Ca.txt279data:text/plain;base', // Frame 0
        ]
    },

    {
        name: "2 frames, send frame 0 twice",
        frames: [
            '1102651112104065018274223C%3A%5Cfakepath%5Ca.txt279data:text/plain;base', // Frame 0
            '1102651112104065018274223C%3A%5Cfakepath%5Ca.txt279data:text/plain;base', // Frame 0
            '11125964,SmVkbmEsDQpEdsSbLg0KVMWZaQ0KxJvFocSNxZnFvsO9w6HDrcOpDQo=', // Frame 1
        ]
    },

    {
        name: "2 frames, miss frame 0, send correction that allows building the frame",
        frames: [
            '11125964,SmVkbmEsDQpEdsSbLg0KVMWZaQ0KxJvFocSNxZnFvsO9w6HDrcOpDQo=', // Frame 1
            '130,1AAABAAMMBwUdYVxmX1JbcEN1aUJyUEFhUQ9CAwpzeBQ8ADpVOxk+HmNaIDJgDCIadEFKK1gDV3IwFxs7XzQ9DlRuO2Jhc2U=', // Correction frame
        ]
    },

    {
        name: "2 frames, miss frame 1, send correction that allows building the frame",
        frames: [
            '1102651112104065018274223C%3A%5Cfakepath%5Ca.txt279data:text/plain;base', // Frame 0
            '130,1AAABAAMMBwUdYVxmX1JbcEN1aUJyUEFhUQ9CAwpzeBQ8ADpVOxk+HmNaIDJgDCIadEFKK1gDV3IwFxs7XzQ9DlRuO2Jhc2U=', // Correction frame
        ]
    },

    // Even more unusual scenarios for 2 frames

    {
        name: "2 frames, send only frame 0",
        frames: [
            '1102651112104065018274223C%3A%5Cfakepath%5Ca.txt279data:text/plain;base', // Frame 0
        ],
        expected: false // No file saved, missing frame 1
    },

    {
        name: "2 frames, send only frame 1",
        frames: [
            '11125964,SmVkbmEsDQpEdsSbLg0KVMWZaQ0KxJvFocSNxZnFvsO9w6HDrcOpDQo=', // Frame 1
        ],
        expected: false // No file saved, missing frame 0
    },

    {
        name: "2 frames, send frame 0 correctly and then with incorrect data",
        frames: [
            '1102651112104065018274223C%3A%5Cfakepath%5Ca.txt279data:text/plain;base', // Frame 0
            '1102651112104065018274223C%3A%5Cfakepath%5Ca.txt279data:text/plain;basX', // Frame 0 incorrect (last character changed to X)
            '11125964,SmVkbmEsDQpEdsSbLg0KVMWZaQ0KxJvFocSNxZnFvsO9w6HDrcOpDQo=', // Frame 1
        ],
        expected: false // No file saved, we have frame 0 with incorrect data
        // This situation could be potentially identified with the (existing) correction. But why would we do that? If we have frame 0, we should not need the correction.
    },

    {
        name: "2 frames, send frame 0 with incorrect data and then correctly",
        frames: [
            '1102651112104065018274223C%3A%5Cfakepath%5Ca.txt279data:text/plain;basX', // Frame 0 incorrect (last character changed to X)
            '1102651112104065018274223C%3A%5Cfakepath%5Ca.txt279data:text/plain;base', // Frame 0
            '11125964,SmVkbmEsDQpEdsSbLg0KVMWZaQ0KxJvFocSNxZnFvsO9w6HDrcOpDQo=', // Frame 1
        ]
        // Expected: File saved, we have correct data at the moment when all frames were received
    },

    {
        name: "2 frames, send frame 1 correctly and then with incorrect data",
        frames: [
            '1102651112104065018274223C%3A%5Cfakepath%5Ca.txt279data:text/plain;base', // Frame 0
            '11125964,SmVkbmEsDQpEdsSbLg0KVMWZaQ0KxJvFocSNxZnFvsO9w6HDrcOpDQo=', // Frame 1
            '11125964,SmVkbmEsDQpEdsSbLg0KVMWZaQ0KxJvFocSNxZnFvsO9w6HDrcOpDQoX', // Frame 1 incorrect (last character changed to X)
        ]
        // Expected: File saved, we have correct data at the moment when all frames were received
    },

    {
        name: "2 frames, send frame 1 with incorrect data and then correctly",
        frames: [
            '1102651112104065018274223C%3A%5Cfakepath%5Ca.txt279data:text/plain;base', // Frame 0
            '11125964,SmVkbmEsDQpEdsSbLg0KVMWZaQ0KxJvFocSNxZnFvsO9w6HDrcOpDQoX', // Frame 1 incorrect (last character changed to X)
            '11125964,SmVkbmEsDQpEdsSbLg0KVMWZaQ0KxJvFocSNxZnFvsO9w6HDrcOpDQo=', // Frame 1
        ],
        // Expected: File saved, we have correct data at the moment when all frames were received
    },

    {
        name: "2 frames, miss frame 0, send incorrect correction",
        frames: [
            '11125964,SmVkbmEsDQpEdsSbLg0KVMWZaQ0KxJvFocSNxZnFvsO9w6HDrcOpDQo=', // Frame 1
            '130,1AAABAAMMBwUdYVxmX1JbcEN1aUJyUEFhUQ9CAwpzeBQ8ADpVOxk+HmNaIDJgDCIadEFKK1gDV3IwFxs7XzQ9DlRuO2Jhc1g=', // Correction frame (last character of frame 1 changed from e to X; then the correction frame was recreated)
        ],
        expected: false // No file saved, recovered frame 0 with wrong data, fails hash check
    },

    {
        name: "2 frames, miss frame 1, send incorrect correction, but the recovered frame 1 is shorter than the correction so the incorrect part is not used",
        frames: [
            '1102651112104065018274223C%3A%5Cfakepath%5Ca.txt279data:text/plain;base', // Frame 0
            '130,1AAABAAMMBwUdYVxmX1JbcEN1aUJyUEFhUQ9CAwpzeBQ8ADpVOxk+HmNaIDJgDCIadEFKK1gDV3IwFxs7XzQ9DlRuO2Jhc1g=', // Correction frame (last character of frame 1 changed from "e" to "X"; then the correction frame was recreated. The "2U=" at the end changed to "1g=".)
        ],
    },

    {
        name: "2 frames, miss frame 1, send incorrect correction (with changed 1st character)",
        frames: [
            '1102651112104065018274223C%3A%5Cfakepath%5Ca.txt279data:text/plain;base', // Frame 0
            '130,1AAABAAMMBwUdYVxmX1JbcEN1aUJyUEFhUQ9CAwpzeBQ8ADpVOxk+HmNaIAtgDCIadEFKK1gDV3IwFxs7XzQ9DlRuO2Jhc2U=', // Correction frame (in frame 1 content, the file namech changed from "a" to "X"; then the correction frame was recreated. The "DJ" in the middle changed to "At".)
        ],
        expected: false // No file saved, recovered frame 1 with wrong data, fails hash check
    },

    {
        name: "2 frames, miss frame 1, send a wrong frame 2 (so download is triggered)",
        frames: [
            '1102651112104065018274223C%3A%5Cfakepath%5Ca.txt279data:text/plain;base', // Frame 0
            '11211X', // Frame 3 incorrect
        ],
        expected: false // No file saved, missing frame 1
    },

    // Content fits 3 frames. (The capacity is 40.)

    {
        name: "3 frames, send all the content frames",
        frames: [
            '1102451112104065018274223C%3A%5Cfakepath%5Ca.txt279', // Frame 0
            '111245data:text/plain;base64,SmVkbmEsDQpEdsSbLg0KVM', // Frame 1
            '112234WZaQ0KxJvFocSNxZnFvsO9w6HDrcOpDQo=', // Frame 2
            // More correction scenarios are possible
            // Correction for 1% loss (one frame):
            // '150,1,2MTEzMjM0AgokAjsPKQI0XC8+ChUhVT4VNlVcPhpAEFF/YElQR3RKJWBRMDJMOB9EeWF0', // Correction frame for 1% loss
            // Correction for 64% loss (two frames):
            // '130,2AAACAAcBZmtQYwF7THpAc19Sa3xPblx0RTBqCjYTfQcUAiQVNDAbVSU1Q2EudHh0Mjc5', // Correction frame 1 for 64% loss
            // '130,1AAABAAAAVVBFUwtEUUhCGkBdWVtZD1BTQCYTB212WBUNAwYgAyUlGGBRMDJMOB9EeWF0', // Correction frame 2 for 64% loss
        ]
    },

    {
        name: "3 frames, send all the content frames, frame 0 as last",
        frames: [
            '111245data:text/plain;base64,SmVkbmEsDQpEdsSbLg0KVM', // Frame 1
            '112234WZaQ0KxJvFocSNxZnFvsO9w6HDrcOpDQo=', // Frame 2
            '1102451112104065018274223C%3A%5Cfakepath%5Ca.txt279', // Frame 0
        ]
    },

    {
        name: "3 frames, miss frame 0, send correction",
        frames: [
            '111245data:text/plain;base64,SmVkbmEsDQpEdsSbLg0KVM', // Frame 1
            '112234WZaQ0KxJvFocSNxZnFvsO9w6HDrcOpDQo=', // Frame 2
            '150,1,2MTEzMjM0AgokAjsPKQI0XC8+ChUhVT4VNlVcPhpAEFF/YElQR3RKJWBRMDJMOB9EeWF0', // Correction frame for 1% loss
        ]
    },

    {
        name: "3 frames, miss frame 1, send correction",
        frames: [
            '1102451112104065018274223C%3A%5Cfakepath%5Ca.txt279', // Frame 0
            '112234WZaQ0KxJvFocSNxZnFvsO9w6HDrcOpDQo=', // Frame 2
            '150,1,2MTEzMjM0AgokAjsPKQI0XC8+ChUhVT4VNlVcPhpAEFF/YElQR3RKJWBRMDJMOB9EeWF0', // Correction frame for 1% loss
        ]
    },

    {
        name: "3 frames, miss frame 2, send correction",
        frames: [
            '1102451112104065018274223C%3A%5Cfakepath%5Ca.txt279', // Frame 0
            '111245data:text/plain;base64,SmVkbmEsDQpEdsSbLg0KVM', // Frame 1
            '150,1,2MTEzMjM0AgokAjsPKQI0XC8+ChUhVT4VNlVcPhpAEFF/YElQR3RKJWBRMDJMOB9EeWF0', // Correction frame for 1% loss
        ]
    },


    {
        name: "3 frames, send correction trat recovers missing frame 1, then receive frame 1 which should be ignored",
        frames: [
            '1102451112104065018274223C%3A%5Cfakepath%5Ca.txt279', // Frame 0
            '130,1AAABAAAAVVBFUwtEUUhCGkBdWVtZD1BTQCYTB212WBUNAwYgAyUlGGBRMDJMOB9EeWF0', // Correction frame 2 for 64% loss
            '111245data:text/plain;base64,SmVkbmEsDQpEdsSbLg0KVM', // Frame 1
            '112234WZaQ0KxJvFocSNxZnFvsO9w6HDrcOpDQo=', // Frame 2
        ]
    },

    {
        name: "3 frames, miss frames 1 and 2, send corrections, recovery as correction frames are received",
        frames: [
            '1102451112104065018274223C%3A%5Cfakepath%5Ca.txt279', // Frame 0
            '130,2AAACAAcBZmtQYwF7THpAc19Sa3xPblx0RTBqCjYTfQcUAiQVNDAbVSU1Q2EudHh0Mjc5', // Correction frame 1 for 64% loss
            '130,1AAABAAAAVVBFUwtEUUhCGkBdWVtZD1BTQCYTB212WBUNAwYgAyUlGGBRMDJMOB9EeWF0', // Correction frame 2 for 64% loss
        ]
    },

    {
        name: "3 frames, miss frames 1 and 2, send corrections, recovery as correction frames are received, swap correction frames",
        frames: [
            '1102451112104065018274223C%3A%5Cfakepath%5Ca.txt279', // Frame 0
            '130,1AAABAAAAVVBFUwtEUUhCGkBdWVtZD1BTQCYTB212WBUNAwYgAyUlGGBRMDJMOB9EeWF0', // Correction frame 2 for 64% loss
            '130,2AAACAAcBZmtQYwF7THpAc19Sa3xPblx0RTBqCjYTfQcUAiQVNDAbVSU1Q2EudHh0Mjc5', // Correction frame 1 for 64% loss
        ]
    },

    {
        name: "3 frames, miss frames 1 and 2, send corrections, recovery as correction frames are received",
        frames: [
            '112234WZaQ0KxJvFocSNxZnFvsO9w6HDrcOpDQo=', // Frame 2
            '130,2AAACAAcBZmtQYwF7THpAc19Sa3xPblx0RTBqCjYTfQcUAiQVNDAbVSU1Q2EudHh0Mjc5', // Correction frame 1 for 64% loss
            '130,1AAABAAAAVVBFUwtEUUhCGkBdWVtZD1BTQCYTB212WBUNAwYgAyUlGGBRMDJMOB9EeWF0', // Correction frame 2 for 64% loss
        ]
    },

    {
        name: "3 frames, miss frames 1 and 2, send corrections, unused correction frames must be stored for a later correction",
        frames: [
            '112234WZaQ0KxJvFocSNxZnFvsO9w6HDrcOpDQo=', // Frame 2
            '130,1AAABAAAAVVBFUwtEUUhCGkBdWVtZD1BTQCYTB212WBUNAwYgAyUlGGBRMDJMOB9EeWF0', // Correction frame 2 for 64% loss
            '130,2AAACAAcBZmtQYwF7THpAc19Sa3xPblx0RTBqCjYTfQcUAiQVNDAbVSU1Q2EudHh0Mjc5', // Correction frame 1 for 64% loss
        ]
    }
];

// Test disabled, because it is too long for practical use
// let longTest = {
//     name: "Many frames",
//     frames: [
//         '1102651112104065018274223C%3A%5Cfakepath%5Ca.txt599999data:text/plain;base', // Frame 0 incorrect, length of data changed to 99999
//         '11125964,SmVkbmEsDQpEdsSbLg0KVMWZaQ0KxJvFocSNxZnFvsO9w6HDrcOpDQoX', // Frame 1 incorrect (last character changed to X)
//     ],
//     expected: false // No file saved as after frame 0 and incorrect frame 1, there many frames
// }
// for (let i = 2; i < 301; i++) {
//     const doubleFromIndex = 100
//     let content = "";
//
//     content += encodeWithLength(i < doubleFromIndex ? i : doubleFromIndex + 2 * (i - doubleFromIndex + 1));
//     content += "214SomeMadeUpData";
//
//     longTest.frames.push(content);
// }
// testFrames.push(longTest)
//
// function encodeWithLength(obj) {
//     let length;
//     if (typeof obj === "string")
//         length = obj.length;
//     else if (typeof obj === "number")
//         length = getNumberLength(obj);
//     else
//         throw Error("Unsupported type " + typeof obj);
//
//     const lengthOfLength = getNumberLength(length);
//     if (9 < lengthOfLength)
//         throw Error("Too long length of length");
//
//     return lengthOfLength.toString() + length.toString() + obj;
// }
//
// function getNumberLength(number) {
//     return number.toString().length;
// }

let fileSimulated = -1;
let frameSimulated;
let downloadedInSimulation;

function simulationInProgress() {
    return 0 <= fileSimulated && fileSimulated < testFrames.length;
}

function scanSimulated() {
    if (fileSimulated < 0 || (frameSimulated + 1 === testFrames[fileSimulated].frames.length)) {
        // Check downloaded status of the test that just finished
        if (fileSimulated >= 0) {
            const downloadExpected = testFrames[fileSimulated].expected ?? true;
            if (downloadExpected !== downloadedInSimulation) {
                log("Test '" + testFrames[fileSimulated].name + "' failed: expected downloaded = " + downloadExpected + " but got " + downloadedInSimulation);
                throw Error("Test failed");
            }
        }

        // Move to next file
        fileSimulated++;
        frameSimulated = 0;
        downloadedInSimulation = false;
        init();

        if (!simulationInProgress()) {
            log("=== Simulated scans finished === ");
            updateInfo();

            // Have to clean it manually after tests to really get it to the initial state (as in HTML)
            const el = document.getElementById("info");
            el.innerHTML = "";

            return;
        }

        log("=== Next simulated scan: " + testFrames[fileSimulated].name + " ===");
    } else {
        frameSimulated++;
    }
    let frameData = testFrames[fileSimulated].frames[frameSimulated]
    if (frameData != undefined) {
        onScan(frameData);
    }

    setTimeout(scanSimulated, 10);
}

function tests() {
    // assertEqual("decodeWithLength 0", decodeWithLength("10"), [1, "", 1]);
    assertEqual("decodeWithLength 1", decodeWithLength("110", 0), [1, "0", 3]);
    assertEqual("decodeWithLength 2", decodeWithLength("120.", 0), [2, "0.", 4]);
    assertEqual("decodeWithLength 9", decodeWithLength("190........", 0), [9, "0........", 11]);

    assertEqual("decodeWithLength 10", decodeWithLength("2100.........", 0), [10, "0.........", 13]);
    assertEqual("decodeWithLength 11", decodeWithLength("2110.........1", 0), [11, "0.........1", 14]);

    log("Tests finished");
}


/*
    Download
    ========
 */

function download(strData, strFileName, strMimeType) {
    let a = document.createElement("a");

    // build download link:
    a.href = "data:" + strMimeType + "charset=utf-8," + escape(strData);

    if (window.MSBlobBuilder) { // IE10
        let bb = new MSBlobBuilder();
        bb.append(strData);
        return navigator.msSaveBlob(bb, strFileName);
    }

    if ('download' in a) { // FF20, CH19
        a.setAttribute("download", strFileName);
        a.innerHTML = "downloading...";
        document.body.appendChild(a);
        setTimeout(function () {
            const e = document.createEvent("MouseEvents");
            e.initMouseEvent("click", true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
            a.dispatchEvent(e);
            document.body.removeChild(a);
        }, 66);
        return true;
    }

    // do iframe dataURL download: (older W3)
    const f = document.createElement("iframe");
    document.body.appendChild(f);
    f.src = "data:" + (strMimeType ? strMimeType : "application/octet-stream") + (window.btoa ? ";base64" : "") + "," + (window.btoa ? window.btoa : escape)(strData);
    setTimeout(function () {
        document.body.removeChild(f);
    }, 333);
    return true;
}

/*
    Errors
    ======
 */

class MissingFrameError extends Error {
    constructor(missing) {
        super("Missing frames: " + missing);
        this.name = "MissingFrameError";
        this.missing = missing;
    }
}

class NotAllDataError extends Error {
    constructor(message) {
        super(message);
        this.name = "NotAllDataError";
    }
}

/*
    Main content
    ============
 */

let contentRead; // contentRead[frameIndex] contains the content of frame frameIndex

let hashSaved; // hash of the last saved file (specifically the received hash (of fileName + data)

let headerDecoded; // true if the header (typically in frame 0, but can continue in following frames) was decoded successfully

let unusedCorrectionFrames; // Store correction frames that could not be used immediately, but might be useful later

let contentPrevious; // Content of previous data in QR code

const QR_CODE_SAME_AS_PREVIOUS = 1;
const FRAME_DECODED = 2;
const CORRECTION_DECODED = 3;
const CORRECTION_IMPOSSIBLE_MORE_FRAMES_MISSING = 4;
const CORRECTION_ALL_DATA_KNOWN = 5;
const CORRECTION_IMPOSSIBLE_MORE_FRAMES_MISSING_DUPLICATE = 6;
const FRAME_ALREADY_KNOWN = 7;

function init() {
    contentRead = [];
    hashSaved = undefined;
    headerDecoded = false;
    unusedCorrectionFrames = [];
    contentPrevious = undefined;
}

function decodeWithLength(str, from) {
    const lengthOfLengthStr = str.slice(from, from + 1);
    if (lengthOfLengthStr.length != 1) {
        throw new Error("Invalid variable-length quantity value: length of length cannot be determined");
    }
    const lengthOfLength = Number(lengthOfLengthStr);
    if (isNaN(lengthOfLength)) {
        throw new Error("Invalid variable-length quantity value: length of length is not a number");
    }

    const lengthStr = str.slice(from + 1, from + 1 + lengthOfLength);
    const length = Number(lengthStr);
    if (isNaN(length)) {
        throw new Error("Invalid variable-length quantity value: length is not a number");
    }

    const data = str.slice(from + 1 + lengthOfLength, from + 1 + lengthOfLength + length);

    const next = from + 1 + lengthOfLength + length;

    return [length, data, next];
}

function decodeFrameContent(content) {
    let from = 0;
    let frameStr, contentFrame;

    [, frameStr, from] = decodeWithLength(content, from);
    [, contentFrame, from] = decodeWithLength(content, from);

    return [frameStr, contentFrame];
}

function getContent() {
    let content = "";
    let missing = [];

    for (let i = 0; i < contentRead.length; i++) {
        if (contentRead[i] === undefined) {
            missing.push(i);
        } else {
            let [frameStr, contentFrame] = decodeFrameContent(contentRead[i]);

            // Hardening: check that the frame index matches the position in the array
            frame = Number(frameStr);
            if (i != frame) {
                throw new Error("Frame index mismatch: expected " + i + " but got " + frame);
            }

            content += contentFrame;
        }
    }

    if (0 < missing.length) {
        throw new MissingFrameError(missing);
    }

    return content;
}

function decodeContentWithoutChecks(content) {
    let length, from = 0;
    let versionStr, hash, fileName, fileNameEncoded, data;

    [length, versionStr, from] = decodeWithLength(content, from);
    let version = Number(versionStr);
    if (isNaN(version)) {
        throw new Error("Error decoding content: version is not a number");
    }
    if (version !== 1)
        throw new Error("Unsupported version " + version);

    [length, hash, from] = decodeWithLength(content, from);

    [length, fileNameEncoded, from] = decodeWithLength(content, from);
    fileName = decodeURIComponent(fileNameEncoded);

    [length, data, from] = decodeWithLength(content, from);

    return [version, hash, fileName, data, length, from];
}

function decodeContent() {
    const content = getContent();
    let [version, hash, fileName, data, length, from] = decodeContentWithoutChecks(content);

    if (length !== data.length)
        throw new NotAllDataError("Not all data");

    // Verify hash
    const hashCalculated = hashFnv32a(fileName + data, false);
    if (hash !== hashCalculated.toString()) {
        log("Incorrect hash")
        throw new NotAllDataError("Incorrect hash");
    }

    return [hash, fileName, data];
}

function getContentInfo() {
    let [frameStr, content] = decodeFrameContent(contentRead[0]); // TODO Assumption: The header is in frame 0. In fact, it can continue in following frames.
    let [version, hash, fileName, data, length, from] = decodeContentWithoutChecks(content);

    const capacityForDataInOneFrame = content.length;
    const numberOfFrames = Math.ceil(from / capacityForDataInOneFrame); // Keep this consistent with calculation in show.js

    return [hash, fileName, numberOfFrames];
}

function decodeCorrectionFrame(content) {
    let [indicesLen, indicesStr, from] = decodeWithLength(content, 0);
    let indices = indicesStr.split(",").map(Number);
    let payload = content.slice(from)

    // Find all missing indices
    let missingIndices = indices.filter(idx => contentRead[idx] === undefined);
    // Only recover if exactly one is missing. If more than one is missing, store the correction for a later use.
    if (missingIndices.length == 0) {
        return {resultCode: CORRECTION_ALL_DATA_KNOWN};
    } else if (missingIndices.length !== 1) {
        if (unusedCorrectionFrames.includes(content)) {
            return {resultCode: CORRECTION_IMPOSSIBLE_MORE_FRAMES_MISSING_DUPLICATE};
        } else {
            unusedCorrectionFrames.push(content);
            return {resultCode: CORRECTION_IMPOSSIBLE_MORE_FRAMES_MISSING, frames: missingIndices};
        }

    }

    let missingIndex = missingIndices[0];
    let xor = atob(payload);
    for (let idx of indices) {
        if (idx !== missingIndex) {
            xor = xorStrings(xor, contentRead[idx]);
        }
    }

    let result = saveFrame(xor);

    // Hardening: check that the frame index matches the position in the array
    if (missingIndex != result.frame) {
        log("Warning: Frame index mismatch in recovered frame: expected " + missingIndex + " but got " + result.frame);
    }

    return {resultCode: CORRECTION_DECODED, frame: result.frame};
}

function saveFrame(content) {
    // Use the recovered content as a normal frame
    let [frameStr, contentFrame] = decodeFrameContent(content);

    frame = Number(frameStr);
    if (isNaN(frame)) {
        throw new Error("Error decoding: frame is not a number");
    }

    if (contentRead[frame] != null) {
        if (contentRead[frame] === content) {
            return {resultCode: FRAME_ALREADY_KNOWN, frame};
        } else {
            // TODO It seems that when a data frame is 1. recovered from correction and then 2. scanned again, it can have different content. Why?
            log("Frame " + frame + " with new content, length " + content.length + ": " + content);
            log("       previous content, length " + contentRead[frame].length + ": " + contentRead[frame]);

            // log("Frame " + frame + " with new content");
            // Encountered a frame with a new content.
            // This is not usual, but can happen when two files are sent.
        }
    }

    contentRead[frame] = content;

    return {resultCode: FRAME_DECODED, frame};
}

// TODO Recovery with unused frames can be done more effectively: By looking at the indices, we can order them appropriately. The current solution just keeps trying until no correction can be used.
function recoveryWithUnusedCorrectionFrames() {
    let frameList = [];
    let changed = true;
    while (changed) {
        changed = false;
        for (let i = unusedCorrectionFrames.length - 1; i >= 0; i--) {
            const content = unusedCorrectionFrames[i];
            let result = decodeCorrectionFrame(content)
            if (result.resultCode == CORRECTION_DECODED) {
                log("Used a stored correction frame to recover a missing frame " + result.frame + " with content " + contentRead[result.frame]);
                frameList.push(result.frame);
                unusedCorrectionFrames.splice(i, 1);
                changed = true;
            } else if (result.resultCode == CORRECTION_ALL_DATA_KNOWN) {
                log("A stored correction frame removed as all the data is known");
                unusedCorrectionFrames.splice(i, 1);
            }
        }
    }
    if (0 < frameList.length) {
        removeUnneededStoredCorrectionFrames();
    }
    return frameList;
}

function removeUnneededStoredCorrectionFrames() {
    for (let i = unusedCorrectionFrames.length - 1; i >= 0; i--) {
        const content = unusedCorrectionFrames[i];

        let [indicesLen, indicesStr, from] = decodeWithLength(content, 0);
        let indices = indicesStr.split(",").map(Number);

        // Find all missing indices
        let missingIndices = indices.filter(idx => contentRead[idx] === undefined);

        if (missingIndices.length == 0) {
            log("A stored correction frame removed as all the data is known: " + content);
            unusedCorrectionFrames.splice(i, 1);
        }
    }
}

function isCorrectionFrame(content) {
    // Simple heuristic: try to decode as correction frame, e.g. if first field is a list of indices
    try {
        let [indicesLen, indicesStr] = decodeWithLength(content, 0);
        return indicesStr.includes(",");
    } catch {
        return false;
    }
}

function processFrame(content) {
    if (isCorrectionFrame(content)) {
        let result = decodeCorrectionFrame(content);
        if (result.resultCode == CORRECTION_DECODED) {
            log("Recovered frame " + result.frame + " with content " + contentRead[result.frame]);
            let frameList = recoveryWithUnusedCorrectionFrames();
            frameList.unshift(result.frame);
            return {resultCode: CORRECTION_DECODED, frames: frameList};
        } else {
            if (result.resultCode == CORRECTION_ALL_DATA_KNOWN) {
                log("Correction frame received, but ignored as all the data is known");
            } else if (result.resultCode == CORRECTION_IMPOSSIBLE_MORE_FRAMES_MISSING_DUPLICATE) {
                log("Correction frame received, but it's already stored: " + content);
            } else if (result.resultCode == CORRECTION_IMPOSSIBLE_MORE_FRAMES_MISSING) {
                log("Correction frame received, but cannot be used now (missing " + result.frames.length + " frames: " + result.frames + "), storing for later use");
            }
            return result;
        }
    } else {
        let result = saveFrame(content);
        if (result.resultCode == FRAME_DECODED) {
            log("Read frame " + result.frame + " with content " + contentRead[result.frame]);

            let frameList = recoveryWithUnusedCorrectionFrames();
            return {resultCode: FRAME_DECODED, frame: result.frame, frames: frameList};
        } else if (result.resultCode == FRAME_ALREADY_KNOWN) {
            log("Read frame " + result.frame + " which was already known");
            return result;
        } else {
            throw Erorr("Unsupported result code " + result.resultCode);
        }
    }
}

function decodeHeader(frame) {
    // Log when header decoded later than in first frame (with index 0)
    try {
        if (!headerDecoded) {
            let [hash, fileName, numberOfFrames] = getContentInfo();
            log("File name = " + fileName);
            log("Frames = " + numberOfFrames);
            headerDecoded = true;
            if (0 < frame) {
                log("Header decoded");
            }
        }
    } catch (e) {
        log("Cannot decode header");
    }
}

function allFramesRead() {
    if (!headerDecoded) {
        return false;
    }

    let [hash, fileName, numberOfFrames] = getContentInfo();
    const numberOfFramesReceived = Object.keys(contentRead).length;

    return numberOfFrames <= numberOfFramesReceived;
}

// Return list if indices till maxIndex index that are missing in contentRead
function getMissingFrames() {
    const maxIndex = Math.max(...Object.keys(contentRead).map(Number));
    const framesRead = Object.keys(contentRead).map(Number);

    let missing = [];
    for (let i = 0; i <= maxIndex; i++) {
        if (!framesRead.includes(i)) {
            missing.push(i);
        }
    }

    return missing;
}

function saveFile() {
    try {
        // If all frames then download
        log("All frames received, trying to save file");

        let [hash, fileName, dataURL] = decodeContent();

        if (hash !== hashSaved) {
            log("Got all frames");
            log("File name = " + fileName);
            log("Data = " + dataURL);

            const fileNameLast = getFileNameLast(fileName);

            const posComma = dataURL.indexOf(",");
            const b64 = dataURL.slice(posComma + 1);
            const fileContent = atob(b64);

            log("Downloading as " + fileNameLast);
            if (simulationInProgress()) {
                log("Skipping download in simulation");
                downloadedInSimulation = true;
            } else {
                download(fileContent, fileNameLast, 'text/plain');
            }

            hashSaved = hash;
            return {saved: true};
        }
    } catch (e) {
        if (e instanceof MissingFrameError) {
            // The dataURL is not complete yet
            log("Missing frames " + e.missing);
            return {missing: e.missing};
        } else if (e instanceof NotAllDataError) {
            // Do nothing - it's normal that we do not have all data yet
        } else {
            log("Error when trying to save file" + "\n" +
                "Error: " + e.toString() + "\n" +
                "Stack trace: " + e.stack);
        }
    }
}

function onScan(content) {
    // End if the same content as previously
    if (content == contentPrevious) {
        return {resultCode: QR_CODE_SAME_AS_PREVIOUS};
    }
    contentPrevious = content;

    let result = processFrame(content);
    if (![FRAME_DECODED, CORRECTION_DECODED].includes(result.resultCode)) {
        return result;
    }

    decodeHeader(frame);

    if (allFramesRead()) {
        let resultSave = saveFile();
        if (resultSave != undefined && resultSave.saved) {
            updateInfo();
        } else if (resultSave != undefined && resultSave.missing) {
            updateInfo(resultSave.missing);
        }
    } else {
        let missing = getMissingFrames();
        updateInfo(missing);
    }

    return result;
}

function getFileNameLast(fileName) {
    const posSlash = fileName.lastIndexOf("\\");
    return fileName.slice(posSlash + 1);
}

function updateInfo(missing) {
    let infoStr = "";
    try {
        let [hash, fileName, numberOfFrames] = getContentInfo();
        const fileNameLast = getFileNameLast(fileName);

        let infoStr2 = "";
        if (hash === hashSaved) {
            infoStr2 += "<span style='color: #008000'>Saved</span> ";
        } else {
            let receivedDataFrames = Object.keys(contentRead).length;
            let percent = Math.round(receivedDataFrames / numberOfFrames * 100 * 100) / 100; // Round to two decimal places (only if necessary)
            infoStr2 = percent + "% ... " + receivedDataFrames + " / " + numberOfFrames + " data frames, and " + unusedCorrectionFrames.length + " correction frames. ";
        }
        infoStr2 += fileNameLast;

        infoStr += infoStr2;
    } catch (e) {
        let receivedDataFrames = Object.keys(contentRead).length;
        infoStr += "?% ..." + receivedDataFrames + " / ? data frames, and " + unusedCorrectionFrames.length + " correction frames";
    }
    infoStr += "</br>";

    const elMissingList = document.getElementById("missingList");
    if (missing !== undefined) {
        if (0 < contentRead.length) {
            const maxIndex = Math.max(...Object.keys(contentRead).map(Number));
            let lossRate = missing.length / maxIndex;
            infoStr += "Loss rate " + (100 * lossRate).toFixed(2) + "%. ";
        }

        infoStr += "Missing " + missing.length + ":";

        elMissingList.innerHTML = formatMissing(missing);
        elMissingList.hidden = false;
    } else {
        elMissingList.hidden = true;
    }

    const el = document.getElementById("info");
    el.innerHTML = infoStr;
}

// Parameter missing must be an ordered array of numbers.
// Formats the missing array as a string. Consecutive numbers are grouped as ranges in the format N+M, where N is the first number in the range and M is the lengths of consecutive sequence.
// Example: [1,3,4,6,7,8] -> "1,3+1,6+2"
function formatMissing(missing) {
    if (!missing || missing.length === 0) return "";

    let result = [];
    let start = missing[0];
    let count = 1;

    for (let i = 1; i < missing.length; i++) {
        if (missing[i] === missing[i - 1] + 1) {
            count++;
        } else {
            if (count > 1) {
                result.push(start + "+" + (count - 1));
            } else {
                result.push(start.toString());
            }
            start = missing[i];
            count = 1;
        }
    }
    // Add the last range or number
    if (count > 1) {
        result.push(start + "+" + (count - 1));
    } else {
        result.push(start.toString());
    }

    return result.join(", ");
}

// Inspired by
// https://simpl.info/getusermedia/sources/ - getting the selector with cameras
// https://cozmo.github.io/jsQR/ - getting the video stream and processing video frame by frame
function initStream() {
    let lastFrameTime = null;

    const cameraSelect = document.getElementById('cameraSelect');

    let currentStream = null;

    let video = document.createElement("video");
    let canvasElement = document.getElementById("canvas");
    let canvas = canvasElement.getContext("2d");
    let status = document.getElementById("status");

    let flipVideo;

    cameraSelect.onchange = function () {
        getStream(cameraSelect.value);
    };

    // Start with default camera. Only then we can get all the devices.
    getStream().then(getDevices).then(gotDevices);

    function getDevices() {
        return navigator.mediaDevices.enumerateDevices();
    }

    function gotDevices(deviceInfos) {
        cameraSelect.innerHTML = '';
        for (const deviceInfo of deviceInfos) {
            // log("Got device: kind=" + deviceInfo.kind + ", deviceId=" + deviceInfo.deviceId + ", label=" + deviceInfo.label)
            if (deviceInfo.kind === 'videoinput') {
                const option = document.createElement('option');
                option.value = deviceInfo.deviceId;
                option.text = deviceInfo.label || `Camera ${cameraSelect.length + 1}`;
                cameraSelect.appendChild(option);
            }
        }
        selectBackCamera();
    }

    function getStream(deviceId) {
        if (currentStream) {
            currentStream.getTracks().forEach(track => track.stop());
        }
        const constraints = {
            video: deviceId ? {deviceId: {exact: deviceId}} : {undefined}
        };
        return navigator.mediaDevices.getUserMedia(constraints).then(gotStream).catch(handleError);
    }

    function gotStream(stream) {
        currentStream = stream;
        video.srcObject = stream;
        video.setAttribute("playsinline", true); // required to tell iOS safari we don't want fullscreen
        video.play();

        cameraSelect.selectedIndex = [...cameraSelect.options]
            .findIndex(option => option.text === stream.getVideoTracks()[0].label);

        let option = cameraSelect.options[cameraSelect.selectedIndex];
        if (option) {
            flipVideo = !option.text.toLowerCase().includes("back")
            if (flipVideo) {
                log("Flipping video horizontally");
            }
        }

        requestAnimationFrame(onAnimationFrame);
    }

    function handleError(error) {
        console.error('Error: ', error);
        log("Error getting camera: " + error)
    }

    function selectBackCamera() {
        for (let i = 0; i < cameraSelect.options.length; i++) {
            let label = cameraSelect.options[i].text;
            if (label.toLowerCase().includes("back")) { // Most Android cameras have "back" or "front" in their label
                log("Selecting back camera: " + label)
                cameraSelect.selectedIndex = i;
                cameraSelect.onchange();
                break;
            }
        }
    }


    function drawLine(begin, end, color) {
        canvas.beginPath();
        canvas.moveTo(begin.x, begin.y);
        canvas.lineTo(end.x, end.y);
        canvas.lineWidth = 4;
        canvas.strokeStyle = color;
        canvas.stroke();
    }

    function onAnimationFrame() {
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
            // Calculate scan speed
            let now = Date.now();
            if (lastFrameTime !== null) {
                let scanSpeedMs = now - lastFrameTime;
                let scanFps = (1000 / scanSpeedMs).toFixed(1);
                document.getElementById("scanSpeed").innerText = "Scan speed: " + scanSpeedMs.toFixed(1) + " ms (" + scanFps + " fps).";
            }
            lastFrameTime = now;

            canvasElement.hidden = false;
            canvasElement.height = video.videoHeight;
            canvasElement.width = video.videoWidth;

            // Flip video horizontally
            if (!flipVideo) {
                canvas.drawImage(video, 0, 0, canvasElement.width, canvasElement.height);
            } else {
                canvas.save();
                canvas.scale(-1, 1);
                canvas.drawImage(video, -canvasElement.width, 0, canvasElement.width, canvasElement.height);
                canvas.restore();
            }
            let imageData = canvas.getImageData(0, 0, canvasElement.width, canvasElement.height);
            let code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: "dontInvert",
            });
            if (code) {
                drawLine(code.location.topLeftCorner, code.location.topRightCorner, "#FF3B58");
                drawLine(code.location.topRightCorner, code.location.bottomRightCorner, "#FF3B58");
                drawLine(code.location.bottomRightCorner, code.location.bottomLeftCorner, "#FF3B58");
                drawLine(code.location.bottomLeftCorner, code.location.topLeftCorner, "#FF3B58");

                try {
                    let result = onScan(code.data);
                    if (result.resultCode == QR_CODE_SAME_AS_PREVIOUS) {
                        // Do nothing - keep the previous string
                    } else if (result.resultCode == FRAME_DECODED) {
                        status.innerText = result.frames != undefined && 0 < result.frames.length
                            ? "QR code with frame " + result.frame + " and recovered frames " + result.frames
                            : "QR code with frame " + result.frame;
                    } else if (result.resultCode == FRAME_ALREADY_KNOWN) {
                        status.innerText = "QR code with frame " + result.frame + " already known";
                    } else if (result.resultCode == CORRECTION_DECODED) {
                        status.innerText = "QR code with correction used to decode frames " + result.frames;
                    } else if (result.resultCode == CORRECTION_ALL_DATA_KNOWN) {
                        status.innerText = "QR code with correction not needed - all data already known";
                    } else if (result.resultCode == CORRECTION_IMPOSSIBLE_MORE_FRAMES_MISSING_DUPLICATE) {
                        status.innerText = "QR code with correction not needed - correction already stored";
                    } else if (result.resultCode == CORRECTION_IMPOSSIBLE_MORE_FRAMES_MISSING) {
                        status.innerText = "QR code with correction saved to be used later";
                    } else {
                        status.innerText = "Unknown result code " + result.resultCode;
                    }
                } catch (e) {
                    log("Error processing QR code: " + e.toString() + "\n" +
                        "QR code content: " + code.data + "\n" +
                        "Stack trace:" + "\n" + e.stack);
                    status.innerText = "Unsupported QR code (Error: " + e.toString() + ")";
                }
            } else {
                status.innerText = "No QR code";
            }
        } else {
            // status.innerText = "Loading video..."
        }
        requestAnimationFrame(onAnimationFrame);
    }
}

function onLoad() {
    tests();

    initStream();

    // scanSimulated();
}

init();
