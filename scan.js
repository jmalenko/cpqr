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


/*
    Tests & Simulation
    ==================
 */

const testFrames = [
    '110111217C:\\fakepath\\a.txt279data:text/plain;bas',
    '111e64,SmVkbmEsDQpEdsSbLg0KVMWZaQ0KxJvFocSNxZnFv',
    '112sO9w6HDrcOpDQo='
];

let frameSimulated = 0;

function scanSimulated() {
    if (frameSimulated >= testFrames.length)
        return;

    onScan(testFrames[frameSimulated]);
    // Send the first frame as last
    // if (frameSimulated == 0) onScan(testFrames[1]);
    // if (frameSimulated == 1) onScan(testFrames[2]);
    // if (frameSimulated == 2) onScan(testFrames[0]);

    frameSimulated++;
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
    }
    else if (a !== b) {
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
    Main content
    ============
 */

let contentRead = [];

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
    let [, indexStr, from] = decodeWithLength(content, 0);
    const contentFrame = content.substr(from);

    const index = Number(indexStr);
    return [index, contentFrame];
}

function getContent() {
    let content = "";
    let missing = [];

    for (let i = 0; i < contentRead.length; i++) {
        if (typeof contentRead[i] === "undefined") {
            missing.push(i);
        }
        content += contentRead[i];
    }

    if (0 < missing.length) {
        log("Missing frames " + missing);
        throw new Exception("Missing frames " + missing);
    }

    return content;
}

function decodeContent() {
    const content = getContent();
    let length, from = 0;
    let versionStr, fileName, data;

    [length, versionStr, from] = decodeWithLength(content, from);
    let version = Number(versionStr);
    if (version !== 1)
        throw new Exception("Unsupported version " + version);

    [length, fileName, from] = decodeWithLength(content, from);

    [length, data, from] = decodeWithLength(content, from);

    if (length !== data.length)
        throw new Exception("Not all data");

    return [fileName, data];
}

function getContentInfo() {
    // Copy of decodeContent() that uses only the first frame

    // TODO Assumption: data start in the first (with counted from 0) frame

    const content = contentRead[0];
    let length, from = 0;
    let versionStr, fileName, data;

    [length, versionStr, from] = decodeWithLength(content, from);
    let version = Number(versionStr);
    if (version !== 1)
        throw new Exception("Unsupported version " + version);

    [length, fileName, from] = decodeWithLength(content, from);

    [length, data, from] = decodeWithLength(content, from);

    // End of copy of decodeContent()

    const capacityForDataInOneFrame = contentRead[0].length - 3; // We know that the first frame has frame number: 1 1 0
    const numberOfFrames = Math.ceil(length / capacityForDataInOneFrame) + 1;

    return [fileName, numberOfFrames];
}

function onScan(content) {
    console.log("READ: " + content);
    // log("READ: " + content);

    try {
        // Save frame
        let [index, contentFrame] = decodeFrameContent(content);
        log("Read frame index " + index + "; " + contentFrame);
        contentRead[index] = contentFrame;

        if (index === 0) {
            let [fileName, numberOfFrames] = getContentInfo();
            log("File name = " + fileName);
            log("Frames = " + numberOfFrames);
        }

        // If all frames then save
        try {
            let [fileName, dataURL] = decodeContent();
            log("Got all frames");
            log("File name = " + fileName);
            log("Data = " + dataURL);

            const posSlash = fileName.lastIndexOf("\\");
            const fileNameLast = fileName.substr(posSlash + 1);

            const posComma = dataURL.indexOf(",");
            const b64 = dataURL.substr(posComma + 1);
            const fileContent = atob(b64);

            log("Downloading as " + fileNameLast);
            download(fileContent, fileNameLast, 'text/plain');

            // Cleanup
            contentRead = [];
        } catch (e) {
            // Nothing - the dataURL is not complete yet
        }
    } catch (e) {
        log("Error processing frame: " + content);
        log(e);
    }
}

function init() {
    let scanner = new Instascan.Scanner({video: document.getElementById('preview')});

    scanner.addListener('scan', onScan);
    Instascan.Camera.getCameras().then(function (cameras) {
            if (cameras.length > 0) {
                log("Found " + cameras.length + " cameras.");
                for (let i = 0; i < cameras.length; i++) {
                    log("Camera " + i + ": " + cameras[i].name);
                }

                let camera;

                let url = new URL(window.location.href);
                let c = url.searchParams.get("c");
                if (c !== null) {
                    camera = cameras[c];
                } else {
                    if (cameras.length > 1)
                        log("Using the last camera. You can override this by adding parameter c to URL, example: ?c=0");

                    camera = cameras[cameras.length - 1];
                }
                scanner.start(camera);
            }
            else {
                log('No cameras found.');
            }
        }
    ).catch(function (e) {
        log(e);
    });

    tests();

    // scanSimulated();

    // Hack: flip video vertically
    const video = document.getElementById("preview");
    video.style.cssText = "transform: scale(1, 1);";
}
