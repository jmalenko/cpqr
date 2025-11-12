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

// Helper: produce an "incorrect" frame variant by replacing the last character
const makeIncorrect = (frame, replacement = 'X') =>
    frame.slice(0, -replacement.length) + replacement;

// Sample data with 2 data frames

const FRAME_0 = '1102651112104065018274223C%3A%5Cfakepath%5Ca.txt279data:text/plain;base';
const FRAME_1 = '11125964,SmVkbmEsDQpEdsSbLg0KVMWZaQ0KxJvFocSNxZnFvsO9w6HDrcOpDQo=';
const CORRECTION = 'C111110AAABAAMMBwUdYVxmX1JbcEN1aUJyUEFhUQ9CAwpzeBQ8ADpVOxk+HmNaIDJgDCIadEFKK1gDV3IwFxs7XzQ9DlRuO2Jhc2U=';

// Incorrect frames derived from originals
const FRAME_0_INCORRECT = makeIncorrect(FRAME_0, 'X'); // Frame 0 incorrect (last character changed to X)
const FRAME_1_INCORRECT = makeIncorrect(FRAME_1, 'X'); // Frame 1 incorrect (last character changed to X)
const CORRECTION_INCORRECT = makeIncorrect(CORRECTION,'1g='); // Correction frame (last character of frame 1 changed from e to X; then the correction frame was recreated)
const CORRECTION_INCORRECT2 = CORRECTION.replace('DJ', 'At'); // Correction frame (in frame 1 content, the file name changed from "a" to "X"; then the correction frame was recreated. The "DJ" in the middle changed to "At".)
const FRAME_3_INCORRECT = '11211X'; // Frame 3 incorrect

// Sample data with 3 data frames

const DATA_3_FRAME_0 = '1102451112104065018274223C%3A%5Cfakepath%5Ca.txt279';
const DATA_3_FRAME_1 = '111245data:text/plain;base64,SmVkbmEsDQpEdsSbLg0KVM';
const DATA_3_FRAME_2 = '112234WZaQ0KxJvFocSNxZnFvsO9w6HDrcOpDQo=';
const DATA_3_CORRECTION_1PCT = 'C111110MTEzMjM0AgokAjsPKQI0XC8+ChUhVT4VNlVcPhpAEFF/YElQR3RKJWBRMDJMOB9EeWF0';  // Correction frame for 1% loss (with index 1 out of 1)
const DATA_3_CORRECTION_34PCT_1 = 'C1234110AAACAAcBZmtQYwF7THpAc19Sa3xPblx0RTBqCjYTfQcUAiQVNDAbVSU1Q2EudHh0Mjc5';  // Correction frame with index 0 for 34% loss
const DATA_3_CORRECTION_34PCT_2 = 'C1234111AAABAAAAVVBFUwtEUUhCGkBdWVtZD1BTQCYTB212WBUNAwYgAyUlGGBRMDJMOB9EeWF0'; // Correction frame with index 1 for 34% loss

// Sample data with 4 data frames

const DATA_4_FRAME_0 = "11029511119658157358228C%3A%5Cfakepath%5Carchive.7z3312data:application/x-7z-compressed;base64,N3q8ry";
const DATA_4_FRAME_1 = "111295ccAASFcPvKiQAAAAAAAAAhAAAAAAAAADKpNuUAJhvKRmda8ne4fSd4SIKMAAAAAIEzB64PzxYxDAfIQ4CDgVv/rHdlPwXQ9";
const DATA_4_FRAME_2 = "112295TJ5kIra5iDa9wFK2fATIGeYt1EluEDbb3A2CnFGALG6h998XFDs0F7s2DCS30X7mrYz00bypuKTSuTfTj8wuV7zadMKcpdY";
const DATA_4_FRAME_3 = "113276P3pZhGpTe+7rwuYO1lRumhoTRMbSBRcGEgEJdwAHCwEAASMDAQEFXQAQAAAMgLoKAWo8+scAAA==";
const DATA_4_CORRECTION_1PCT = "C111110AAAAAA4DVis1QUtFRwlLEQgpdEphDi4vYk4qQEIiRCgkAjY2NAkYY3odLRMkCA8eD3NmOH5DUEUxURtoAFo+IzpcdyFwABhbLxMYO00qAh9dXXZuRAVNR3JCU30+HSxvKGUQRxk=";
const DATA_4_CORRECTION_34PCT_0 = "C1234110AAACAAAAZXsEWnBEVA1YcVYKQn55AF4CcXoGQGw3VyQHEDUlFgoWdHEiHCUvKDoiGF9DCgtpdCASRCcNEkI0LzpQUSxeAhx2Ah0HGFQTGiYkIRAnFTEOAxUUJVJMVUgDeBJIFiA=";
const DATA_4_CORRECTION_34PCT_1 = "C1234111AAACAA4DM1AxGzsBEwQTYF4jNjQYDnAtEzQsAC4VEwwjEgMTIgMOFws/MTYLIDU8FywlMnUqJGUjFTxlEhgKDAAMJg0uAgQtLQ4fIxk5GDl5fGZJUTRDRGdWdi9ySGRsUHdYUTk=";

