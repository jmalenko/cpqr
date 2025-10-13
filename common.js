/*
    Constants
    =========
 */

// Messages with worker
// scan.js --> scanWorker.js
const MSG_TYPE_INIT = 'init';
const MSG_TYPE_TESTS = 'tests';
const MSG_TYPE_SCAN = 'scan';
// scan.js <-- scanWorker.js
const MSG_TYPE_QUEUED = "queued";
const MSG_TYPE_PROCESSED = "processed";
const MSG_TYPE_ERROR = "error";
const MSG_TYPE_SAVE = "save";

// QR data processing result codes
const FRAME_DECODED = 1;
const CORRECTION_DECODED = 2;
const CORRECTION_IMPOSSIBLE_MORE_FRAMES_MISSING = 3;
const CORRECTION_ALL_DATA_KNOWN = 4;
const CORRECTION_IMPOSSIBLE_MORE_FRAMES_MISSING_DUPLICATE = 5;
const FRAME_ALREADY_KNOWN = 6;

/*
    Common Functions
    ================
 */

function formatDate(date, showMillis) {
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

    return year + "-" + month + "-" + day + " " + hours + ':' + minutes + ':' + seconds + (showMillis === undefined || showMillis ? "." + millis : "");
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
    let i, l,
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

function measureTimeMs(fn) {
    const start = new Date();
    fn();
    const end = new Date();
    return end - start;
}

function createMeasureTime() {
    const stats = {count: 0, sum: 0, sumSq: 0};
    return function (fn) {
        const start = new Date();
        fn();
        const end = new Date();
        const ms = end - start;

        stats.count++;
        stats.sum += ms;
        stats.sumSq += ms * ms;

        const avg = stats.sum / stats.count;
        const variance = stats.count > 1
            ? (stats.sumSq - stats.sum * stats.sum / stats.count) / (stats.count - 1)
            : 0;
        const stddev = Math.sqrt(variance);

        return {ms, avg, stddev};
    };
}

function createMeasureInterval() {
    let lastTime = null;
    const stats = {count: 0, sum: 0, sumSq: 0};

    return function () {
        const now = Date.now();
        let result = {};
        if (lastTime !== null) {
            const ms = now - lastTime;

            stats.count++;
            stats.sum += ms;
            stats.sumSq += ms * ms;

            const avg = stats.sum / stats.count;
            const variance = stats.count > 1
                ? (stats.sumSq - stats.sum * stats.sum / stats.count) / (stats.count - 1)
                : 0;
            const stddev = Math.sqrt(variance);

            result = {ms, avg, stddev};
        }
        lastTime = now;
        return result;
    };
}

function assertEqual(testName, a, b) {
    if (typeof a !== typeof b) {
        log("Test " + testName + " error: Have different types: got " + typeof a + " but expected " + typeof b);
        throw new Error("Test " + testName + " error: Arrays have different lengths: got " + a.length + " but expected " + b.length);
    }
    if (a instanceof Array) {
        if (a.length !== b.length) {
            log("Test " + testName + " error: Arrays have different lengths: got " + a.length + " but expected " + b.length);
            throw new Error("Test " + testName + " error: Arrays have different lengths: got " + a.length + " but expected " + b.length);
        }
        for (let i = 0; i < a.length; i++)
            if (a[i] !== b[i]) {
                log("Test " + testName + " error: Not equal at index " + i + ": got " + a[i] + " but expected " + b[i]);
                throw new Error("Test " + testName + " error: Not equal at index " + i + ": got " + a[i] + " but expected " + b[i]);
            }
    } else if (a !== b && typeof a === "string") {
        let diffIndex = -1;
        for (let i = 0; i < Math.max(a.length, b.length); i++) {
            if (a[i] !== b[i]) {
                diffIndex = i;
                break;
            }
        }
        log("Test " + testName + " error: Strings differ at index " + diffIndex);
        log("Got:      " + a);
        log("Expected: " + b);
        if (diffIndex !== -1) {
            log("          " + " ".repeat(diffIndex) + "^");
        }
        if (a.length !== b.length) {
            log("Strings have different lengths: got " + a.length + " but expected " + b.length);
        }
        throw new Error("Test " + testName + " error: Strings differ at index " + diffIndex);
    } else if (a !== b) {
        log("Test " + testName + " error: Not equal: got " + a + " but expected " + b)
        throw new Error("Test " + testName + " error: Not equal: got " + a + " but expected " + b)
    }
}

function log(str) {
    const MAX_LINES = 100;

    // TODO Hotfix - replace log() with console.log() in worker
    if (typeof document === "undefined") {
        console.log(str);
        return;
    }

    const date = new Date();
    const el = document.getElementById("log");
    const logLine = "[" + formatDate(date) + "] " + str;
    const lines = (el.innerHTML ? el.innerHTML.split('\n') : []);
    lines.unshift(logLine);
    el.innerHTML = lines.slice(0, MAX_LINES).join('\n');
}
