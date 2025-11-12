// Load common.js dynamically and wait for it to load
(function () {
    const script = document.createElement('script');
    script.src = 'common.js';
    script.type = 'text/javascript';
    script.onload = () => onLoad();
    document.head.appendChild(script);
})();

/*
    Tests
    =====
 */

function showSimulated() {
    const fileName = "C:\\fakepath\\a.txt";
    const data = "data:text/plain;base64,SmVkbmEsDQpEdsSbLg0KVMWZaQ0KxJvFocSNxZnFvsO9w6HDrcOpDQo=";
    show(fileName, data);
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
    return str.slice(0, length);
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

    // assertEqual("Number of frames 0", getNumberOfFrames(stringOfLength(0)), 1); // Note: depends on CAPACITY_TOTAL
    // assertEqual("Number of frames 1", getNumberOfFrames(stringOfLength(1)), 1);
    //
    // assertEqual("Number of frames 170", getNumberOfFrames(stringOfLength(170)), 1);
    // assertEqual("Number of frames 171", getNumberOfFrames(stringOfLength(171)), 2);
    //
    // assertEqual("Number of frames 340", getNumberOfFrames(stringOfLength(340)), 2);
    // assertEqual("Number of frames 341", getNumberOfFrames(stringOfLength(341)), 3);

    let a, b, c;
    a = "Alpha";
    b = "Beta_";
    c = xorStrings(a, b);
    assertEqual("xorStrings", a, xorStrings(b, c));
    assertEqual("xorStrings", b, xorStrings(a, c));

    a = "Alpha";
    b = "Beta";
    c = xorStrings(a, b);
    assertEqual("xorStrings shorter", a, xorStrings(b, c));
    assertEqual("xorStrings shorter", b + String.fromCharCode(0), xorStrings(a, c));

    a = "1102651112104065018274223C%3A%5Cfakepath%5Ca.txt279data:text/plain;base";
    b = "11125964,SmVkbmEsDQpEdsSbLg0KVMWZaQ0KxJvFocSNxZnFvsO9w6HDrcOpDQo=";
    c = xorStrings(a, b);
    assertEqual("xorStrings", c, atob("AAABAAMMBwUdYVxmX1JbcEN1aUJyUEFhUQ9CAwpzeBQ8ADpVOxk+HmNaIDJgDCIadEFKK1gDV3IwFxs7XzQ9DlRuO2Jhc2U="));
    assertEqual("xorStrings", a, xorStrings(b, c));
    assertEqual("xorStrings", b, xorStrings(a, c).slice(0, b.length));

    log("Tests finished");
}