const testFrames = [

    // Content fits 2 frames. (The capacity is 70.)
    {
        name: "2 frames, send all the content frames",
        frames: [FRAME_0, FRAME_1]
    },
    {
        name: "2 frames, send all the content frames in opposite direction",
        frames: [FRAME_1, FRAME_0]
    },
    {
        name: "2 frames, send frame 0 twice",
        frames: [FRAME_0, FRAME_0, FRAME_1]
    },
    {
        name: "2 frames, miss frame 0, send correction that allows building the frame",
        frames: [FRAME_1, CORRECTION],
        expected: false // We don't know the number of frames
    },
    {
        name: "2 frames, miss frame 1, send correction that allows building the frame",
        frames: [FRAME_0, CORRECTION]
    },

    // Even more unusual scenarios for 2 frames
    {
        name: "2 frames, send only frame 0",
        frames: [FRAME_0],
        expected: false // No file saved, missing frame 1
    },
    {
        name: "2 frames, send only frame 1",
        frames: [FRAME_1],
        expected: false // No file saved, missing frame 0
    },
    {
        name: "2 frames, send frame 0 correctly and then with incorrect data",
        frames: [FRAME_0, FRAME_0_INCORRECT, FRAME_1],
        expected: false // No file saved, we have frame 0 with incorrect data
        // This situation could be potentially identified with the (existing) correction. But why would we do that? If we have frame 0, we should not need the correction.
    },
    {
        name: "2 frames, send frame 0 with incorrect data and then correctly",
        frames: [FRAME_0_INCORRECT, FRAME_0, FRAME_1]
        // Expected: File saved, we have correct data at the moment when all frames were received
    },
    {
        name: "2 frames, send frame 1 correctly and then with incorrect data",
        frames: [FRAME_0, FRAME_1, FRAME_1_INCORRECT]
        // Expected: File saved, we have correct data at the moment when all frames were received
    },
    {
        name: "2 frames, send frame 1 with incorrect data and then correctly",
        frames: [FRAME_0, FRAME_1_INCORRECT, FRAME_1],
        // Expected: File saved, we have correct data at the moment when all frames were received
    },
    {
        name: "2 frames, miss frame 0, send incorrect correction",
        frames: [FRAME_1, CORRECTION_INCORRECT, ],
        expected: false // No file saved, recovered frame 0 with wrong data, fails hash check
    },
    {
        name: "2 frames, miss frame 1, send incorrect correction, but the recovered frame 1 is shorter than the correction so the incorrect part is not used",
        frames: [FRAME_0, CORRECTION_INCORRECT, ],
    },
    {
        name: "2 frames, miss frame 1, send incorrect correction (with changed 1st character)",
        frames: [FRAME_0, CORRECTION_INCORRECT2],
        expected: false // No file saved, recovered frame 1 with wrong data, fails hash check
    },
    {
        name: "2 frames, miss frame 1, send a wrong frame 2 (so download is triggered)",
        frames: [FRAME_0, FRAME_3_INCORRECT],
        expected: false // No file saved, missing frame 1
    },

    // Content fits 3 frames. (The capacity is 40.)
    {
        name: "3 frames, send all the content frames",
        frames: [DATA_3_FRAME_0, DATA_3_FRAME_1, DATA_3_FRAME_2]
    },
    {
        name: "3 frames, send all the content frames, frame 0 as last",
        frames: [DATA_3_FRAME_1, DATA_3_FRAME_2, DATA_3_FRAME_0]
    },
    {
        name: "3 frames, miss frame 0, send correction",
        frames: [DATA_3_FRAME_1, DATA_3_FRAME_2, DATA_3_CORRECTION_1PCT],
        expected: false // Not saved as number of frames (from header in frame 0) is unknown
    },
    {
        name: "3 frames, miss frame 1, send correction",
        frames: [DATA_3_FRAME_0, DATA_3_FRAME_2, DATA_3_CORRECTION_1PCT]
    },
    {
        name: "3 frames, miss frame 2, send correction",
        frames: [DATA_3_FRAME_0, DATA_3_FRAME_1, DATA_3_CORRECTION_1PCT]
    },

    {
        name: "3 frames, send correction trat recovers missing frame 1, then receive frame 1 which should be ignored",
        frames: [DATA_3_FRAME_0, DATA_3_CORRECTION_34PCT_2, DATA_3_FRAME_1, DATA_3_FRAME_2]
    },
    {
        name: "3 frames, miss frames 1 and 2, send corrections, recovery as correction frames are received",
        frames: [DATA_3_FRAME_0, DATA_3_CORRECTION_34PCT_1, DATA_3_CORRECTION_34PCT_2]
    },
    {
        name: "3 frames, miss frames 1 and 2, send corrections, recovery as correction frames are received, swap correction frames",
        frames: [DATA_3_FRAME_0, DATA_3_CORRECTION_34PCT_2, DATA_3_CORRECTION_34PCT_1]
    },
    {
        name: "3 frames, miss frames 1 and 2, send corrections, recovery as correction frames are received",
        frames: [DATA_3_FRAME_2, DATA_3_CORRECTION_34PCT_1, DATA_3_CORRECTION_34PCT_2],
        expected: false // Not saved as number of frames (from header in frame 0) is unknown
    },
    {
        name: "3 frames, miss frames 1 and 2, send corrections, unused correction frames must be stored for a later correction",
        frames: [DATA_3_FRAME_2, DATA_3_CORRECTION_34PCT_2, DATA_3_CORRECTION_34PCT_1],
        expected: false // Not saved as number of frames (from header in frame 0) is unknown
    },

    // Content fits 4 frames (7z, capacity 100)
    {
        name: "4 frames, send all the content frames",
        frames: [DATA_4_FRAME_0, DATA_4_FRAME_1, DATA_4_FRAME_2, DATA_4_FRAME_3]
    },
    {
        name: "4 frames, send all the content frames, frame 0 as last",
        frames: [DATA_4_FRAME_3, DATA_4_FRAME_2, DATA_4_FRAME_1, DATA_4_FRAME_0]
    },
    {
        name: "4 frames, miss frame 3, send correction",
        frames: [DATA_4_FRAME_0, DATA_4_FRAME_1, DATA_4_FRAME_2, DATA_4_CORRECTION_1PCT]
    }
];

