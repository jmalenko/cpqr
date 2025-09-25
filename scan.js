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
    const MAX_LINES = 1000;

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
        return ("0000000" + (hval >>> 0).toString(16)).substr(-8);
    }
    return hval >>> 0;
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
    // Prepared with CAPACITY_TOTAL = 50

    [ // Send 3 frames
        '1101112104065018274217C:\\fakepath\\a.txt279data:t',
        '111ext/plain;base64,SmVkbmEsDQpEdsSbLg0KVMWZaQ0K',
        '112xJvFocSNxZnFvsO9w6HDrcOpDQo='],

    [ // Send frame 1 at the end
        '1101112104065018274217C:\\fakepath\\a.txt279data:t',
        '112xJvFocSNxZnFvsO9w6HDrcOpDQo=',
        '111ext/plain;base64,SmVkbmEsDQpEdsSbLg0KVMWZaQ0K'],

    [ // Send frame 0 at the end
        '111ext/plain;base64,SmVkbmEsDQpEdsSbLg0KVMWZaQ0K',
        '112xJvFocSNxZnFvsO9w6HDrcOpDQo=',
        '1101112104065018274217C:\\fakepath\\a.txt279data:t'],

    [ // Send frame 1 in 2 parts
        '1101112104065018274217C:\\fakepath\\a.txt279data:t',
        '131.0ext/plain;base64,SmVkb',
        '131.1mEsDQpEdsSbLg0KVMWZaQ0K',
        '112xJvFocSNxZnFvsO9w6HDrcOpDQo='],

    [ // Send frame 1 part 2 in two 2 subparts
        '1101112104065018274217C:\\fakepath\\a.txt279data:t',
        '131.0ext/plain;base64,SmVkb',
        '141.10mEsDQpEdsSbL',
        '141.11g0KVMWZaQ0K',
        '112xJvFocSNxZnFvsO9w6HDrcOpDQo='],

    [ // Send 3 frames, but change last character in frame 1, resend the correct frame 1 at the end
        '1101112104065018274217C:\\fakepath\\a.txt279data:t',
        '111ext/plain;base64,SmVkbmEsDQpEdsSbLg0KVMWZaQ0_',
        '112xJvFocSNxZnFvsO9w6HDrcOpDQo=',
        '111ext/plain;base64,SmVkbmEsDQpEdsSbLg0KVMWZaQ0K'],

    [ // Send 3 frames, frame 0 is sent in parts
        '130.01112104065018274217C:\\f',
        '130.1akepath\\a.txt279data:t',
        '111ext/plain;base64,SmVkbmEsDQpEdsSbLg0KVMWZaQ0K',
        '112xJvFocSNxZnFvsO9w6HDrcOpDQo='],

    [ // Send 3 frames, only parts of length 1
        '130.01112104065018274217C:\\',
        '130.1fakepath\\a.txt279data:t',
        '131.0ext/plain;base64,SmVkb',
        '131.1mEsDQpEdsSbLg0KVMWZaQ0K',
        '132.0xJvFocSNxZnFvs',
        '132.1O9w6HDrcOpDQo='],

    [ // Send 3 frames, only parts of length 2
        '140.0011121040650',
        '140.0118274217C:\\',
        '140.10fakepath\\a.',
        '140.11txt279data:t',
        '141.00ext/plain;b',
        '141.01ase64,SmVkb',
        '141.10mEsDQpEdsSb',
        '141.11Lg0KVMWZaQ0K',
        '142.00xJvFocS',
        '142.01NxZnFvs',
        '142.10O9w6HDr',
        '142.11cOpDQo='],

    [ // Send 3 frames, only parts of length 3
        '150.00011121',
        '150.001040650',
        '150.01018274',
        '150.011217C:\\',
        '150.100fakep',
        '150.101ath\\a.',
        '150.110txt279',
        '150.111data:t',
        '151.000ext/p',
        '151.001lain;b',
        '151.010ase64',
        '151.011,SmVkb',
        '151.100mEsDQ',
        '151.101pEdsSb',
        '151.110Lg0KVM',
        '151.111WZaQ0K',
        '152.000xJv',
        '152.001FocS',
        '152.010NxZ',
        '152.011nFvs',
        '152.100O9w',
        '152.1016HDr',
        '152.110cOp',
        '152.111DQo=']
];

let fileSimulated = 0;
let frameSimulated = 0;

