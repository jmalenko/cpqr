/*
    Common Functions
    ================
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

    const date = new Date();
    const el = document.getElementById("log");
    const logLine = "[" + formatDate(date) + "] " + str;
    const lines = (el.innerHTML ? el.innerHTML.split('\n') : []);
    lines.unshift(logLine);
    el.innerHTML = lines.slice(0, MAX_LINES).join('\n');
}
