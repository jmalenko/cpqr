importScripts('common.js'); // if needed

let queue = [];
let processing = false;

self.onmessage = function (e) {
    const message = e.data;
    if (message.type === MSG_TYPE_SCAN) {
        queue.push(message.data);
        self.postMessage({type: MSG_TYPE_QUEUED, processing, queueLength: queue.length});
        if (!processing) {
            processQueue();
        }
    } else if (message.type === MSG_TYPE_TESTS) {
        tests();
    } else if (message.type === MSG_TYPE_INIT) {
        init();
    } else {
        throw new Error("Unsupported message from worker: " + message.type);
    }
};

async function processQueue() {
    processing = true;
    while (queue.length > 0) {
        try {
            const data = queue.shift();
            processScan(data);
        } catch (e) {
            console.error("Error in processing scan: " + e.toString() + "\n" + e.stack);
            self.postMessage({type: MSG_TYPE_ERROR, error: e.toString()});
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

class InvalidVariableLengthQuantityError extends Error {
    constructor(message, results) {
        super("Invalid variable-length quantity: " + message);
        this.name = "InvalidVariableLengthQuantityError";
        this.results = results;
    }
}

class InvalidVariableLengthQuantityDataLengthError extends InvalidVariableLengthQuantityError {
    constructor(message, results) {
        super("Invalid variable-length quantity: " + message);
        this.name = "InvalidVariableLengthQuantityDataLengthError";
        this.results = results;
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

let measureDurationProcessFrame;

function tests() {
    assertEqual("decodeWithLength 0", decodeWithLength("10"), [0, "", 2]);
    assertEqual("decodeWithLength 1", decodeWithLength("110", 0), [1, "0", 3]);
    assertEqual("decodeWithLength 2", decodeWithLength("120.", 0), [2, "0.", 4]);
    assertEqual("decodeWithLength 9", decodeWithLength("190........", 0), [9, "0........", 11]);

    assertEqual("decodeWithLength 10", decodeWithLength("2100.........", 0), [10, "0.........", 13]);
    assertEqual("decodeWithLength 11", decodeWithLength("2110.........1", 0), [11, "0.........1", 14]);

    console.log("Tests finished in scanWorker.js");
}

function init() {
    contentRead = [];
    hashSaved = undefined;
    headerDecoded = false;
    unusedCorrectionFrames = [];

    measureDurationProcessFrame = createMeasureDuration();
}

function decodeWithLength(str, from) {
    if (from == undefined) {
        from = 0;
    }

    const lengthOfLengthStr = str.slice(from, from + 1);
    if (lengthOfLengthStr.length != 1) {
        throw new InvalidVariableLengthQuantityError("Unsupported value of length of length", {string: str, from, lengthOfLengthStr});
    }
    const lengthOfLength = Number(lengthOfLengthStr);
    if (isNaN(lengthOfLength)) {
        throw new InvalidVariableLengthQuantityError("Length of length is not a number", {string: str, from, lengthOfLengthStr});
    }

    const lengthStr = str.slice(from + 1, from + 1 + lengthOfLength);
    const length = Number(lengthStr);
    if (isNaN(length)) {
        throw new InvalidVariableLengthQuantityError("Length is not a number", {string: str, from, lengthStr});
    }

    const data = str.slice(from + 1 + lengthOfLength, from + 1 + lengthOfLength + length);

    if (length != data.length) {
        throw new InvalidVariableLengthQuantityDataLengthError("Length does not match data length", {
            string: str,
            from,
            lengthOfLength,
            length,
            dataLength: data.length,
            lengthOfLengthStr,
            lengthStr
        });
    }

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

function decodeContentWithoutChecks(content, decodeData = true) {
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

    if (decodeData) {
        [length, data, from] = decodeWithLength(content, from);
    }

    return [version, hash, fileName, data, length, from];
}

function decodeContent() {
    const content = getContent();

    let version, hash, path, data, length, from;
    try {
        [version, hash, path, data, length, from] = decodeContentWithoutChecks(content);
    } catch (e) {
        throw new NotAllDataError("Not all data");
    }

    // Verify hash
    const hashCalculated = hashFnv32a(path + data, false);
    if (hash !== hashCalculated.toString()) {
        console.log("Incorrect hash")
        throw new NotAllDataError("Incorrect hash");
    }

    return [hash, path, data];
}

function getContentInfo() {
    if (contentRead[0] === undefined) {
        throw new Error("Cannot get content info: frame 0 is missing");
    }

    // Assumption: The header is in first 3 frames. In fact, it can continue in following frames.
    // Risk: The page may not show the information about the file.
    // Why this is NOT improved: 1. This function should be fast. 2. In practice the capacity is big enough to fit the header in frame 0.
    // This is not a risk for saving the file as it gets everything from decodeContent().
    let headerContent = "";
    for (let i = 0; i < 3 && contentRead[i] !== undefined; i++) {
        let [frameStr, content] = decodeFrameContent(contentRead[i]);
        headerContent += content;
    }
    console.log("Header content for info: " + headerContent);
    let [version, hash, path, data, length, from] = decodeContentWithoutChecks(headerContent, false);
    console.log("done decodeContentWithoutChecks");

    // Get data length
    try {
        [length, data, from] = decodeWithLength(headerContent, from);
        console.info("done decodeWithLength. from = " + from);
    } catch (e) {
        if (e instanceof InvalidVariableLengthQuantityDataLengthError) {
            console.info("error in decodeWithLength - InvalidVariableLengthQuantityDataLengthError. from = " + from);
            // from = from + e.results.length;
            from = from + e.results.lengthOfLengthStr.length + e.results.lengthStr.length + e.results.length;
        } else {
            throw e;
        }
    }

    let [frameStr, content] = decodeFrameContent(contentRead[0]);
    const capacityForDataInOneFrame = content.length;
    // console.info("Content length = " + from);
    // console.info("capacityForDataInOneFrame = " + capacityForDataInOneFrame);
    const numberOfFrames = Math.ceil(from / capacityForDataInOneFrame); // Keep this consistent with calculation in show.js

    return [hash, path, numberOfFrames];
}

function decodeCorrectionIndices(content) {
    let from = 1; // Skip the initial 'C' character
    let lossRateLen, lossRateStr, indexLen, indexStr;

    [lossRateLen, lossRateStr, from] = decodeWithLength(content, from);
    let lossRate = Number(lossRateStr);
    if (isNaN(lossRate)) {
        throw new Error("Error decoding content: loss rate is not a number");
    }
    lossRate /= 100.0;

    [indexLen, indexStr, from] = decodeWithLength(content, from);
    let index = Number(indexStr);
    if (isNaN(index)) {
        throw new Error("Error decoding content: index is not a number");
    }

    return [correctionIndices(lossRate, index), from];
}

function getNumberOfFrames() {
    let [hash, path, numberOfFrames] = getContentInfo();
    return numberOfFrames;
}

function decodeCorrectionFrame(content) {
    let indices, from;
    try {
        [indices, from] = decodeCorrectionIndices(content);
    } catch (e) {
        // Typically when frame 0 is missing and we cannot get number of frames
        if (unusedCorrectionFrames.includes(content)) {
            return {resultCode: CORRECTION_MORE_FRAMES_MISSING_DUPLICATE};
        } else {
            unusedCorrectionFrames.push(content);
            return {resultCode: CORRECTION_MORE_FRAMES_MISSING};
        }
    }

    let payload = content.slice(from);

    // Find all missing indices
    let missingIndices = indices.filter(idx => contentRead[idx] === undefined);
    // Only recover if exactly one is missing in this correction frame. If more than one is missing, store the correction for a later use.
    if (missingIndices.length == 0) {
        return {resultCode: CORRECTION_ALL_DATA_KNOWN};
    } else if (missingIndices.length !== 1) {
        if (unusedCorrectionFrames.includes(content)) {
            return {resultCode: CORRECTION_MORE_FRAMES_MISSING_DUPLICATE};
        } else {
            unusedCorrectionFrames.push(content);
            return {resultCode: CORRECTION_MORE_FRAMES_MISSING, frames: missingIndices};
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

        let indices, from;
        [indices, from] = decodeCorrectionIndices(content);

        // Find all missing indices
        let missingIndices = indices.filter(idx => contentRead[idx] === undefined);

        if (missingIndices.length == 0) {
            console.log("A stored correction frame removed as all the data is known: " + content);
            unusedCorrectionFrames.splice(i, 1);
        }
    }
}

function isCorrectionFrame(content) {
    let firstChar = content.slice(0, 1);
    return firstChar == "C";
}

function processFrame(content) {
    if (isCorrectionFrame(content)) {
        let result = decodeCorrectionFrame(content);
        if (result.resultCode == CORRECTION_DECODED) {
            console.log("Recovered frame " + result.frame + " with content " + contentRead[result.frame]);
            let frames = recoveryWithUnusedCorrectionFrames();
            frames.unshift(result.frame);
            return {resultCode: CORRECTION_DECODED, frames};
        } else {
            if (result.resultCode == CORRECTION_ALL_DATA_KNOWN) {
                console.log("Correction frame received, but ignored as all the data is known");
            } else if (result.resultCode == CORRECTION_MORE_FRAMES_MISSING_DUPLICATE) {
                console.log("Correction frame received, but it's already stored: " + content);
            } else if (result.resultCode == CORRECTION_MORE_FRAMES_MISSING) {
                if (result.frames !== undefined) {
                    console.log("Correction frame received, but cannot be used now (missing " + result.frames.length + " frames: " + result.frames + "), storing for later use");
                } else {
                    console.log("Correction frame received, but cannot be used now, storing for later use. Correction frame can be used after header is received.");
                }
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

            let frames = recoveryWithUnusedCorrectionFrames();
            return {resultCode: FRAME_DECODED, frame: result.frame, frames};
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
            let [hash, path, numberOfFrames] = getContentInfo();
            headerDecoded = true;
            if (0 < frame) {
                console.log("Header decoded");
            }
            self.postMessage({type: MSG_TYPE_METADATA, path, numberOfFrames});
        }
    } catch (e) {
        console.log("Cannot decode header. Error: " + e.toString() + "\n" + e.stack);
    }
}

function allFramesRead() {
    if (!headerDecoded) {
        return false;
    }

    let numberOfFrames = getNumberOfFrames();
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

function constructData() {
    try {
        // If all frames then download
        console.log("Trying to construct the entire content");

        let [hash, path, dataURL] = decodeContent();

        if (hash !== hashSaved) {
            console.log("Constructed the entire content");

            const posComma = dataURL.indexOf(","); // Part before comma is mime type and encoding: data:text/plain;base64
            const b64 = dataURL.slice(posComma + 1);
            const fileContent = atob(b64);

            hashSaved = hash;
            return {save: true, data: fileContent, path};
        }
    } catch (e) {
        if (e instanceof MissingFrameError) {
            // The dataURL is not complete yet
            console.log("Missing frames " + e.missing);
            return {missing: e.missing};
        } else if (e instanceof NotAllDataError) {
            // Do nothing - it's normal that we do not have all data yet
        } else {
            throw e;
        }
    }
}

function createStatus() {
    return {
        receivedDataFramesCount: Object.keys(contentRead).length,
        receivedDataFrameMax: Math.max(...Object.keys(contentRead).map(Number)),
        unusedCorrectionFramesCount: unusedCorrectionFrames.length,
        missing: getMissingFrames(),
        queueLength: queue.length
    };
}

function processScan(content) {
    let result;
    let statsProcessFrame = measureDurationProcessFrame(() => {
        result = processFrame(content);
        result.status = createStatus();
    });

    self.postMessage({type: MSG_TYPE_PROCESSED, result, statsProcessFrame});

    if (![FRAME_DECODED, CORRECTION_DECODED].includes(result.resultCode)) {
        return;
    }

    decodeHeader(frame);

    if (allFramesRead()) {
        let resultConstructData = constructData();
        if (resultConstructData != undefined && resultConstructData.save) {
            self.postMessage({
                type: MSG_TYPE_SAVE,
                data: resultConstructData.data,
                path: resultConstructData.path
            });
        }
    }
}
