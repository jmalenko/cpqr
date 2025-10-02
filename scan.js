/*
    Common
    ======
 */

function formatDate(date) {
    let year = date.getFullYear();
    let month = date.getMonth();
    let day = date.getDate();
    let hours = date.getHours();
    let minutes = date.getMinutes();
    let seconds = date.getSeconds();
    let millis = date.getMilliseconds();

    month++;
    month = month < 10 ? '0' + month : month;
    day = day < 10 ? '0' + day : day;
    minutes = minutes < 10 ? '0' + minutes : minutes;
    seconds = seconds < 10 ? '0' + seconds : seconds;
    millis = millis < 10 ? '00' + millis : millis < 100 ? '0' + millis : millis;

    return year + "-" + month + "-" + day + " " + hours + ':' + minutes + ':' + seconds + "." + millis;
}

function log(str) {
    const MAX_LINES = 100;

    const date = new Date();
    const el = document.getElementById("log");
    const logLine = "[" + formatDate(date) + "] " + str;
    const lines = (el.innerHTML ? el.innerHTML.split('\n') : []);
    lines.unshift(logLine);
    el.innerHTML = lines.slice(0, MAX_LINES).join('\n');
}

/**
 * Calculate a 32 bit FNV-1a hash
 * Found here: https://gist.github.com/vaiorabbit/5657561
 * Ref.: http://isthe.com/chongo/tech/comp/fnv/
 *
 * @param {string} str the input value
 * @param {boolean} [asString=false] set to true to return the hash value as
 *     8-digit hex string instead of an integer
 * @param {integer} [seed] optionally pass the hash of the previous chunk
 * @returns {integer | string}
 */
function hashFnv32a(str, asString, seed) {
    /*jshint bitwise:false */
    var i, l,
        hval = (seed === undefined) ? 0x811c9dc5 : seed;

    for (i = 0, l = str.length; i < l; i++) {
        hval ^= str.charCodeAt(i);
        hval += (hval << 1) + (hval << 4) + (hval << 7) + (hval << 8) + (hval << 24);
    }
    if (asString) {
        // Convert to 8 digit hex string
        return ("0000000" + (hval >>> 0).toString(16)).slice(-8);
    }
    return hval >>> 0;
}

// XOR two strings (byte-wise)
function xorStrings(a, b) {
    let res = '';
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
        let charA = a.charCodeAt(i) || 0;
        let charB = b.charCodeAt(i) || 0;
        let xor = charA ^ charB;
        res += String.fromCharCode(xor);
    }
    return res;
}

/*
    Common but used in this script only
    ===================================
 */

var getStackTrace = function () {
    let obj = {};
    Error.captureStackTrace(obj, getStackTrace);
    return obj.stack;
};

/*
    Tests & Simulation
    ==================
 */