function scanSimulated() {
    if (fileSimulated >= testFrames.length) {
        log("Simulated scans finished");
        updateInfo();
        return;
    }

    onScan(testFrames[fileSimulated][frameSimulated]);

    if (frameSimulated + 1 === testFrames[fileSimulated].length) {
        // Move to next file
        fileSimulated++;
        frameSimulated = 0;

        // Cleanup data
        contentRead = [];
        contentReadPart = [];
        hashSaved = "";
    } else {
        frameSimulated++;
    }
    setTimeout(scanSimulated, 1000);
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
    Measure
    =======
 */

const MEASURE_HEAD_REGEXP = /Duration (\d+), capacity (\d+), frame (\d+) of (\d+), padding /;

var measures = [];
var measuresFrameMax = -1;

function scanMeasure(content) {
    log("Measure: " + content);
    let matches_array = content.match(MEASURE_HEAD_REGEXP);

    let duration_ = Number(matches_array[1]);
    let capacity_ = Number(matches_array[2]);
    let frame_ = Number(matches_array[3]);
    let measuresFrameMax_ = Number(matches_array[4]);

    if (measuresFrameMax_ !== measuresFrameMax) {
        log("Resetting measure data");
        measures = [];
        measuresFrameMax = measuresFrameMax_;
    }

    if (measures[duration_] === undefined)
        measures[duration_] = {};
    if (measures[duration_][capacity_] === undefined)
        measures[duration_][capacity_] = [];

    measures[duration_][capacity_].push(frame_);

    printMeasureMatrix();
    printMeasureMatrixTroughput();
}

function printMeasureMatrix() {
    // Get the list of durations
    let durations = Object.keys(measures);

    let capacities = [];
    for (let d of durations.values()) {
        let capacities2 = Object.keys(measures[d]);
        for (let c of capacities2)
            if (capacities.indexOf(c) === -1) capacities.push(c);
    }

    durations.sort(sortNumber); // Convert strings to numbers, sort numerically
    capacities.sort(sortNumber);

    const space = " ";
    const len = 6;

    let res = "Measuring results - histogram (max is " + measuresFrameMax + ")\n";
    // Top Header
    // res += "".padLeft(space, len);
    res += "Dur" + " ".repeat(len - 5) + "Cap";
    res += "|";
    for (let c of capacities) {
        res += c.padLeft(space, len);
    }
    res += "\n";
    // Separator
    res += "-".repeat(len);
    res += "-+";
    res += "-".repeat(len * capacities.length);
    res += "\n";
    // Rows
    for (let d of durations) {
        res += d.padLeft(space, len);
        res += " |";
        for (let c of capacities) {
            if (measures[d][c] === undefined) {
                res += "-".padLeft(space, len);
            } else {
                let count = measures[d][c].length;
                res += count.toString().padLeft(space, len);
            }
        }
        res += "\n";
    }
    res = res.slice(0, -1);

    log(res);
}

function printMeasureMatrixTroughput() {
    // Get the list of durations
    let durations = Object.keys(measures);

    let capacities = [];
    for (let d of durations.values()) {
        let capacities2 = Object.keys(measures[d]);
        for (let c of capacities2)
            if (capacities.indexOf(c) === -1) capacities.push(c);
    }

    durations.sort(sortNumber); // Convert strings to numbers, sort numerically
    capacities.sort(sortNumber);

    const space = " ";
    const len = 6;

    let tBest = 0;
    let cBest = 0;
    let dBest = 0;

    let res = "Measuring results - throughput\n";
    // Top Header
    // res += "".padLeft(space, len);
    res += "Dur" + " ".repeat(len - 5) + "Cap";
    res += "|";
    for (let c of capacities) {
        res += c.padLeft(space, len);
    }
    res += "\n";
    // Separator
    res += "-".repeat(len);
    res += "-+";
    res += "-".repeat(len * capacities.length);
    res += "\n";
    // Rows
    for (let d of durations) {
        res += d.padLeft(space, len);
        res += " |";
        for (let c of capacities) {
            if (measures[d][c] === undefined) {
                res += "-".padLeft(space, len);
            } else {
                let count = measures[d][c].length;
                let throughtput = Math.round((60000 / d) * c * (count / measuresFrameMax) / 1000); // in BiloBytes per minute
                res += throughtput.toString().padLeft(space, len);
                if (tBest < throughtput) {
                    tBest = throughtput;
                    cBest = c;
                    dBest = d;
                }
            }
        }
        res += "\n";
    }
    res = res.slice(0, -1);

    log(res);

    log("Best throughput " + tBest + " kB/min is achieved with capacity " + cBest + " and duration " + dBest);
}

function scanSimulatedMeasures() {
    let frame_max = 10;
    for (let duration = 100; duration <= 1000; duration += 100) {
        for (let capacity = 200; capacity <= 2000; capacity += 200) {
            for (let frame = 0; frame < frame_max; frame += 1) {
                if (Math.random() < 0.5) { // Scan successfully with a probability
                    const head = "Duration " + duration + ", capacity " + capacity + ", frame " + frame + " of " + frame_max + ", padding ";
                    scanMeasure(head);
                }
            }
        }
    }
}

function sortNumber(a, b) {
    return Number(a) - Number(b);
}

String.prototype.padLeft = function (char, length) {
    return char.repeat(Math.max(0, length - this.length)) + this;
};

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
    Exceptions
    ==========
 */

function MissingFrameException(missing) {
    this.missing = missing;
    // Use V8's native method if available, otherwise fallback
    if ("captureStackTrace" in Error)
        Error.captureStackTrace(this, MissingFrameException);
    else
        this.stack = (new Error()).stack;
}

MissingFrameException.prototype = Object.create(Error.prototype);
MissingFrameException.prototype.name = "MissingFrameException";
MissingFrameException.prototype.constructor = MissingFrameException;

/*
    Main content
    ============
 */

let contentRead = []; // contentRead[frameIndex] contains the content of frame frameIndex
let contentReadPart = []; // contentReadPart[frameIndex][partIndex] contains the content of part partIndex of frame frameIndex
/*
PartIndex is a sequence of 0s and 1s where 0 denotes "the left part" and 1 denote "the right part".
Mathematically: PartIndex is an encoding of a subinterval of the 0-1 interval, in binary encoding.
For example
- If we got frame content (stored in contentRead), then fine. Othwerwise, we construct it from parts.
- A frame can be constructed from parts 0 and 1 (left and right part of the frame).
- But in case the right part is missing, the frame can be constructed from parts 0 and 10 and 11 (combination of parts 10 and 11 gives part 1).
 */

let hashSaved; // hash of the last saved file (specifically the received hash (of fileName + data)

let headerDecoded = false; // true if the header (typically in frame 0, but can continue in following frames) was decoded successfully

function decodeWithLength(str, from) {
    const lengthOfLengthStr = str.substr(from, 1);
    const lengthOfLength = Number(lengthOfLengthStr);

    const lengthStr = str.substr(from + 1, lengthOfLength);
    const length = Number(lengthStr);

    const data = str.substr(from + 1 + lengthOfLength, length);

    const next = from + 1 + lengthOfLength + length;

    return [length, data, next];
}

function decodeFrameContent(content) {
    let [, frameStr, from] = decodeWithLength(content, 0);
    const contentFrame = content.substr(from);

    return [frameStr, contentFrame];
}

function getFrameFromParts(frame, prefix) {
    if (prefix === undefined) prefix = "";
    if (5 < prefix.length) throw new Error("Cannot construct frame " + frame + " from parts");

    let res = "";

    for (let i = 0; i <= 1; i++) {
        const part = prefix + i;
        // If part not received
        if (contentReadPart[frame][part] === undefined) {
            // Construct the part from subparts
            res += getFrameFromParts(frame, part);
        } else {
            res += contentReadPart[frame][part];
        }
    }

    return res;
}

function getContent() {
    let content = "";
    let missing = [];

    const upperBound = Math.max(contentRead.length, contentReadPart.length);

    for (let i = 0; i < upperBound; i++) {
        if (contentRead[i] === undefined) {
            try {
                content += getFrameFromParts(i);
            } catch (e) {
                missing.push(i);
            }
        } else {
            content += contentRead[i];
        }
    }

    if (0 < missing.length) {
        throw new MissingFrameException(missing);
    }

    return content;
}

function decodeContentWithoutChecks(content) {
    let length, from = 0;
    let versionStr, hash, fileName, fileNameEncoded, data;

    [length, versionStr, from] = decodeWithLength(content, from);
    let version = Number(versionStr);
    if (version !== 1)
        throw new Exception("Unsupported version " + version);

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
        throw new Exception("Not all data");

    // Verify hash
    const hashCalculated = hashFnv32a(fileName + data, false);
    if (hash !== hashCalculated)
        throw new Exception("Incorrect hash");

    return [hash, fileName, data];
}

function getContentInfo() {
    const content = contentRead[0] || getFrameFromParts(0);
    let [version, hash, fileName, data, length, from] = decodeContentWithoutChecks(content);

    const capacityForDataInOneFrame = content.length;
    const numberOfFrames = Math.ceil(from / capacityForDataInOneFrame); // Keep this consistent with calculation in show.js

    return [hash, fileName, numberOfFrames];
}

function onScan(content) {
    console.log("READ: " + content);
    log("READ: " + content);

    if (content.match(MEASURE_HEAD_REGEXP)) {
        scanMeasure(content);
        return;
    }

    let frameNumber = null;
    let missing;

    try {
        // Save frame
        let [frameStr, contentFrame] = decodeFrameContent(content);
        log("Read frame index " + frameStr + " with content " + contentFrame);

        let frame;
        const posDot = frameStr.indexOf(".");

        // Save frame
        if (posDot === -1) {
            frame = Number(frameStr);
            if (contentRead[frame] != null) {
                log("Frame " + frame + " was already encountered in the past");
            }
            contentRead[frame] = contentFrame;
        } else {
            frame = Number(frameStr.substr(0, posDot));
            const part = frameStr.substr(posDot + 1);

            if (contentReadPart[frame] === undefined)
                contentReadPart[frame] = [];
            if (contentReadPart[frame][part] != null) {
                log("Frame " + frame + "." + part + " was already encountered in the past");
            }
            contentReadPart[frame][part] = contentFrame;
        }
        frameNumber = frame;

        if (! headerDecoded) {
            try {
                let [hash, fileName, numberOfFrames] = getContentInfo();
                log("File name = " + fileName);
                log("Frames = " + numberOfFrames);
                headerDecoded = true;
                if (0 < frame) {
                    log("Header decoded");
                }
            } catch (e) {
                log("Cannot decode header");
            }
        }

        // If all frames then save
        try {
            let [hash, fileName, dataURL] = decodeContent();

            if (hash !== hashSaved) {
                log("Got all frames");
                log("File name = " + fileName);
                log("Data = " + dataURL);

                const fileNameLast = getFileNameLast(fileName);

                const posComma = dataURL.indexOf(",");
                const b64 = dataURL.substr(posComma + 1);
                const fileContent = atob(b64);

                log("Downloading as " + fileNameLast);
                download(fileContent, fileNameLast, 'text/plain');

                hashSaved = hash;
            }
        } catch (e) {
            if (e instanceof MissingFrameException) {
                // The dataURL is not complete yet
                log("Missing frames " + e.missing);
                missing = e.missing;
            }
        }
    } catch (e) {
        log("Error processing frame" + "\n" +
            "Content: " + content + "\n" +
            "Error: " + e.toString() + "\n" +
            "Stack trace: " + getStackTrace());
    }

    updateInfo(missing);
    return frameNumber;
}

function getFileNameLast(fileName) {
    const posSlash = fileName.lastIndexOf("\\");
    return fileName.substr(posSlash + 1);
}

function updateInfo(missing) {
    let infoStr = "";
    const upperBound = Math.max(contentRead.length, contentReadPart.length);
    try {
        let [hash, fileName, numberOfFrames] = getContentInfo();
        const fileNameLast = getFileNameLast(fileName);

        let percent = Math.round(upperBound / numberOfFrames * 100 * 100) / 100; // Round to two decimal places (only if necessary)
        let infoStr2 = percent + "% ... " + upperBound + " / " + numberOfFrames;
        if (hash === hashSaved) {
            infoStr2 += " Saved";
        }
        infoStr2 += "<br/>";
        infoStr2 += fileNameLast;

        infoStr += infoStr2;
    } catch (e) {
        infoStr += "?% ..." + upperBound + " / ?";
    }

    const elMissingList = document.getElementById("missingList");
    if (missing !== undefined) {
        infoStr += ". Missing " + missing.length + ":";

        elMissingList.innerHTML = missing;
        elMissingList.hidden = false;
    } else {
        elMissingList.hidden = true;
    }

    const el = document.getElementById("info");
    el.innerHTML = infoStr;
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
    var loadingMessage = document.getElementById("loadingMessage");
    var outputContainer = document.getElementById("output");
    var outputMessage = document.getElementById("outputMessage");
    var outputData = document.getElementById("outputData");

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

        loadingMessage.innerText = "⌛ Loading video..."
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
            loadingMessage.hidden = true;
            canvasElement.hidden = false;
            outputContainer.hidden = false;

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
                let frameNumber = onScan(code.data);

                drawLine(code.location.topLeftCorner, code.location.topRightCorner, "#FF3B58");
                drawLine(code.location.topRightCorner, code.location.bottomRightCorner, "#FF3B58");
                drawLine(code.location.bottomRightCorner, code.location.bottomLeftCorner, "#FF3B58");
                drawLine(code.location.bottomLeftCorner, code.location.topLeftCorner, "#FF3B58");

                outputMessage.hidden = true;
                outputData.parentElement.hidden = false;
                // outputData.innerText = code.data;
                outputData.innerText = "Frame " + frameNumber;
            } else {
                outputMessage.hidden = false;
                outputData.parentElement.hidden = true;
            }
        }
        requestAnimationFrame(tick);
    }
}

// TODO Test - it seems that the scanner stops around frame 1000

// TODO Scan - improve status layout - camera label next to camera selection, scan speed next to percentage, handle 2 stream infos

function init() {
    // Run tests
    tests();

    initStream();

    // scanSimulated();

    // scanSimulatedMeasures();
}

window.addEventListener('DOMContentLoaded', init);