/*

What is transmitted
===================

- Content Frames
  - These are the standard frames containing the content data.
  - Each frame holds a chunk of the content data.
  - Frames are numbered and sent sequentially.

- Correction Frames
  - After all content frames are sent, correction frames are transmitted to help recover any lost frames.
  - Correction frames use Progressive Forward Error Correction (PFEC):
    - In each round, the sender assumes a certain frame loss rate (starting at 1% and doubling each round).
    - For each assumed loss rate, enough correction frames are generated to allow recovery from that level of loss.
    - Correction frames are constructed using XOR-based parity over subsets of content frames.
    - Correction frames are sent indefinitely, increasing redundancy over time.

Format of content
=================

     Field        Example value                                                      Example value with Variable-length quantity
  --------------------------------------------------------------------------------------------------------------------------------------------------------
  1. Version      1                                                                  1 1 1
  2. Hash         4065018274                                                         2 10 4065018274
  3. Path         C:\fakepath\in.txt                                                 2 23 C%3A%5Cfakepath%5Cin.txt
  4. Data         data:text/plain;base64,VGVzdCBmaWxlDQpTZWNvbmQgcm93Lg0KVGhpcmQh    2 63 data:text/plain;base64,VGVzdCBmaWxlDQpTZWNvbmQgcm93Lg0KVGhpcmQh
     (Base64 encoded)

Field "2. Hash" contains the 32 bit FNV-1a hash of the concatenation of the remaining fields.

Header is defined as fields 1-3.

Format of one content frame
===========================

     Field           Example value    Example value with Variable-length quantity
  -------------------------------------------------------------------------------
  1. Frame number    1                1 1 1
  2. Content         Text             1 4 Text

Format of one correction frame
==============================

     Field              Description                                                   Example value    Example value with Variable-length quantity
  ------------------------------------------------------------------------------------------------------------------------------------------------
  1. Correction flag    Character C.                                                  C                (not applicable)
  2. Loss rate          Loss rate.                                                    5                1 1 5
                        (Integer percentage, e.g., 1 for 1%, 2 for 2%, etc.)
  3. Correction index   Index of the correction frame for the loss rate.              0                1 1 0
                        (Integer from 0 to correctionFramesCount(), including both)
  4. XOR payload        The result of XOR-ing the content of the listed frames.       A1B2C3D4E5F6     (not used)
                        (Base64 encoded binary data)


Note: length of a correction frame is longer than the QR capacity (defined as a parameter, not necessarily the maximum posible QR capacity of 2953 bytes).

Variable-length quantity
========================

Encoding that encodes a value with a triple:
1. length of "length of value" (must be one character in this implementation)
2. length of value
3. value

Performance optimizations
=========================

In the past, several optimizations were done. Here is a summary for a 20 MB file in a virtual machine.
- Observation: hashFnv32a() takes 200 ms.
  Resolution: Cache the hash value.
- String.substr() takes 25 ms, String.slice() takes 0 ms.
  Resolution: Use String.slice(). (String.substr() is obsolete anyway.)
              Still, for 100 MB file, slice() takes 120 ms.
- Generation of a QR code with capacity 1000 takes 50 ms.
  Resolution: We cannot optimize this, it's just one call to the library.

- In show, each frame generation was done fully, including getContent() and slice(). Just slice() took 120 ms with 100 MB file.
  Resolution: Cache the frames when the file is loaded. This is surprising as slice() is called the same number of time, but the entire preparation takes 900 ms. (Yes, just 8 times more than getting the frame content for one frame.)
              Reading from cache is fast (0 ms).

- In scan, the saving of the file was not optimized: The file was built by concatenating strings (with frame data) whenever a frame was received, which is slow.
  Resolution: Do this only when all the frames are received.

Conclusion: After the optimizations, the only bottleneck is with QR:
- QR code generation - 50 ms
- QR code scanning (and recognition) - 40 ms on Pixel 9a

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

// OR code capacity depends on content: 7089 Numeric only,  4296 Alphanumeric, 2953 Binary/byte (8-bit bytes). Binary/byte is used by this program.
// Explanation of -20: this is for frame format (frame number, data length). Also, the correction must fit there. This cannot be calculated exactly as data may be potentially infinite.
const CAPACITY_MAX = 2953 - 20;

let capacityForDataInOneFrame = 70; // Capacity for data in one frame, after frame header. Note that capacity of correction frame is is higher by 33% due to the Base43 encoding.

const VERSION = 1;

let DURATION_TARGET = 500; // Duration between frames, in milliseconds.
let duration; // Effective duration to be used in the setTimeout(). Calculated by subtracting "time it takes to do everything" from DURATION_TARGET.
let dateNextFrame; // Date of previous run of nextFrame()
let durationActual; // Actual duration between frames, in milliseconds.

let path;
let data;
let hash;
let cacheFrameContent; // Cache of prepared frames. Index is the frame number.

let frame; // From 0. The frames from 0 to frame-1 have been shown.
let missingFrames; // Contains the frames to show as soon as possible. The frame at index _frame_ will be shown afterward.
let missingFrameDelta; // When showing missing frames, this is set to a number > 0. It is decreased by one for each correction frame shown. When it reaches 0, the next missing frame is shown.
const MISSING_FRAME_DELTA_MAX = 3; // Maximum value for missingFrameDelta. Higher values increase the chance of recovery, but also increase the time to show all frames.
let round; // Round is increased after all correction frames are sent (and frames 0 is about to be sent).

let lossRate;
let correctionFrame;
const LOSS_RATES = [0.01, 0.02, 0.03, 0.05, 0.08, 0.13, 0.21, 0.34, 0.55, 0.89]; // Fibonacci-like sequence.
let lossRateIndex; // Index to LOSS_RATES

let qrcode;

let timer;

let measureTimeProcessing;
let measureTimeQr;

function setCapacity(capacity) {
    if (CAPACITY_MAX < capacity) {
        log("Capacity too large, setting to maximum " + CAPACITY_MAX);
        capacity = CAPACITY_MAX;
    }
    capacityForDataInOneFrame = capacity;
}

function onLoad() {
    const scale = 10; // Scale factor to make the QR code large. On screen, this will be scaled to available area.
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
        setCapacity(capacityParam);
    }

    // Hide when run from file
    let startParam = url.searchParams.get("start");
    if (url.protocol === "file:" && startParam === null) {
        const el = document.getElementsByTagName("body")[0];
        el.style.visibility = "hidden";
    }

    const durationInput = document.getElementById('duration');
    durationInput.value = DURATION_TARGET;

    onDurationChangeValue(DURATION_TARGET)

    measureTimeProcessing = createMeasureDuration();
    measureTimeQr = createMeasureDuration();

    // Run tests
    tests();

    // showSimulated();
}

function onOpenFile(event) {
    const input = event.target;
    const reader = new FileReader();
    reader.fileName = input.value;
    reader.onload = function () {
        const data = reader.result;
        // If reader.readAsText() was called:
        //    String (probably in UTF-8)

        // If reader.readAsDataURL() was called:
        //    Base64 encoded
        //    Example: data:text/plain;base64,VGVzdCBmaWxlDQpTZWNvbmQgcm93Lg0KVGhpcmQh

        show(reader.fileName, data)
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

function encodeArrayWithLength(arr) {
    if (!Array.isArray(arr))
        throw Error("Input is not an array");
    const str = arr.join(",");
    return encodeWithLength(str);
}


function getContent() {
    let content = "";

    content += encodeWithLength(VERSION);
    content += encodeWithLength(hash);
    const fileNameEncoded = encodeURIComponent(path);
    content += encodeWithLength(fileNameEncoded); // filename may contain any unicode characters. We have to encode it to ASCII for QR code.
    content += encodeWithLength(data);

    return content;
}

function getNumberOfFrames() {
    return Math.ceil(getContent().length / capacityForDataInOneFrame); // Keep this consistent with calculation in scan.js
}

function createCache() {
    cacheFrameContent = [];
    const numberOfFrames = getNumberOfFrames();
    const data = getContent();
    for (let index = 0; index < numberOfFrames; index++) {
        const contentFrom = index * capacityForDataInOneFrame;
        cacheFrameContent[index] = data.slice(contentFrom, contentFrom + capacityForDataInOneFrame);
    }
}

function getFrameContent(index) {
    const contentFrame = cacheFrameContent[index];

    let content = "";

    content += encodeWithLength(index);
    content += encodeWithLength(contentFrame);

    return content;
}

function getCorrectionFrameContent(lossRate, index) {
    let indices = correctionIndices(lossRate, index);
    const payload = generateCorrectionForIndices(indices);
    let correction = {lossRate, index, payload};
    return getCorrectionFrame(correction);
}

function getCorrectionFrame(correction) {
    let content = "";

    content += "C";
    content += encodeWithLength(correction.lossRate * 100);
    content += encodeWithLength(correction.index);
    content += correction.payload;

    return content;
}

function show(path_, data_) {
    if (data != undefined && !sending()) {
        // Hide the QR code
        const el = document.getElementById("qrcode");
        el.style.visibility = "visible";
    }

    path = path_;
    data = data_;

    log("File path = " + path);
    log("Data length = " + data.length);

    hash = hashFnv32a(path + data, false);

    log("Frames = " + getNumberOfFrames());

    onStart();
}

function onStart() {
    log("Start showing");

    // Initialize
    frame = -1;
    missingFrames = [];
    duration = DURATION_TARGET;
    lossRateIndex = -1;
    round = 1;

    let durationMs = measureTimeMs(() => {
        createCache();
    });
    log("Cache creation took " + durationMs + " ms");

    nextFrame();
}

function systemIsSlow() {
    let delta = durationActual - DURATION_TARGET; // Positive: system is slow, Negative: system is fast
    return 0 < delta && duration <= 0
}

function adjustDuration() {
    // Adjust duration
    let dateNextFrameCurrent = new Date();
    durationActual = dateNextFrameCurrent - dateNextFrame;
    if (systemIsSlow()) {
        log("The system is slow and is not meeting the target duration. Actual duration=" + durationActual + " ms, duration target=" + DURATION_TARGET + " ms.");
    }
    let delta = durationActual - DURATION_TARGET; // Positive: system is slow, Negative: system is fast
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
        // log("The system is too fast. Actively waiting for the target duration to end.");
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
}

function generateCorrectionForIndices(indices) {
    // XOR the selected frames
    let xor = getFrameContent(indices[0]);
    for (let k = 1; k < indices.length; k++) {
        xor = xorStrings(xor, getFrameContent(indices[k]));
    }
    return btoa(xor);
}

// Return true when sending content data frames. Otherwise, correction frames are sent.
function sendingContent() {
    return frame + 1 < getNumberOfFrames();
}

// Return true when the last frame that was sent was data frame. Otherwise, no frame or correction frame was sent.
function lastFrameWasDataFrame() {
    return (frame + 1 == getNumberOfFrames() && lossRate == undefined) || sendingContent();
}

function sending() {
    return timer != undefined;
}

function onEnd() {
    log("End showing");

    timer = undefined;

    updateInfo();

    // Hide the QR code
    const el = document.getElementById("qrcode");
    el.style.visibility = "hidden";
}

function onRestart() {
    log("Restart showing");

    // Hide the QR code
    const el = document.getElementById("qrcode");
    el.style.visibility = "visible";

    nextFrame();
}

function nextFrame() {
    adjustDuration();

    let frameContent;

    let durationStats = measureTimeProcessing(() => {
        // Show missing if there are any
        if (0 < missingFrames.length) {
            const f = missingFrames[0];
            if (missingFrameDelta == undefined) {
                // Basic option: Show missing frame
                frameContent = getFrameContent(f);
                log("Frame " + f + ": " + frameContent);

                missingFrameDelta = 0;
            } else {
                // Improvement for higher reliability (achieved by variance in QR code): send a missing frame as a correction made of two frames: this and another one.
                // Downside: For a correction, we send several frames - that's nice. But often, we should send a sequence of missing frames. Then every frame is sent several times.
                missingFrameDelta++;

                let delta = missingFrameDelta;

                if (missingFrameDelta == MISSING_FRAME_DELTA_MAX) {
                    missingFrameDelta = undefined;
                    missingFrames.shift();
                }

                // Create correction frame for two indices: f and some other frame index
                // Solution: Use loss rate > 50% to ensure that correction has only 2 indices.
                let lossRateMin = 0.51;
                let lossRateMax = 0.99;
                let lossRate2 = lossRateMin + (delta-1) * (lossRateMax - lossRateMin) / (MISSING_FRAME_DELTA_MAX - 1);
                frameContent = getCorrectionFrameContent(lossRate2, f);
                log("Correction for frame " + f + " with lossRate " + lossRate2);
            }
        } else {
            if (sendingContent()) {
                // Show content frame
                frame++;

                frameContent = getFrameContent(frame);
                log("Frame " + frame + ": " + frameContent);
            } else {
                // Show correction frame
                if (lossRateIndex == -1) {
                    lossRateIndex++;
                    lossRate = LOSS_RATES[lossRateIndex];
                    correctionFrame = 0;
                    log("All content frames sent. Starting correction frames with assumed loss rate " + (lossRate * 100) + "%");
                } else {
                    if (correctionFrame + 1 == correctionFramesCount(lossRate)) {
                        lossRateIndex++;
                        if (lossRateIndex == LOSS_RATES.length) {
                            return;
                        }
                        lossRate = LOSS_RATES[lossRateIndex];
                        correctionFrame = 0;
                        log("Assumed loss rate changed to " + (lossRate * 100) + "%");
                    } else {
                        correctionFrame++;
                    }
                }

                frameContent = getCorrectionFrameContent(lossRate, correctionFrame);
                log("Correction for " + Math.round(100 * lossRate) + "%, frame " + correctionFrame + ": " + frameContent);
            }
        }
    });

    if (frameContent == undefined) {
        // Option 1: stop
        // onEnd();
        // return;

        // Option 2: restart from beginning. (Why not to use the opportunity.)
        log("All data and correction frames sent. Restarting from the beginning.");

        frame = -1;
        lossRateIndex = -1;
        lossRate = undefined;
        round++;

        timer = setTimeout(nextFrame, 0); // Run immediately
        return;
    }

    let durationStatsQr = measureTimeQr(() => {
        qrcode.makeCode(frameContent);
    });

    if (systemIsSlow()) {
        log(`  Get frame content duration ${durationStats.ms} ms, avg=${durationStats.avg.toFixed(2)} ms, stdDev=${durationStats.stddev.toFixed(2)} ms`);
        log(`  Creating QR code duration ${durationStatsQr.ms} ms, avg=${durationStatsQr.avg.toFixed(2)} ms, stddev=${durationStatsQr.stddev.toFixed(2)} ms`);
    }

    updateInfo();

    timer = setTimeout(nextFrame, duration);
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

        let restartNeeded = false;

        // Replace ranges
        let missingFramesNew = [];
        missingFramesNewGroups.forEach(function (item) {
                let itemUpperCase = item.toUpperCase();
                let itemFirstChar = itemUpperCase.charAt(0);
                let itemNumberStr = itemUpperCase.slice(1);
                let itemNumber = Number(itemNumberStr);

                // Fn - changes current frame to n
                // Example: F10 -> change current frame to 10
                if (itemFirstChar === "F") {
                    if (isNaN(itemNumber)) {
                        log("Invalid number \"" + itemNumberStr + "\".");
                        return;
                    }
                    let frameNew = itemNumber;
                    if (Math.abs(getNumberOfFrames()) <= frameNew) {
                        log("Cannot change frame to " + frameNew + " as it's not a valid frame number.");
                    } else {
                        log("Change frame to " + frameNew);
                        frame = 0 <= frameNew
                            ? frameNew
                            : getNumberOfFrames() + frameNew;
                        frame--; // -1 as the frame will be increased by one when shown next time
                        if (sendingContent()) {
                            lossRateIndex = -1;
                            lossRate = undefined;
                            correctionFrame = -1;
                        }
                    }
                    restartNeeded = true;
                    return;
                }

                // Ln - changes current correction loss rate to n
                // Example: L10 -> change current correction loss rate to n
                if (itemFirstChar === "L") {
                    if (isNaN(itemNumber)) {
                        log("Invalid number \"" + itemNumberStr + "\".");
                        return;
                    }
                    let lossRateNew = itemNumber / 100;
                    if (lossRateNew <= 0 || 100 <= lossRateNew) {
                        log("Cannot change loss rate frame to " + lossRateNew + " as it's not a valid loss rate number.");
                    } else {
                        log("Change loss rate to " + itemNumber + "%");
                        lossRateIndex = LOSS_RATES.length - 1;
                        lossRate = lossRateNew;
                        correctionFrame = -1;
                    }
                    restartNeeded = true;
                    return;
                }

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
                const index = Number(item);
                missingFramesNew.push(index);
            }
        );

        if (typeof missingFrames === "undefined") {
            log("Cannot add to missing as no file has been shown.");
            return;
        }

        if (0 < missingFramesNew.length) {
            log("Add to missing: " + missingFramesNew);
            // Remove new frames after the maximum frame
            const numberOfFrames = getNumberOfFrames();
            missingFramesNew = missingFramesNew.filter(function (item) {
                return item < numberOfFrames;
            });
            // Remove duplicates
            missingFramesNew = missingFramesNew.filter(function (value) {
                return missingFrames.indexOf(value) === -1;
            });
            // Add to missing frames to show
            missingFrames = missingFrames.concat(missingFramesNew);

            if (0 < missingFrames.length) {
                restartNeeded = true;
            }
        }

        if (!sending() && restartNeeded) {
            onRestart();
        }

        event.target.blur(); // Remove focus from the input field. Hide soft keyboard on mobile.
    } else if (event.keyCode === 47) { // Slash
        el.value = missingStr.replace(/^[^,. ]*[,. ]?/, "");
        event.returnValue = false; // block key
    }
}

function onDurationChange(event) {
    const value = Number(event.target.value);
    if (!isNaN(value) && value > 0) {
        onDurationChangeValue(value)
    }
}

function onDurationChangeValue(value) {
    DURATION_TARGET = value;
    duration = DURATION_TARGET;

    const speedBytesPerSecond = capacityForDataInOneFrame * (1000 / DURATION_TARGET);
    const speedMegaBytesPerHour = speedBytesPerSecond * 3600 / 1e6;

    let infoStr = " ... " + speedBytesPerSecond.toFixed(0) + " B/s = " + speedMegaBytesPerHour.toFixed(2) + " MB/h";
    const el = document.getElementById("speed");
    el.innerHTML = infoStr;
}

function updateInfo() {
    let infoStr = "";
    if (lastFrameWasDataFrame()) {
        const numberOfFrames = getNumberOfFrames();
        if (round == 1) {
            const ratio = (frame + 1) / numberOfFrames * 100; // This may be confusing to the user as frame starts from 0
            infoStr += ratio.toFixed(2) + "% ... " + frame + " / " + numberOfFrames + ". ";

            const timeLeft = Math.round((numberOfFrames - frame) * (isNaN(durationActual) || 0 < duration ? DURATION_TARGET : durationActual));
            let timeEnd = new Date(Date.now() + timeLeft);
            infoStr += "Time left " + formatDuration(timeLeft) + ". End on " + formatDate(timeEnd, false) + ". ";
        } else {
            infoStr += "Data " + frame + " / " + numberOfFrames + ". ";
        }
    } else {
        infoStr += "Correction for loss rate " + Math.round(100 * lossRate) + "%, frame " + correctionFrame + " / " + correctionFramesCount(lossRate) + ". ";
    }

    if (1 < round) {
        infoStr += "Round " + round + ".";
    }

    const el = document.getElementById("info");
    el.innerHTML = infoStr;
}