const testFrames = [
    // Prepared with the same content.

    // Content fits 2 frames. (The capacity is 50.)

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

let fileSimulated = -1;
let frameSimulated;

function simulationInProgress() {
    return 0 <= fileSimulated && fileSimulated < testFrames.length;
}

function initData() {
    contentRead = [];
    hashSaved = "";
    unusedCorrectionFrames = [];
}

function scanSimulated() {
    if (fileSimulated < 0 || (frameSimulated + 1 === testFrames[fileSimulated].frames.length)) {
        // Move to next file
        fileSimulated++;
        frameSimulated = 0;
        initData();

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

function assertEqual(testName, a, b) {
    if (typeof a !== typeof b) {
        log("Test " + testName + " error: Have different types: got " + typeof a + " but expected " + typeof b);
        return
    }
    if (a instanceof Array) {
        if (a.length !== b.length) {
            log("Test " + testName + " error: Arrays have different lengths: got " + a.length + " but expected " + b.length);
            return
        }
        for (let i = 0; i < a.length; i++)
            if (a[i] !== b[i]) {
                log("Test " + testName + " error: Not equal at index " + i + ": got " + a[i] + " but expected " + b[i]);
                return
            }
    } else if (a !== b) {
        log("Test " + testName + " error: Not equal: got " + a + " but expected " + b)
    }
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

let contentRead = []; // contentRead[frameIndex] contains the content of frame frameIndex

let hashSaved; // hash of the last saved file (specifically the received hash (of fileName + data)

let headerDecoded = false; // true if the header (typically in frame 0, but can continue in following frames) was decoded successfully

let unusedCorrectionFrames = []; // Store correction frames that could not be used immediately, but might be useful later

function decodeWithLength(str, from) {
    const lengthOfLengthStr = str.slice(from, from + 1);
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
    if (hash !== hashCalculated.toString())
        throw new Error("Incorrect hash");

    return [hash, fileName, data];
}

function getContentInfo() {
    let [, content] = decodeFrameContent(contentRead[0]); // TODO Assumption: The header is in frame 0. In fact, it can continue in following frames.
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
    if (missingIndices.length !== 1) {
        log("Correction frame received, but cannot be used now (missing " + missingIndices.length + " frames: " + missingIndices + "), storing for later use");
        unusedCorrectionFrames.push(content);
        return -1;
    }

    let missingIndex = missingIndices[0];
    let xor = atob(payload);
    for (let idx of indices) {
        if (idx !== missingIndex) {
            xor = xorStrings(xor, contentRead[idx]);
        }
    }

    let frame = saveFrame(xor);

    // Hardening: check that the frame index matches the position in the array
    if (missingIndex != frame) {
        log("Warning: Frame index mismatch in recovered frame: expected " + missingIndex + " but got " + frame);
    }

    return frame;
}

function saveFrame(content) {
    // Use the recovered content as a normal frame
    let [frameStr, contentFrame] = decodeFrameContent(content);

    frame = Number(frameStr);
    if (isNaN(frame)) {
        throw new Error("Error decoding: frame is not a number");
    }

    if (contentRead[frame] != null) {
        if (contentRead[frame] === contentFrame) {
            log("Frame " + frame + " with the same content was already encountered in the past");
            return frame;
        } else {
            // Encountered a frame with a new content.
            // This is not usual, but can happen when two files are sent.
        }
    } else {
        log("Read frame " + frameStr + " with content " + contentFrame);
    }

    contentRead[frame] = content;

    return frame;
}

// TODO Recovery with unused frames can be done more effectively: By looking at the indices, we can order them appropriately. The current solution just keeps trying until no correction can be used.
function recoveryWithUnusedCorrectionFrames() {
    let changed = true;
    while (changed) {
        changed = false;
        for (let i = unusedCorrectionFrames.length - 1; i >= 0; i--) {
            const frame = unusedCorrectionFrames[i];
            var recoveredFrame = decodeCorrectionFrame(frame)
            if (recoveredFrame != -1) {
                log("Used a stored correction frame to recover a missing frame " + recoveredFrame + " with content " + contentRead[recoveredFrame]);
                unusedCorrectionFrames.splice(i, 1);
                changed = true;
            }
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
    try {
        if (isCorrectionFrame(content)) {
            var recoveredFrame = decodeCorrectionFrame(content);
            if (recoveredFrame != -1) {
                log("Recovered frame " + recoveredFrame + " with content " + contentRead[recoveredFrame]);
                recoveryWithUnusedCorrectionFrames();
            }
            return recoveredFrame;
        } else {
            return saveFrame(content);
        }
    } catch (e) {
        console.log("Error processing QR code: " + e.toString(), e)
        log("Error processing frame" + "\n" +
            "Content: " + content + "\n" +
            "Error: " + e.toString() + "\n" +
            "Stack trace: " + getStackTrace());
        throw new QrCodeProcessingError("QR Code does not contain a frame");
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

function saveFile() {
    // If all frames then download
    try {
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
                log("Simulation - skipping download");
            } else {
                download(fileContent, fileNameLast, 'text/plain');
            }

            hashSaved = hash;
        }
    } catch (e) {
        if (e instanceof MissingFrameError) {
            // The dataURL is not complete yet
            log("Missing frames " + e.missing);
            return e.missing;
        } else if (e instanceof NotAllDataError) {
            // Do nothing - it's normal that we do not have all data yet
        } else {
            log("Error when trying to save file" + "\n" +
                "Error: " + e.toString() + "\n" +
                "Stack trace: " + getStackTrace());
            throw e;
        }
    }
}

function onScan(content) {
    let frame = processFrame(content);

    decodeHeader(frame);

    let missing = saveFile();

    updateInfo(missing);

    return frame;
}

function getFileNameLast(fileName) {
    const posSlash = fileName.lastIndexOf("\\");
    return fileName.slice(posSlash + 1);
}

function updateInfo(missing) {
    let infoStr = "";
    // TODO Improve the percent calculation - consider the missing parts. Also, percent biger than 100% does not make sense. Also in show.js.
    try {
        let [hash, fileName, numberOfFrames] = getContentInfo();
        const fileNameLast = getFileNameLast(fileName);

        let infoStr2 = "";
        if (hash === hashSaved) {
            infoStr2 += "<span style='color: #008000'>Saved</span> ";
        } else {
            let percent = Math.round(contentRead.length / numberOfFrames * 100 * 100) / 100; // Round to two decimal places (only if necessary)
            infoStr2 = percent + "% ... " + contentRead.length + " / " + numberOfFrames + ". ";
        }
        infoStr2 += fileNameLast;

        infoStr += infoStr2;
    } catch (e) {
        infoStr += "?% ..." + contentRead.length + " / ?";
    }

    const elMissingList = document.getElementById("missingList");
    if (missing !== undefined) {
        infoStr += ". Missing " + missing.length + ":";

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

    var video = document.createElement("video");
    var canvasElement = document.getElementById("canvas");
    var canvas = canvasElement.getContext("2d");
    var status = document.getElementById("status");

    var flipVideo;

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

        requestAnimationFrame(tick);
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

    function tick() {
        // Calculate scan speed
        let now = Date.now();
        if (lastFrameTime !== null) {
            let scanSpeedMs = now - lastFrameTime;
            let scanFps = (1000 / scanSpeedMs).toFixed(1);
            let recommendedShowSpeedMs = Math.ceil(scanSpeedMs * 2.1 / 10) * 10; // Round to higher 10 ms
            document.getElementById("scanSpeed").innerText = "Scan speed: " + scanSpeedMs.toFixed(1) + " ms (" + scanFps + " fps). Show can have duration " + recommendedShowSpeedMs + " ms.";
        }
        lastFrameTime = now;

        status.innerText = "Loading video..."
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
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
            var imageData = canvas.getImageData(0, 0, canvasElement.width, canvasElement.height);
            var code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: "dontInvert",
            });
            if (code) {
                try {
                    let frameNumber = onScan(code.data);

                    drawLine(code.location.topLeftCorner, code.location.topRightCorner, "#FF3B58");
                    drawLine(code.location.topRightCorner, code.location.bottomRightCorner, "#FF3B58");
                    drawLine(code.location.bottomRightCorner, code.location.bottomLeftCorner, "#FF3B58");
                    drawLine(code.location.bottomLeftCorner, code.location.topLeftCorner, "#FF3B58");

                    status.innerText = "QR code with frame " + frameNumber;
                } catch (e) {
                    status.innerText = "Unsupported QR code";
                }
            } else {
                status.innerText = "No QR code";
            }
        }
        requestAnimationFrame(tick);
    }
}

// TODO Test - it seems that the scanner stops around frame 1000

function init() {
    // Run tests
    tests();

    initStream();

    scanSimulated();
}

window.addEventListener('DOMContentLoaded', init);
