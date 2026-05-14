importScripts('common.js'); // if needed

let queue = [];
let processing = false;

self.onmessage = function (e) {
    const message = e.data;
    if (message.type === MSG_TYPE_SCAN) {
        queue.push(message.data);

        // Persist every scanned data. It may be useful for resuming after stop. The persisted data is cleared when a new file starts (frame 0 received).
        persistSave({content: message.data})
            .catch((e) => { console.error('persistSave failed', e); });

        self.postMessage({type: MSG_TYPE_QUEUED, processing, queueLength: queue.length});
        if (!processing) {
            processQueue();
        }
    } else if (message.type === MSG_TYPE_TESTS) {
        tests();
    } else if (message.type === MSG_TYPE_TIMING_TEST) {
        runTimingTests();
    } else if (message.type === MSG_TYPE_INIT) {
        init();
        if (message.clearPersistedStorage) {
            persistClear()
                .catch((e) => { console.error('persistClear failed', e); });
        }
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

let unusedCorrectionFramesSet; // Set<string> — O(1) duplicate detection for stored correction frames
let correctionsByFrame; // Map<frameIndex, Set<string>> — reverse index: which stored corrections cover each frame
let pendingCorrectionFrames; // Set<string> — corrections received before frame 0 (header) was available

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
    unusedCorrectionFramesSet = new Set();
    correctionsByFrame = new Map();
    pendingCorrectionFrames = new Set();

    measureDurationProcessFrame = createMeasureDuration();
}

function addPersistedDataToQueue() {
    // Load persisted scans (if any) and process them.
    // Do this asynchronously so init() stays synchronous for callers that expect immediate return.
    persistLoad().then((scanDatas) => {
        if (!scanDatas || scanDatas.length === 0) {
            console.log("No data to load from persisted storage");
            return;
        }

        console.log(`Restoring ${scanDatas.length} scans from persisted storage`);

        const contents = scanDatas.map(data => data.content);

        // Push data frames first, corrections next to optimize performance (so the unneeded corrections are not handled).
        // Sorting alphabetically puts the data frames first as they start with digits while correction frames start with "C".
        contents.sort();

        queue.push(...contents);

        self.postMessage({type: MSG_TYPE_RESTORED, restoredCount: contents.length});

        if (!processing && 0 < queue.length) {
            processQueue();
        }
    }).catch((e) => { console.error('Error restoring persisted frames', e); });
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

            const frame = Number(frameStr);
            console.assert(i == frame, `Frame index mismatch: expected ${i} but got ${frame}`);

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
    console.log("Header content: " + headerContent);
    let [version, hash, path, data, length, from] = decodeContentWithoutChecks(headerContent, false);

    // Get data length
    try {
        [length, data, from] = decodeWithLength(headerContent, from);
    } catch (e) {
        if (e instanceof InvalidVariableLengthQuantityDataLengthError) {
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

function decodeCorrectionHeader(content) {
    // If frame 0 (generally: header) is missing, then we cannot get number of frames which is needed to calculate correction indices in the correctionIndices() function.

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

    return [lossRate, index, from];
}

function getNumberOfFrames() {
    let [hash, path, numberOfFrames] = getContentInfo();
    return numberOfFrames;
}

function decodeCorrectionFrame(content) {
    let lossRate, index, indices, from;
    try {
        [lossRate, index, from] = decodeCorrectionHeader(content);
        indices = correctionIndices(lossRate, index);
    } catch (e) {
        // Typically, we get error when the header is not yet decoded, we cannot get number of frames to calculate correction indices.
        if (unusedCorrectionFramesSet.has(content)) {
            return {resultCode: CORRECTION_MORE_FRAMES_MISSING_DUPLICATE};
        } else {
            storeUnusedCorrectionFrame(content);
            return {resultCode: CORRECTION_MORE_FRAMES_MISSING};
        }
    }

    let payload = content.slice(from);

    // Find all missing indices
    let missingIndices = indices.filter(idx => contentRead[idx] === undefined);
    // Only recover if exactly one is missing in this correction frame. If more than one is missing, store the correction for a later use.
    if (missingIndices.length == 0) {
        return {resultCode: CORRECTION_ALL_DATA_KNOWN, lossRate, index};
    } else if (missingIndices.length !== 1) {
        if (unusedCorrectionFramesSet.has(content)) {
            return {resultCode: CORRECTION_MORE_FRAMES_MISSING_DUPLICATE};
        } else {
            storeUnusedCorrectionFrame(content);
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

    console.assert(missingIndex === result.frame, `Frame index mismatch in recovered frame: expected ${missingIndex} but got ${result.frame}`);

    return {resultCode: CORRECTION_DECODED, frame: result.frame, lossRate, index};
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

// Store a correction frame that cannot be applied yet.
// Indexes it into correctionsByFrame immediately if the header (frame 0) is already available;
// otherwise parks it in pendingCorrectionFrames to be indexed once frame 0 arrives.
function storeUnusedCorrectionFrame(content) {
    unusedCorrectionFramesSet.add(content);
    try {
        indexCorrectionFrame(content);
    } catch (e) {
        // Header not yet available; will be indexed in indexPendingCorrectionFrames() when frame 0 arrives.
        pendingCorrectionFrames.add(content);
    }
}

// Register a correction frame in the reverse index (correctionsByFrame).
// Requires the header (frame 0) to be present so correction indices can be calculated.
function indexCorrectionFrame(content) {
    const [lossRate, index] = decodeCorrectionHeader(content);
    const indices = correctionIndices(lossRate, index);
    for (const idx of indices) {
        if (!correctionsByFrame.has(idx)) {
            correctionsByFrame.set(idx, new Set());
        }
        correctionsByFrame.get(idx).add(content);
    }
}

// Remove a used (or obsolete) correction frame from all data structures.
// Caller must supply the already-decoded indices to avoid re-parsing.
function removeStoredCorrectionFrame(content, indices) {
    unusedCorrectionFramesSet.delete(content);
    pendingCorrectionFrames.delete(content);
    for (const idx of indices) {
        const candidates = correctionsByFrame.get(idx);
        if (candidates) {
            candidates.delete(content);
            if (candidates.size === 0) {
                correctionsByFrame.delete(idx);
            }
        }
    }
}

// Index all corrections that were received before frame 0 was available.
// Called once, immediately after frame 0 is first stored in contentRead.
function indexPendingCorrectionFrames() {
    const toIndex = [...pendingCorrectionFrames];
    for (const content of toIndex) {
        try {
            indexCorrectionFrame(content);
            pendingCorrectionFrames.delete(content);
        } catch (e) {
            // Still can't index — leave in pending.
        }
    }
}

// BFS-based recovery: given a set of frame indices that just became available,
// look up only the corrections that cover those frames (O(1) via correctionsByFrame),
// apply any correction where exactly one frame is now missing, and cascade to
// newly recovered frames.  O(k) total where k = number of applicable corrections.
function recoveryWithKnownFrames(initialFrameIndices) {
    const frameList = [];
    const queue = [...initialFrameIndices];
    const enqueued = new Set(initialFrameIndices);
    let head = 0;

    while (head < queue.length) {
        const frameIndex = queue[head++];
        const candidates = correctionsByFrame.get(frameIndex);
        if (!candidates || candidates.size === 0) continue;

        for (const content of [...candidates]) { // snapshot: we may delete from candidates during iteration
            let lossRate, index, from;
            [lossRate, index, from] = decodeCorrectionHeader(content);
            const indices = correctionIndices(lossRate, index);

            const missingIndices = indices.filter(idx => contentRead[idx] === undefined);
            if (missingIndices.length === 0) {
                removeStoredCorrectionFrame(content, indices);
                console.log("A stored correction frame removed as all the data is known");
            } else if (missingIndices.length === 1) {
                const missingIndex = missingIndices[0];
                const payload = content.slice(from);
                let xor = atob(payload);
                for (const idx of indices) {
                    if (idx !== missingIndex) {
                        xor = xorStrings(xor, contentRead[idx]);
                    }
                }
                const saveResult = saveFrame(xor);
                console.assert(missingIndex === saveResult.frame, `Frame index mismatch in recovered frame: expected ${missingIndex} but got ${saveResult.frame}`);

                removeStoredCorrectionFrame(content, indices);
                console.log("Used a stored correction frame to recover missing frame " + saveResult.frame);
                frameList.push(saveResult.frame);

                if (!enqueued.has(saveResult.frame)) {
                    enqueued.add(saveResult.frame);
                    queue.push(saveResult.frame);
                }
            }
            // else: 2+ still missing → leave in place; will be revisited when another frame arrives
        }
    }

    return frameList;
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
            let frames = recoveryWithKnownFrames([result.frame]);
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
        const contentFrame0PresentBefore = contentRead[0] !== undefined;
        let result = saveFrame(content);
        if (result.resultCode == FRAME_DECODED) {
            console.log("Read frame " + result.frame + " with content " + contentRead[result.frame]);

            if (result.frame == 0 && contentFrame0PresentBefore) {
                // Keep the frame 0 content after init()
                const contentFrame0 = contentRead[0];
                init();
                contentRead[0] = contentFrame0;

                persistClear()
                    .catch((e) => { console.error('persistClear failed', e); });
                persistSave(content)
                    .catch((e) => { console.error('persistSave failed', e); });
            }

            // Frame 0 just arrived: index any corrections that were stored while frame 0 was missing,
            // then seed BFS with all currently known frames so every newly indexable correction is tried.
            if (result.frame == 0 && pendingCorrectionFrames.size > 0) {
                indexPendingCorrectionFrames();
                const allKnownFrames = [];
                for (let i = 0; i < contentRead.length; i++) {
                    if (contentRead[i] !== undefined) allKnownFrames.push(i);
                }
                let frames = recoveryWithKnownFrames(allKnownFrames);
                return {resultCode: FRAME_DECODED, frame: result.frame, frames};
            }

            let frames = recoveryWithKnownFrames([result.frame]);
            return {resultCode: FRAME_DECODED, frame: result.frame, frames};
        } else if (result.resultCode == FRAME_ALREADY_KNOWN) {
            console.log("Read frame " + result.frame + " which was already known");
            return result;
        } else {
            throw Error("Unsupported result code " + result.resultCode);
        }
    }
}

function decodeHeader() {
    // Log when header decoded later than in first frame (with index 0)
    try {
        if (!headerDecoded) {
            let [hash, path, numberOfFrames] = getContentInfo();
            headerDecoded = true;
            if (!(1 == Object.keys(contentRead).length && contentRead[0] !== undefined)) {
                console.log("Header decoded");
            }
            self.postMessage({type: MSG_TYPE_METADATA, path, numberOfFrames});
        }
    } catch (e) {
        console.log("Cannot decode header. " + e.toString());
        // console.debug(e.stack);
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

// Return list of indices that are missing in contentRead (O(n) — direct slot check)
function getMissingFrames() {
    const missing = [];
    for (let i = 0; i < contentRead.length; i++) {
        if (contentRead[i] === undefined) {
            missing.push(i);
        }
    }

    return missing;
}

function constructData() {
    let [hash, path, dataURL] = decodeContent();

    if (hash !== hashSaved) {
        console.log("Constructed the entire content");

        const posComma = dataURL.indexOf(","); // Part before comma is mime type and encoding: data:text/plain;base64
        const b64 = dataURL.slice(posComma + 1);
        const fileContent = atob(b64);

        hashSaved = hash;
        return {save: true, data: fileContent, path};
    }
}

function createStatus() {
    return {
        receivedDataFramesCount: Object.keys(contentRead).length,
        receivedDataFrameMax: Math.max(...Object.keys(contentRead).map(Number)),
        unusedCorrectionFramesCount: unusedCorrectionFramesSet.size,
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

    decodeHeader();

    if (allFramesRead()) {
        let resultConstructData = constructData();
        if (resultConstructData?.save) {
            self.postMessage({
                type: MSG_TYPE_SAVE,
                data: resultConstructData.data,
                path: resultConstructData.path
            });

            // Don't clear persistence until a new file starts (frame 0 received).This is because the user may not save the file immediately.
        }
    }
}

/*
    Persisted storage
    =================
 */

// IndexedDB persistence for received scans so scanning can resume after stop.
// DB: 'cpqr-scan-cache', store: 'scanData', keyPath with autoIncrement
const PERSISTED_DB_NAME = 'cpqr-scan-cache';
const PERSISTED_DB_STORE = 'scanData';
const PERSISTED_DB_KEYPATH = 'content';

let persistReady = null;

function initPersistence() {
    if (persistReady) return persistReady;
    persistReady = new Promise((resolve, reject) => {
        const req = indexedDB.open(PERSISTED_DB_NAME, 1);
        req.onupgradeneeded = function (ev) {
            const db = ev.target.result;
            if (!db.objectStoreNames.contains(PERSISTED_DB_STORE)) {
                db.createObjectStore(PERSISTED_DB_STORE, {keyPath: PERSISTED_DB_KEYPATH});
            }
        };
        req.onsuccess = function (ev) {
            const db = ev.target.result;
            resolve(db);
        };
        req.onerror = function (ev) {
            console.error('IndexedDB open error', ev);
            // Resolve with null to allow operation without persistence
            resolve(null);
        };
    });
    return persistReady;
}

async function persistGetDB() {
    const db = await initPersistence();
    return db;
}

async function persistSave(scanData) {
    const db = await persistGetDB();
    if (!db) return;
    return new Promise((resolve, reject) => {
        const tx = db.transaction([PERSISTED_DB_STORE], 'readwrite');
        const store = tx.objectStore(PERSISTED_DB_STORE);
        store.put(scanData);
        tx.oncomplete = function () { resolve(true); };
        tx.onerror = function (e) { console.error('persistSave error', e); resolve(false); };
    });
}

async function persistLoad() {
    const db = await persistGetDB();
    if (!db) return [];
    return new Promise((resolve, reject) => {
        const tx = db.transaction([PERSISTED_DB_STORE], 'readonly');
        const store = tx.objectStore(PERSISTED_DB_STORE);
        const req = store.getAll();
        req.onsuccess = function (ev) { resolve(ev.target.result || []); };
        req.onerror = function (e) { console.error('persistLoad error', e); resolve([]); };
    });
}

async function persistClear() {
    const db = await persistGetDB();
    if (!db) return;
    return new Promise((resolve, reject) => {
        const tx = db.transaction([PERSISTED_DB_STORE], 'readwrite');
        const store = tx.objectStore(PERSISTED_DB_STORE);
        const req = store.clear();
        req.onsuccess = function () { resolve(true); };
        req.onerror = function (e) { console.error('persistClear error', e); resolve(false); };
    });
}

/*
    Timing Tests
    ============
    Measure the performance of the hot-path algorithms before and after the optimization.
    The tests run entirely inside the worker (where the algorithms live) to avoid
    postMessage overhead skewing the numbers.
 */

// Synthetic correction-frame string: starts with 'C', unique per index (so includes() cannot
// short-circuit early), ~CORRECTION_STRING_LENGTH chars to mimic real frame strings.
const CORRECTION_STRING_LENGTH = 1000;
function makeSyntheticCorrection(i) {
    // Index encoded at positions 1-7 so strings differ early but are still realistic length.
    return 'C' + String(i).padStart(6, '0') + 'A'.repeat(CORRECTION_STRING_LENGTH - 7);
}

function runTimingTests() {
    console.log("[Timing] Starting timing tests in worker...");
    const results = [];

    // -------------------------------------------------------------------------
    // Test 1 — recoveryWithKnownFrames()  (replaces old recoveryWithUnusedCorrectionFrames)
    //
    // Old worst-case scenario: k stored corrections, frame 0 absent → O(k²) full scan.
    // New algorithm: corrections are in pendingCorrectionFrames (not indexed), so
    //   correctionsByFrame is empty → O(1) per call regardless of k.
    // -------------------------------------------------------------------------
    const storedCorrectionCounts = [10, 100, 500, 1000, 5000, 10000];
    const RUNS_RECOVERY = 10000; // large run count needed: each call is now O(1) → sub-microsecond

    for (const k of storedCorrectionCounts) {
        const savedContentRead = contentRead;
        const savedUnusedSet = unusedCorrectionFramesSet;
        const savedCorrectionsByFrame = correctionsByFrame;
        const savedPending = pendingCorrectionFrames;

        contentRead = [];                   // frame 0 absent → indexCorrectionFrame() throws
        unusedCorrectionFramesSet = new Set();
        correctionsByFrame = new Map();
        pendingCorrectionFrames = new Set();
        for (let i = 0; i < k; i++) {
            const c = makeSyntheticCorrection(i);
            unusedCorrectionFramesSet.add(c);
            pendingCorrectionFrames.add(c);  // not indexed yet
        }

        // Warm-up pass
        recoveryWithKnownFrames([1]);

        const t0 = performance.now();
        for (let r = 0; r < RUNS_RECOVERY; r++) {
            // correctionsByFrame is empty so lookup is O(1), array unchanged between runs.
            recoveryWithKnownFrames([1]);
        }
        const t1 = performance.now();

        results.push({
            test: 'recoveryWithKnownFrames',
            storedCorrectionCount: k,
            durationMs: (t1 - t0) / RUNS_RECOVERY
        });

        contentRead = savedContentRead;
        unusedCorrectionFramesSet = savedUnusedSet;
        correctionsByFrame = savedCorrectionsByFrame;
        pendingCorrectionFrames = savedPending;
    }

    // -------------------------------------------------------------------------
    // Test 2 — getMissingFrames()
    //
    // Scenario: contentRead is a sparse JS array with n slots and m missing entries
    // (every 10th frame missing, 10% loss).  Current implementation uses
    //   Array.includes() inside a for-loop → O(n²).
    // -------------------------------------------------------------------------
    const frameCounts = [100, 500, 1000, 5000, 10000/*, 50000, 100000*/];
    const RUNS_MISSING = 100;
    const LOSS_RATE = 0.1;
    const MISSING_EVERY_NTH = Math.round(1 / LOSS_RATE); // every Nth frame is missing

    for (const n of frameCounts) {
        const savedContentRead = contentRead;
        const m = Math.floor(n / MISSING_EVERY_NTH);

        contentRead = [];
        for (let i = 0; i < n; i++) {
            if (i % MISSING_EVERY_NTH !== 0) {
                contentRead[i] = 'dummy';
            }
        }

        // Warm-up
        getMissingFrames();

        const t0 = performance.now();
        for (let r = 0; r < RUNS_MISSING; r++) {
            getMissingFrames();
        }
        const t1 = performance.now();

        results.push({
            test: 'getMissingFrames',
            frameCount: n,
            missingCount: m,
            durationMs: (t1 - t0) / RUNS_MISSING
        });

        contentRead = savedContentRead;
    }

    console.log("[Timing] Tests done, posting results.");
    self.postMessage({ type: MSG_TYPE_TIMING_RESULT, results });
}

addPersistedDataToQueue();

