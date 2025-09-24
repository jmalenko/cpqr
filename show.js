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
    day = day < 10 ? '0' + day : day;
    minutes = minutes < 10 ? '0' + minutes : minutes;
    seconds = seconds < 10 ? '0' + seconds : seconds;
    millis = millis < 10 ? '00' + millis : millis < 100 ? '0' + millis : millis;

    return year + "-" + month + "-" + day + " " + hours + ':' + minutes + ':' + seconds + "." + millis;
}

function log(str) {
    const date = new Date();
    const el = document.getElementById("log");
    const logData = "[" + formatDate(date) + "] " + str + "\n" + el.innerHTML;
    el.innerHTML = logData.substr(0, 1e5);
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
    Tests
    =====
 */

function showSimulated() {
    const fileName = "C:\\fakepath\\a.txt";
    const data = "data:text/plain;base64,SmVkbmEsDQpEdsSbLg0KVMWZaQ0KxJvFocSNxZnFvsO9w6HDrcOpDQo=";
    show(fileName, data);
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

/**
 * Produces a string that can nicely be used in testing as it encodes the position in the string.
 * @param length
 * @returns {string}
 */
function stringOfLength(length) {
    let str = "";
    for (let i = 0; i < length; i += 10) {
        str += i.toString();
        const lengthN = getNumberLength(i);
        str += new Array(10 - lengthN + 1).join('.');
    }
    return str.substr(0, length);
}

/**
 * Produces a random string of length.
 * @param length of the returned string.
 * @returns String
 */
function randomStringOfLength(length) {
    let str = "";
    const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (let i = 0; i < length; i++)
        str += possible.charAt(Math.floor(Math.random() * possible.length));
    return str;
}

function tests() {
    assertEqual("String 0", stringOfLength(0), "");
    assertEqual("String 1", stringOfLength(1), "0");
    assertEqual("String 2", stringOfLength(2), "0.");
    assertEqual("String 9", stringOfLength(9), "0........");

    assertEqual("String 10", stringOfLength(10), "0.........");
    assertEqual("String 11", stringOfLength(11), "0.........1");
    assertEqual("String 12", stringOfLength(12), "0.........10");
    assertEqual("String 13", stringOfLength(13), "0.........10.");

    assertEqual("Random string 0", randomStringOfLength(0).length, 0);
    assertEqual("Random string 1", randomStringOfLength(1).length, 1);
    assertEqual("Random string 2", randomStringOfLength(2).length, 2);
    assertEqual("Random string 9", randomStringOfLength(9).length, 9);

    assertEqual("Random string 10", randomStringOfLength(10).length, 10);
    assertEqual("Random string 11", randomStringOfLength(11).length, 11);
    assertEqual("Random string 12", randomStringOfLength(12).length, 12);
    assertEqual("Random string 13", randomStringOfLength(13).length, 13);

    for (let i = 0; i < 11000; i += 47) {
        assertEqual("stringOfLength " + i, stringOfLength(i).length, i);
    }

    assertEqual("getNumberLength 0", getNumberLength(0), 1);
    assertEqual("getNumberLength 1", getNumberLength(1), 1);
    assertEqual("getNumberLength 9", getNumberLength(9), 1);

    assertEqual("getNumberLength 10", getNumberLength(10), 2);
    assertEqual("getNumberLength 99", getNumberLength(99), 2);

    assertEqual("getNumberLength 100", getNumberLength(100), 3);
    assertEqual("getNumberLength 999", getNumberLength(999), 3);

    assertEqual("getNumberLength 1000", getNumberLength(1000), 4);


    assertEqual("encodeWithLength 0", encodeWithLength(stringOfLength(0)), "10");
    assertEqual("encodeWithLength 1", encodeWithLength(stringOfLength(1)), "110");
    assertEqual("encodeWithLength 2", encodeWithLength(stringOfLength(2)), "120.");
    assertEqual("encodeWithLength 9", encodeWithLength(stringOfLength(9)), "190........");

    assertEqual("encodeWithLength 10", encodeWithLength(stringOfLength(10)), "2100.........");
    assertEqual("encodeWithLength 11", encodeWithLength(stringOfLength(11)), "2110.........1");

    assertEqual("part2string 0 1", part2string(0, 1), "0");
    assertEqual("part2string 1 1", part2string(1, 1), "1");

    assertEqual("part2string 0 2", part2string(0, 2), "00");
    assertEqual("part2string 1 2", part2string(1, 2), "01");
    assertEqual("part2string 2 2", part2string(2, 2), "10");
    assertEqual("part2string 3 2", part2string(3, 2), "11");

    assertEqual("getPart 0", getPart("012345678", "0"), "0123");
    assertEqual("getPart 1", getPart("012345678", "1"), "45678");

    assertEqual("getPart 00", getPart("012345678", "00"), "01");
    assertEqual("getPart 01", getPart("012345678", "01"), "23");
    assertEqual("getPart 10", getPart("012345678", "10"), "45");
    assertEqual("getPart 11", getPart("012345678", "11"), "678");

    // assertEqual("Number of frames 0", getNumberOfFrames(stringOfLength(0)), 1); // Note: depends on CAPACITY_TOTAL
    // assertEqual("Number of frames 1", getNumberOfFrames(stringOfLength(1)), 1);
    //
    // assertEqual("Number of frames 170", getNumberOfFrames(stringOfLength(170)), 1);
    // assertEqual("Number of frames 171", getNumberOfFrames(stringOfLength(171)), 2);
    //
    // assertEqual("Number of frames 340", getNumberOfFrames(stringOfLength(340)), 2);
    // assertEqual("Number of frames 341", getNumberOfFrames(stringOfLength(341)), 3);

    log("Tests finished");
}

/*
    Measure
    =======
 */

const MEASURE_DURATION_MIN = 30;
const MEASURE_DURATION_MAX = 210;
const MEASURE_DURATION_STEP = Math.round((MEASURE_DURATION_MAX - MEASURE_DURATION_MIN) / 6);

const MEASURE_CAPACITY_MIN = 200;
const MEASURE_CAPACITY_MAX = 320;
const MEASURE_CAPACITY_STEP = Math.round((MEASURE_CAPACITY_MAX - MEASURE_CAPACITY_MIN) / 6);

const MEASURE_FRAME_MAX = 10;

var durationMeasure;
var capacityMeasure;
var frameMeasure;

function showMeasure() {
    durationMeasure = MEASURE_DURATION_MIN;
    capacityMeasure = MEASURE_CAPACITY_MIN;
    frameMeasure = 0;

    duration = durationMeasure;

    nextFrameMeasure();
}

function nextFrameMeasure() {
    // Adjust duration
    const dateNextFameCurrent = new Date();
    const durationLast = dateNextFameCurrent - dateNextFrame;
    const delta = durationLast - durationMeasure;
    dateNextFrame = dateNextFameCurrent;
    if (!isNaN(delta)) duration -= delta / 10;

    // Show frame
    const head = "Duration " + durationMeasure + ", capacity " + capacityMeasure + ", frame " + frameMeasure + " of " + MEASURE_FRAME_MAX;
    log(head);

    const head2 = head + ", padding ";
    const padding = randomStringOfLength(capacityMeasure - head2.length);
    const str = head2 + padding;
    qrcode.makeCode(str);

    // Shift parameters
    frameMeasure++;
    if (MEASURE_FRAME_MAX <= frameMeasure) {
        capacityMeasure += MEASURE_CAPACITY_STEP;
        frameMeasure = 0;
    }
    if (MEASURE_CAPACITY_MAX < capacityMeasure) {
        durationMeasure += MEASURE_DURATION_STEP;
        duration += MEASURE_DURATION_STEP;
        dateNextFrame += MEASURE_DURATION_STEP;
        capacityMeasure = MEASURE_CAPACITY_MIN;
    }
    if (MEASURE_DURATION_MAX < durationMeasure) {
        durationMeasure = MEASURE_DURATION_MIN;
        dateNextFrame = undefined;

        // Hide the QR code
        const el = document.getElementById("qrcode");
        el.style.visibility = "hidden";

        log("Measuring finished");
        return; // Measuring finished
    }

    // Schedule next
    setTimeout(nextFrameMeasure, duration);
}

/*
Format of Content
=================

     Field        Example value                                                      Example value with Variable-length quantity
  --------------------------------------------------------------------------------------------------------------------------------------------------------
  1. Version      1                                                                  1 1 1
  2. Hash         4065018274                                                         2 10 4065018274
  3. File name    in.txt                                                             1 6 in.txt
  4. Data         data:text/plain;base64,VGVzdCBmaWxlDQpTZWNvbmQgcm93Lg0KVGhpcmQh    2 63 data:text/plain;base64,VGVzdCBmaWxlDQpTZWNvbmQgcm93Lg0KVGhpcmQh

Field "2. Hash" contains the 32 bit FNV-1a hash of the concatenation of the remaining fields.

Format of one frame
===================

     Field           Example value    Example value with Variable-length quantity
  -----------------------------------------------------------------------------------------------------------------------------------
  1. Frame number    1                1 1 1
  2. Content         Text             1 4 Text


Variable-length quantity
========================

Encoding that encodes a value with a triple:
1. length of "length of value" (must be one character in this implementation)
2. length of value
3. value


QR Codes
========

The QR code can contain maximum of 177 by 177 blocks (squares).

QR codes have three parameters: Datatype, size (number of 'pixels') and error correction level. How much information can
be stored there also depends on these parameters.

The maximum size and the lowest error correction give the following values:
Numeric only Max. 7,089 characters
Alphanumeric Max. 4,296 characters
Binary/byte Max. 2,953 characters (8-bit bytes)
*/

var CAPACITY_TOTAL = 50; // 7089 Numeric only,  4296 Alphanumeric, 2953 Binary/byte (8-bit bytes)
var capacityForDataInOneFrame = CAPACITY_TOTAL - 5; // Explanation of -5: -1 for length of length, -4 for length up to 7089

const VERSION = 1;

var DURATION_TARGET = 500; // Duration between frames, in milliseconds.
var duration; // Effective duration to be used in the setTimeout(). Calculated by subtracting "time it takes to do everything" from DURATION_TARGET.
var dateNextFrame; // Date of previous run of nextFrame()

var fileName;
var data;

var frame; // From 0. The frames from 0 to frame-1 have been shown.
var part; // From 0 to round^2-1.
var missingFrames; // Contains the frames to show as soon as possible. The frame at index _frame_ will be shown afterward.
var missingFramePart; // Part number to be shown

var round; // In each round, whole content is sent.
/*
 Round 0: standard, frame by frame
 Round 1-LAST_ROUND: instead of sending a frame, parts representing the frame are sent, te round determines the level
 */
const LAST_ROUND = 2;

const STATE_NOT_STARTED = 1;
const STATE_PLAYING = 2;
const STATE_FINISHED = 3;

var state = STATE_NOT_STARTED;

var qrcode;

function init() {
    // TODO Scale to fit the screen. Currently ot's optimized for FullHD. But we need to support this on mobiles as well.
    const scale = 4; // Scale to fit the browser with toolbars in FullHD
    qrcode = new QRCode("qrcode", {
        width: scale * 177, // The QR code has max 177 blocks (in one dimension)
        height: scale * 177,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.L // Lowest error correction
    });

    // Set parameters from URL
    let url = new URL(window.location.href);

    let durationParam = url.searchParams.get("duration");
    if (durationParam !== null) {
        DURATION_TARGET = durationParam;
    }

    let capacityParam = url.searchParams.get("capacity");
    if (capacityParam !== null) {
        CAPACITY_TOTAL = capacityParam;
        capacityForDataInOneFrame = CAPACITY_TOTAL - 5;
    }

    // Hide when run from file
    let startParam = url.searchParams.get("start");
    if (url.protocol === "file:" && startParam === null) {
        const el = document.getElementsByTagName("body")[0];
        el.style.visibility = "hidden";
    }

    const durationInput = document.getElementById('duration');
    durationInput.value = DURATION_TARGET;

    // Run tests
    tests();

    let measureParam = url.searchParams.get("measure");
    if (measureParam !== null) {
        showMeasure();
    }

    // showSimulated();
}

function openFile(event) {
    const input = event.target;
    const reader = new FileReader();
    reader.fileName = input.value;
    reader.onload = function () {
        const dataURL = reader.result;
        // If reader.readAsText() was called:
        //    String (probably in UTF-8)

        // If reader.readAsDataURL() was called:
        //    Base64 encoded
        //    Example: data:text/plain;base64,VGVzdCBmaWxlDQpTZWNvbmQgcm93Lg0KVGhpcmQh

        show(reader.fileName, dataURL)
    };
    reader.onerror = function () {
        alert("Error reading file");
    };
    reader.readAsDataURL(input.files[0])
    // reader.readAsText(input.files[0])
}

function getNumberLength(number) {
    return number.toString().length;
}

function encodeWithLength(obj) {
    let length;
    if (typeof obj === "string")
        length = obj.length;
    else if (typeof obj === "number")
        length = getNumberLength(obj);
    else
        throw Error("Unsupported type " + typeof obj);

    const lengthOfLength = getNumberLength(length);
    if (9 < lengthOfLength)
        throw Error("Too long length of length");

    return lengthOfLength.toString() + length.toString() + obj;
}

function getContent() {
    let content = "";

    content += encodeWithLength(VERSION);
    const hash = hashFnv32a(fileName + data, false);
    content += encodeWithLength(hash);
    content += encodeWithLength(fileName);
    content += encodeWithLength(data);

    return content;
}

function getNumberOfFrames() {
    return Math.ceil(getContent().length / capacityForDataInOneFrame); // Keep this consistent with calculation in scan.js
}

function getFrameContent(index, part) {
    const data = getContent();
    const contentFrom = index * capacityForDataInOneFrame;
    const contentFrame = data.substr(contentFrom, capacityForDataInOneFrame);

    let content = "";

    if (part === undefined) {
        content += encodeWithLength(index);
        content += contentFrame;
    } else {
        const contentFramePart = getPart(contentFrame, part);

        content += encodeWithLength(index + "." + part);
        content += contentFramePart;
    }

    return content;
}

function getPart(str, part) {
    while (0 < part.length) {
        const posHalf = str.length / 2;
        const char = part[0];
        if (char === "0") {
            str = str.substr(0, posHalf);
        } else {
            str = str.substr(posHalf);
        }
        part = part.substr(1)
    }
    return str;
}

function part2string(part, length) {
    let partStr = "";
    for (let i = 0; i < length; i++) {
        partStr = (part % 2) + partStr;
        part >>= 1;
    }
    return partStr;
}

function show(fileName_, data_) {
    fileName = fileName_;
    data = data_;

    log("File name = " + fileName);
    log("Data length = " + data.length);

    log("Frames = " + getNumberOfFrames());
    /*
    // Note: makes the browser slow for large data (as the log grows, the browser get slower)
    log("Data = " + data);
    log("Content = " + getContent());
    for (let frame = 0; frame < frames; frame++) {
        log("Frame " + frame + ": " + getFrameContent(frame));
    }
    */

    onPlay();
}

function onPlay() {
    log("Start");

    // Show the QR code
    const el = document.getElementById("qrcode");
    el.style.visibility = "visible";

    // Initialize
    round = 0;
    frame = -1;
    missingFrames = [];
    missingFramePart = 0;
    state = STATE_PLAYING;
    duration = DURATION_TARGET;

    nextFrame();
}

function onShowFrame(frame, part) {
    let frameContent = getFrameContent(frame, part);

    if (part === undefined) {
        log("Frame " + frame + ": " + frameContent);
    } else {
        log("Frame " + frame + "." + part + ": " + frameContent);
    }

    // const time1 = new Date();
    qrcode.makeCode(frameContent);
    // const time2 = new Date();
    // const durationCodegeneration = time2 - time1;
    // log("Code generation took " + durationCodegeneration + " ms");

    updateInfo();
}

function onEnd() {
    if (state !== STATE_FINISHED) {
        log("Finished");
    }

    state = STATE_FINISHED;
    dateNextFrame = undefined;

    // Hide the QR code
    const el = document.getElementById("qrcode");
    el.style.visibility = "hidden";
}

function nextFrame() {
    // Adjust duration
    let dateNextFrameCurrent = new Date();
    let durationActual = dateNextFrameCurrent - dateNextFrame;
    let delta = durationActual - DURATION_TARGET; // Positive: system is slow, Negative: system is fast
    // log("Duration target=" + DURATION_TARGET + " ms, actual duration=" + durationActual + " ms, delta=" + delta + " ms, duration=" + duration + " ms");
    if (0 < delta && duration <= 0) {
        log("The system is slow and is not meeting the target duration. Duration target=" + DURATION_TARGET + " ms, actual duration=" + durationActual + " ms.");
    }
    if (isNaN(delta)) { // on the first frame, when dateNextFrame was undefined
        duration = DURATION_TARGET
    } else {
        duration -= delta / 2;
    }
    if (duration < 0)
        duration = 0;
    // log("Setting duration=" + duration + " ms");

    // If the system is faster than DURATION_TARGET, then actively wait
    if (delta < -1) { // Ignore small negative values. The system can be faster by 1 ms.
        log("The system is too fast. Actively waiting for the target duration to end.");
        do {
            dateNextFrameCurrent = new Date();
            durationActual = dateNextFrameCurrent - dateNextFrame;
            delta = durationActual - DURATION_TARGET;
            // log("Active waiting: duration actual=" + durationActual + " ms, delta=" + delta + " ms");
        } while (delta < 0);
        // log("Active waiting done.");
    }
    // Store time for next frame
    dateNextFrame = dateNextFrameCurrent;

    // Show missing if there are any
    if (0 < missingFrames.length) {
        // TODO Show missing in rounds
        const f = missingFrames[0];
        if (missingFramePart === 1) {
            missingFrames.shift();
        }

        onShowFrame(f, missingFramePart.toString());

        missingFramePart = 1 - missingFramePart;
    } else { // Show next frame & part
        let partMax = 2 ** round;

        if ((round === 0 && frame + 1 === getNumberOfFrames()) ||
            (round > 0 && frame + 1 === getNumberOfFrames() && part + 1 === partMax)) {
            round++;
            log("=== Round " + round + " ===");
            frame = -1;
            partMax = 2 ** round;
            part = partMax - 1;
        }

        if (round === 0) {
            frame++;
            onShowFrame(frame);
        } else if (round-1 === LAST_ROUND) {
            onEnd();
            return;
        } else {
            if (part + 1 === partMax) {
                frame++;
                part = 0;
            } else {
                part++;
            }

            let partStr = part2string(part, round);

            onShowFrame(frame, partStr);
        }

        // Each block of 10 frames is sent in reverse order, e.g. 10-1, 20-11, ...
        // Convert frame -> frame2
        //         0        9
        //         1        8
        //         ...
        //         9        0
        // const dec = ~~(frame / 10); // modulo, result is integer
        // const digit = frame % 10;
        // const D = frame < Math.floor(getNumberOfFrames() / 10) * 10 ? 10 : getNumberOfFrames() - Math.floor(getNumberOfFrames() / 10) * 10;
        // let frame2 = 10 * dec + (D - digit) - 1;
        // onShowFrame(frame2);
    }

    setTimeout(nextFrame, duration);
}

/*
Example of value: 2,3.4 5 7-10 15-12 -1 a
                               ^      ^ ^
                               |      | |
                               |      | Ignored
                               |      Range starting from 0
                               Ignored
 */
function onMissingFramesChange(event) {
    const el = document.getElementById("missing");
    const missingStr = el.value;

    if (event.keyCode === 13) { // Enter
        const missingFramesNewGroups = missingStr.split(/[,. ]+/);

        // Replace ranges
        let missingFramesNew = [];
        missingFramesNewGroups.forEach(function (item) {
                // N-M format
                // Example: 10-13 -> 10,11,12,13
                let range = item.split(/-/);
                if (range.length === 2) {
                    const from = Number(range[0]);
                    const to = Number(range[1]);
                    if (to < from) return;
                    for (let i = from; i <= to; i++) {
                        missingFramesNew.push(i);
                    }
                    return;
                }

                // N+M format
                // Example: 10+3 -> 10,11,12,13
                range = item.split(/\+/);
                if (range.length === 2) {
                    const from = Number(range[0]);
                    const add = Number(range[1]);
                    const to = from + add;
                    if (to < from) return;
                    for (let i = from; i <= to; i++) {
                        missingFramesNew.push(i);
                    }
                    return;
                }

                // Single number
                missingFramesNew.push(item);
            }
        );

        if (typeof missingFrames === "undefined") {
            log("Cannot add to missing as no file has been shown.");
            return;
        }

        log("Add to missing: " + missingFramesNew);
        // Add to missing frames to show
        let missingFramesWithDuplicates = missingFrames.concat(missingFramesNew);
        // Remove duplicates
        missingFrames = missingFramesWithDuplicates.filter(function (item, pos, a) {
            return a.indexOf(item) === pos;
        });
        // Remove frames after the maximum frame
        missingFrames = missingFramesWithDuplicates.filter(function (item) {
            return item < getNumberOfFrames();
        });

        if (0 < missingFrames.length && state !== STATE_PLAYING) {
            if (state === STATE_FINISHED) {
                // Show the QR code
                const el = document.getElementById("qrcode");
                el.style.visibility = "visible";
            }

            nextFrame();
        }
    } else if (event.keyCode === 47) { // Slash
        let missingStrNew = missingStr.replace(/^[0-9-]*[,. ]?/, "");
        el.value = missingStrNew;
        event.returnValue = false; // block key
    }
}

function onDurationChange(event) {
    const value = Number(event.target.value);
    if (!isNaN(value) && value > 0) {
        DURATION_TARGET = value;
        duration = DURATION_TARGET;
    }
}

function updateInfo() {
    let infoStr = "";
    if (round === 0) {
        const numberOfFrames = getNumberOfFrames();
        const ratio = frame / numberOfFrames * 100;
        infoStr += "Done " + ratio.toFixed(2) + "%, frame " + frame + " / " + numberOfFrames + ". ";

        const timeLeft = Math.round((numberOfFrames - frame) * DURATION_TARGET / 1000);
        const timeEnd = formatDate(new Date(new Date().getTime() + timeLeft * 1000));
        infoStr += "Time left " + formatDuration(timeLeft) + ". End on " + timeEnd + "."
    } else {
        infoStr += "Round " + round + ", frame " + frame + "." + part;
    }

    const el = document.getElementById("info");
    el.innerHTML = infoStr;
}

function formatDuration(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h}h ${m}m ${s}s`;
}

// TODO Fix layout - Duration is out of the window to the right (when log lines are long)

window.addEventListener('DOMContentLoaded', init);