let fileSimulated = -1;
let frameSimulated;

function scanSimulated() {
    if (fileSimulated < 0 || (frameSimulated + 1 === testFrames[fileSimulated].frames.length)) {
        // Check downloaded status of the test that just finished
        if (fileSimulated >= 0) {
            const downloadExpected = testFrames[fileSimulated].expected ?? true;
            if (downloadExpected !== downloaded) {
                log("Test '" + testFrames[fileSimulated].name + "' failed: expected downloaded = " + downloadExpected + " but got " + downloaded);
                throw Error("Test failed");
            }
        }

        // Move to next file
        fileSimulated++;
        frameSimulated = 0;
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
    onScan(frameData);

    setTimeout(scanSimulated, 10);
}

function simulationInProgress() {
    return 0 <= fileSimulated && fileSimulated < testFrames.length;
}

function tests() {
    assertEqual("formatMissing empty", formatMissing([]), "");
    assertEqual("formatMissing empty", formatMissing([1]), "1");
    assertEqual("formatMissing empty", formatMissing([1, 2]), "1+1");
    assertEqual("formatMissing empty", formatMissing([1, 2, 3]), "1+2");
    assertEqual("formatMissing empty", formatMissing([1, 2, 5]), "1+1, 5");
    assertEqual("formatMissing empty", formatMissing([1, 2, 5, 6]), "1+1, 5+1");
    assertEqual("formatMissing empty", formatMissing([1, 2, 5, 6, 7]), "5+2, 1+1");

    log("Tests finished in scan.js");

    log("> Tests");
    worker.postMessage({type: MSG_TYPE_TESTS});
}


/*
    Download
    ========
 */

function download(data, fileName, mimeType = 'application/octet-stream') {
    function downloadBlob(blob, name) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = name || 'download';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        // revoke after a short delay to ensure download starts
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    // Treat as binary-string where each char code is a byte (0..255)
    const len = data.length;
    const u8 = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        u8[i] = data.charCodeAt(i) & 0xFF;
    }
    downloadBlob(new Blob([u8], { type: mimeType }), fileName);
}

