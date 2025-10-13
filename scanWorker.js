importScripts('common.js'); // if needed

let queue = [];
let processing = false;

self.onmessage = function (e) {
    if (e.data.type === 'scan') {
        queue.push(e.data.data);
        // console.log("Queued scan, queue length: " + queue.length);
        self.postMessage({status: 'queued', queueLength: queue.length});
        if (!processing) {
            processQueue();
        }
    } else if (e.data.type === 'tests') {
        tests();
    } else if (e.data.type === 'init') {
        init();
    }
};

async function processQueue() {
    processing = true;
    while (queue.length > 0) {
        try {
            const data = queue.shift();
            let result = processScan(data);
            self.postMessage({status: 'processed', result});
        } catch (e) {
            self.postMessage({status: 'error', error: e.toString()});
        }
    }
    processing = false;
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

let measureTimeProcessing;

const worker = new Worker('scanWorker.js');
worker.onmessage = function (e) {
    const result = e.data;
    console.log("Worker result: " + JSON.stringify(result));
    // TODO Update UI/status based on result
};

function tests() {
    assertEqual("decodeWithLength 0", decodeWithLength("10"), [0, "", 2]);
    assertEqual("decodeWithLength 1", decodeWithLength("110", 0), [1, "0", 3]);
    assertEqual("decodeWithLength 2", decodeWithLength("120.", 0), [2, "0.", 4]);
    assertEqual("decodeWithLength 9", decodeWithLength("190........", 0), [9, "0........", 11]);

    assertEqual("decodeWithLength 10", decodeWithLength("2100.........", 0), [10, "0.........", 13]);
    assertEqual("decodeWithLength 11", decodeWithLength("2110.........1", 0), [11, "0.........1", 14]);
    log("Tests finished");
}

function init() {
    contentRead = [];
    hashSaved = undefined;
    headerDecoded = false;
    unusedCorrectionFrames = [];
    contentPrevious = undefined;

    measureTimeProcessing = createMeasureTime();
}

function decodeWithLength(str, from) {
    if (from == undefined) {
        from = 0;
    }

    const lengthOfLengthStr = str.slice(from, from + 1);
    if (lengthOfLengthStr.length != 1) {
        throw new Error("Invalid variable-length quantity value: length of length cannot be determined; " + str + " " + from);
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
        console.log("Incorrect hash")
        throw new NotAllDataError("Incorrect hash");
    }

    return [hash, fileName, data];
}

function getContentInfo() {
    // Assumption: The header is in first 3 frames. In fact, it can continue in following frames.
    // Risk: The page may not show the information about the file.
    // Why this is NOT improved: 1. This function should be fast. 2. In practice the capacity is big enough to fit the header in frame 0.
    // This is not a risk for saving the file as it gets everything from decodeContent().
    let headerContent = "";
    for (let i = 0; i < 3; i++) {
        if (contentRead[i] !== undefined) {
            headerContent += contentRead[i];
        }
    }
    let [frameStr, content] = decodeFrameContent(headerContent);
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
        console.log("Warning: Frame index mismatch in recovered frame: expected " + missingIndex + " but got " + result.frame);
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
            console.log("Frame " + frame + " with new content, length " + content.length + ": " + content);
            console.log("       previous content, length " + contentRead[frame].length + ": " + contentRead[frame]);

            // console.log("Frame " + frame + " with new content");
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
                console.log("Used a stored correction frame to recover a missing frame " + result.frame + " with content " + contentRead[result.frame]);
                frameList.push(result.frame);
                unusedCorrectionFrames.splice(i, 1);
                changed = true;
            } else if (result.resultCode == CORRECTION_ALL_DATA_KNOWN) {
                console.log("A stored correction frame removed as all the data is known");
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
            console.log("A stored correction frame removed as all the data is known: " + content);
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
            console.log("Recovered frame " + result.frame + " with content " + contentRead[result.frame]);
            let frameList = recoveryWithUnusedCorrectionFrames();
            frameList.unshift(result.frame);
            return {resultCode: CORRECTION_DECODED, frames: frameList};
        } else {
            if (result.resultCode == CORRECTION_ALL_DATA_KNOWN) {
                console.log("Correction frame received, but ignored as all the data is known");
            } else if (result.resultCode == CORRECTION_IMPOSSIBLE_MORE_FRAMES_MISSING_DUPLICATE) {
                console.log("Correction frame received, but it's already stored: " + content);
            } else if (result.resultCode == CORRECTION_IMPOSSIBLE_MORE_FRAMES_MISSING) {
                console.log("Correction frame received, but cannot be used now (missing " + result.frames.length + " frames: " + result.frames + "), storing for later use");
            }
            return result;
        }
    } else {
        let result = saveFrame(content);
        if (result.resultCode == FRAME_DECODED) {
            console.log("Read frame " + result.frame + " with content " + contentRead[result.frame]);

            if (frame == 0) {
                headerDecoded = false;
            }

            let frameList = recoveryWithUnusedCorrectionFrames();
            return {resultCode: FRAME_DECODED, frame: result.frame, frames: frameList};
        } else if (result.resultCode == FRAME_ALREADY_KNOWN) {
            console.log("Read frame " + result.frame + " which was already known");
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
            console.log("File name = " + fileName);
            console.log("Frames = " + numberOfFrames);
            headerDecoded = true;
            if (0 < frame) {
                console.log("Header decoded");
            }
        }
    } catch (e) {
        console.log("Cannot decode header");
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
        console.log("All frames received, trying to save file");

        let [hash, fileName, dataURL] = decodeContent();

        if (hash !== hashSaved) {
            console.log("Got all frames");

            const posComma = dataURL.indexOf(",");
            const b64 = dataURL.slice(posComma + 1);
            const fileContent = atob(b64);

            hashSaved = hash;
            return {saved: true, data: fileContent, fileName: fileName};
        }
    } catch (e) {
        if (e instanceof MissingFrameError) {
            // The dataURL is not complete yet
            console.log("Missing frames " + e.missing);
            return {missing: e.missing};
        } else if (e instanceof NotAllDataError) {
            // Do nothing - it's normal that we do not have all data yet
        } else {
            console.log("Error when trying to save file" + "\n" +
                "Error: " + e.toString() + "\n" +
                "Stack trace: " + e.stack);
        }
    }
}

function processScan(content) {
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
            self.postMessage({status: 'save', data: resultSave.data, fileName: resultSave.fileName});
        }
    }

    return result;
}