/*
    Main content
    ============
 */

/* Constants */

const QR_CODE_EMPTY = 1;
const QR_CODE_SAME_AS_PREVIOUS = 2;
const QR_CODE_ADDED_TO_QUEUE = 3;

/* Variables */

// Metadata
let path; // Path to the file being received
let numberOfFrames; // Number of frames of the file being received

// Status
let receivedDataFramesCount; // Number of data frames received
let receivedDataFrameMax; // Maximum id (number) of data frames received
let unusedCorrectionFramesCount; // Number of correction frames cached
let missing; // List of missing frames
let queueLength; // Length of the queue in the worker

// Internal status
let downloaded; // Whether the file has been downloaded
let contentPrevious; // Content of previous data in QR code
let startTime; // Time when the first frame was received

const logTiming = false;

const worker = new Worker('scanWorker.js');

worker.onmessage = function (e) {
    const message = e.data;
    if (message.type === MSG_TYPE_QUEUED) {
        // log("< Frame queued. (processing=" + message.processing + ", queueLength=" + message.queueLength + ")");
    } else if (message.type === MSG_TYPE_PROCESSED) {
        log("< Frame was processed: " + resultToText(message.result));

        log("Processing took " + message.statsProcessFrame.ms + " ms");

        if (message.result?.status !== undefined) {
            setStatus(message.result.status);
        }
        updateInfo();
    } else if (message.type === MSG_TYPE_ERROR) {
        // Error was already logged to console in worker
        log("< Error: " + message.error.toString() + "\n" +
            "Stack trace: " + message.error.stack);
    } else if (message.type === MSG_TYPE_METADATA) {
        const fileName = getFileNameFromPath(message.path);
        log("< Metadata decoded, file name " + fileName);
        path = message.path;
        numberOfFrames = message.numberOfFrames;
        updateInfo();
    } else if (message.type === MSG_TYPE_SAVE) {
        const fileName = getFileNameFromPath(message.path);
        log("< Save " + fileName);
        if (simulationInProgress()) {
            log("Skipping download in simulation");
        } else {
            download(message.data, fileName);
        }
        downloaded = true;
        updateInfo();
    } else {
        throw new Error("Unsupported message from worker: " + message.type);
    }
}

function resultToText(result) {
    if (result.resultCode == FRAME_DECODED) {
        return result.frames != undefined && 0 < result.frames.length
            ? "QR code with frame " + result.frame + " and recovered frames " + result.frames
            : "QR code with frame " + result.frame;
    } else if (result.resultCode == FRAME_ALREADY_KNOWN) {
        return "QR code with frame " + result.frame + " already known";
    } else if (result.resultCode == CORRECTION_DECODED) {
        return "QR code with correction used to decode frames " + result.frames;
    } else if (result.resultCode == CORRECTION_ALL_DATA_KNOWN) {
        return "QR code with correction not needed - all data already known";
    } else if (result.resultCode == CORRECTION_MORE_FRAMES_MISSING) {
        return "QR code with correction saved to be used later";
    } else if (result.resultCode == CORRECTION_MORE_FRAMES_MISSING_DUPLICATE) {
        return "QR code with correction not needed - correction already stored";
    } else {
        throw new Error("Unknown result code " + result.resultCode);
    }
}

function setStatus(status) {
    ({receivedDataFramesCount, receivedDataFrameMax, unusedCorrectionFramesCount, missing, queueLength} = status);
}

function metadataReceived() {
    return path !== undefined;
}

function init() {
    path = undefined;
    numberOfFrames = undefined;

    receivedDataFramesCount = 0;
    receivedDataFrameMax = undefined;
    unusedCorrectionFramesCount = 0;
    missing = [];
    queueLength = 0;

    downloaded = false;
    contentPrevious = undefined;
    startTime = undefined;

    log("> Init");
    worker.postMessage({type: MSG_TYPE_INIT});
}

function onScan(content) {
    // End if empty content
    if (content == "") {
        return {resultCode: QR_CODE_EMPTY};
    }

    // End if the same content as previously
    if (content == contentPrevious) {
        return {resultCode: QR_CODE_SAME_AS_PREVIOUS};
    }
    contentPrevious = content;

    if (startTime === undefined) {
        startTime = new Date();
    }

    log("> Scanned");
    worker.postMessage({type: MSG_TYPE_SCAN, data: content});

    return {resultCode: QR_CODE_ADDED_TO_QUEUE};
}

function getFileNameFromPath(path) {
    const posSlash = Math.max(path.lastIndexOf("\\"), path.lastIndexOf("/"));
    return path.slice(posSlash + 1);
}

function updateInfo() {

    function formatProgress(percent, received, total, unused, queue) {
        const pct = (typeof percent === 'number' && !Number.isNaN(percent)) ? (100 * percent).toFixed(2) : '?';
        const totalStr = (total !== undefined && total !== null) ? total : '?';
        return `${pct}% ... ${received} / ${totalStr} data, ${unused} cor, ${queue} queue`;
    }

    let infoStr = "";

    if (metadataReceived()) {
        if (downloaded) {
            infoStr += "<span style='color: #008000'>Saved</span> ";
            infoStr += getFileNameFromPath(path);
        } else {
            if (numberOfFrames != undefined && numberOfFrames != 0) {
                let percent = receivedDataFramesCount / numberOfFrames;
                infoStr += formatProgress(percent, receivedDataFramesCount, numberOfFrames, unusedCorrectionFramesCount, queueLength);
            } else {
                infoStr += formatProgress(undefined, receivedDataFramesCount, undefined, unusedCorrectionFramesCount, queueLength);
            }
        }
    } else {
        infoStr += formatProgress(undefined, receivedDataFramesCount, undefined, unusedCorrectionFramesCount, queueLength);
    }
    infoStr += "</br>";

    // TODO Info is optimized for downloading one file. Improve to support several files.
    let etc;
    if (!downloaded) {
        if (receivedDataFrameMax !== undefined) {
            // TODO If a Correction was encountered, then used numberOfFrames from metadata, otherwise use receivedDataFrameMax + 1
            let lossRate = missing.length / (receivedDataFrameMax + 1);
            infoStr += "Loss rate " + (100 * lossRate).toFixed(2) + "%. ";
        }

        const elMissingList = document.getElementById("missingList");
        if (0 < missing.length) {
            infoStr += "Missing " + missing.length + ":";

            elMissingList.innerHTML = formatMissing(missing);
            elMissingList.hidden = false;
        } else {
            elMissingList.hidden = true;
        }

        // TODO test and remove
        if (numberOfFrames !== undefined) {
            etc = "Summary\n";
            let ratio = unusedCorrectionFramesCount == 0 // If we are receiving the data frames for the first time
                ? receivedDataFramesCount / (receivedDataFrameMax + 1)
                : receivedDataFramesCount / numberOfFrames;
            etc += "Progress " + (100 * ratio).toFixed(2) + "%";
            etc += ";\n ";

            let lossRate = missing.length / (receivedDataFrameMax + 1);
            etc += "Loss rate: " + (100 * lossRate).toFixed(2) + "%";
            etc += ";\n ";
            etc += "Non-loss rate: " + (100 * (1 - lossRate)).toFixed(2) + "%";
            etc += ";\n ";

            let percent = receivedDataFramesCount / numberOfFrames;
            etc += "Percent received: " + (100 * percent).toFixed(2) + "%";
            etc += ";\n ";

            if (startTime !== undefined) {
                let startTimeMs = startTime.getTime();
                etc += "Time start " + formatDate(startTime);
                etc += ";\n ";
                let nowMs = Date.now();
                etc += "Now        " + formatDate(new Date(nowMs));
                etc += ";\n ";
                let endTimeMs = startTimeMs + (nowMs - startTimeMs) / percent;
                let endTime = new Date(endTimeMs);
                etc += "Time end   " + formatDate(endTime)
                etc += ";\n ";
                let timeLeft = endTimeMs - nowMs;
                etc += "Time left  " + formatDuration(timeLeft);
                etc += ";\n ";
            }
            log(etc);
            if (startTime !== undefined) {
                etc = "Time left " + formatDuration(timeLeft) + ", ETC " + formatDate(endTime, false);
            } else {
                etc = "Cannot estimate ETC because the first frame wasn't received yet.";
            }
        } else {
            etc = "Cannot estimate ETC because the total number of frames is unknown. Scan frame 0 to get metadata.";
        }
    } else {
        etc = "";
    }

    const el = document.getElementById("info");
    el.innerHTML = infoStr;

    let elStatus = document.getElementById("status");
    elStatus.innerHTML = etc;
}

// Parameter missing must be an ordered array of numbers.
// Formats the missing array as a string. Consecutive numbers are grouped as ranges in the format N+M, where N is the first number in the range and M is the lengths of consecutive sequence.
// Example: [1,3,4,6,7,8] -> "1,3+1,6+2"
function formatMissing(missing) {
    if (!missing || missing.length === 0) return "";

    let result = []; // Array of [start, count] pairs
    let start = missing[0];
    let count = 1;

    for (let i = 1; i < missing.length; i++) {
        if (missing[i] === missing[i - 1] + 1) {
            count++;
        } else {
            result.push([start, count - 1]);
            start = missing[i];
            count = 1;
        }
    }
    // Add the last range or number
    result.push([start, count - 1]);

    // Order by length of the sequence, decreasing (2nd number in the array)
    result.sort((a, b) => b[1] - a[1]);

    // Format the result
    result = result.map(pair => pair[1] > 0
        ? `${pair[0]}+${pair[1]}`
        : `${pair[0]}`);

    return result.join(", ");
}

function isMobileDevice() {
    return /Mobi|Android|iPhone|iPad|iPod|Windows Phone/i.test(navigator.userAgent)
        || (('ontouchstart' in window) && navigator.maxTouchPoints > 0);
}

// Inspired by
// https://simpl.info/getusermedia/sources/ - getting the selector with cameras
// https://cozmo.github.io/jsQR/ - getting the video stream and processing video frame by frame
function initStream() {
    let measureDurationQrRecognition = createMeasureDuration();
    let measureIntervalAnimationFrame = createMeasureInterval();

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
        video.setAttribute("playsinline", "true"); // required to tell iOS safari we don't want fullscreen
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

        // TODO hide status
        status.innerText = "";
        // status.hidden = true; // Hide the initial status

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
                cameraSelect.onchange(cameraSelect.value);
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
            // Measure animation speed
            let statsAnimationFrame = measureIntervalAnimationFrame();
            if (statsAnimationFrame.ms !== undefined) {
                if (logTiming && isAboveSigma(statsAnimationFrame, 3)) {
                    log(`WARNING: Animation frame variation ${statsAnimationFrame.ms} ms, avg=${statsAnimationFrame.avg.toFixed(1)} ms, stddev=${statsAnimationFrame.stddev.toFixed(1)} ms`);
                }
                document.getElementById("scanSpeed").innerText = "Scan speed: avg " + statsAnimationFrame.avg.toFixed(1) + " ms; last " + statsAnimationFrame.ms.toFixed(1) + " ms.";
            }

            canvasElement.hidden = false;

            const isLandscape = window.innerWidth > window.innerHeight;
            if (!isLandscape) { // Portrait
                canvasElement.width = video.videoWidth;
                canvasElement.height = video.videoHeight;

                if (!flipVideo) {
                    canvas.drawImage(video, 0, 0, canvasElement.width, canvasElement.height);
                } else {
                    canvas.save();
                    canvas.scale(-1, 1);
                    canvas.drawImage(video, -canvasElement.width, 0, canvasElement.width, canvasElement.height);
                    canvas.restore();
                }
            } else {
                const shouldRotate = isMobileDevice();
                if (shouldRotate) {
                    // Mobile camera, portrait. Rotate only on mobile when video frame is landscape (camera sensor rotated)
                    canvasElement.width = video.videoHeight;
                    canvasElement.height = video.videoWidth;

                    canvas.save();
                    canvas.translate(canvasElement.width / 2, canvasElement.height / 2);
                    canvas.rotate(-Math.PI / 2);
                    if (flipVideo) {
                        canvas.scale(-1, 1);
                    }
                    canvas.drawImage(video, -video.videoWidth / 2, -video.videoHeight / 2, video.videoWidth, video.videoHeight);
                    canvas.restore();
                } else {
                    // Desktop camera (landscape) — draw normally and keep flip logic
                    canvasElement.width = video.videoWidth;
                    canvasElement.height = video.videoHeight;

                    if (!flipVideo) {
                        canvas.drawImage(video, 0, 0, canvasElement.width, canvasElement.height);
                    } else {
                        canvas.save();
                        canvas.scale(-1, 1);
                        canvas.drawImage(video, -canvasElement.width, 0, canvasElement.width, canvasElement.height);
                        canvas.restore();
                    }
                }
            }

            let imageData = canvas.getImageData(0, 0, canvasElement.width, canvasElement.height);

            let code;
            let statsQrRecognition = measureDurationQrRecognition(() => {
                code = jsQR(imageData.data, imageData.width, imageData.height, {
                    inversionAttempts: "dontInvert",
                });
            });
            if (logTiming && isAboveSigma(statsQrRecognition, 3)) {
                log(`WARNING: Recognize QR code variation ${statsQrRecognition.ms} ms, avg=${statsQrRecognition.avg.toFixed(1)} ms, stddev=${statsQrRecognition.stddev.toFixed(1)} ms`);
            }

            if (code) {
                drawLine(code.location.topLeftCorner, code.location.topRightCorner, "#FF3B58");
                drawLine(code.location.topRightCorner, code.location.bottomRightCorner, "#FF3B58");
                drawLine(code.location.bottomRightCorner, code.location.bottomLeftCorner, "#FF3B58");
                drawLine(code.location.bottomLeftCorner, code.location.topLeftCorner, "#FF3B58");

                let result = onScan(code.data);
                // The fact that the QR is recognized is indicated by the red rectangle. Therefore, no other status is needed.
                // if (result.resultCode === QR_CODE_EMPTY) {
                //     status.innerText = "QR code scanned and it's empty; ignoring";
                // } else if (result.resultCode !== QR_CODE_SAME_AS_PREVIOUS) {
                //     status.innerText = "QR code scanned and it's same as previous; ignoring";
                // } else if (result.resultCode !== QR_CODE_ADDED_TO_QUEUE) {
                //     status.innerText = "QR code scanned and added to processing queue";
                // } else {
                //     throw new Error("Unsupported result " + result);
                // } else {
                //     status.innerText = "No QR code";
                // }
            }
            // } else {
            //     status.innerText = "Loading video..."
        }
        requestAnimationFrame(onAnimationFrame);
    }
}

function onLoad() {
    init();

    tests();

    initStream();

    // scanSimulated();
}

