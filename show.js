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
    el.innerHTML = "[" + formatDate(date) + "] " + str + "\n" + el.innerHTML;
}

/*
    Tests
    =====
 */

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

/**
 * Produces a string that can nicely ne used in testing as it encodes the position in the string.
 * @param length
 * @returns {string}
 */
function stringOfLength(length) {
    let str = "";
    for (let i = 0; i <= length; i += 10) {
        str += i.toString();
        const lengthN = getNumberLength(i);
        str += new Array(10 - lengthN + 1).join('.');
    }
    return str.substring(0, length);
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


    // assertEqual("Number of frames 0", getNumberOfFrames(stringOfLength(0)), 1);
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
Format of Content
=================

     Field		    Example field								                        Example with Variable-length quantity
  ------------------------------------------------------------------------------------------------------------------------------------------------------------
  1. Version		1									                                1  1 1
  2. File name		in.txt									                            1  6 in.txt
  4. Data		    data:text/plain;base64,VGVzdCBmaWxlDQpTZWNvbmQgcm93Lg0KVGhpcmQh		2 63 data:text/plain;base64,VGVzdCBmaWxlDQpTZWNvbmQgcm93Lg0KVGhpcmQh

Format of one frame
===================

     Field		    Example field       Example with Variable-length quantity
  -----------------------------------------------------------------------------------------------------------------------------------
  1. Frame number	1					1 1 1
  2. Content	    Text	            1 4 Text


Variable-length quantity
========================

Encoding that encodes a value with a triple:
1. length of "length of value" }must be one character in this implementation)
2. length of value
3. value


QR Codes
========

The QR code can contain maximum of 177 by 177 blocks (squares).

QR codes have three parameters: Datatype, size (number of 'pixels') and error correction level. How many information can
be stored there also depends on these parameters.

The maximum size and the lowest error correction give the following values:
Numeric only Max. 7,089 characters
Alphanumeric Max. 4,296 characters
Binary/byte Max. 2,953 characters (8-bit bytes)
*/

const capacityTotal = 300; // 7089 Numeric only,  4296 Alphanumeric, 2953 Binary/byte (8-bit bytes)
const capacityForDataInOneFrame = capacityTotal - 5; // -1 for length of length, -4 for length up to 7089

const version = 1;

const speed = 1; // duration between frames, in milliseconds. Note that time for generating the QR code is not included in this value

var fileName;
var data;

var frame = -1; // From 0. The frames from 0 to frames have been shown.
var missingFrames = []; // Contains the frames to show as soon as possible. The frames with index frame.. will be shown afterwards.

var qrcode;

function init() {
    const scale = 4.5;
    qrcode = new QRCode("qrcode", {
        width: scale * 177,
        height: scale * 177,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.L
    });

    tests();
}

function openFile(event) {
    const input = event.target;
    const reader = new FileReader();
    reader.fileName = input.value;
    reader.onload = function () {
        const dataURL = reader.result;
        // In reader.readAsText() was called:
        //    String (probably in UTF-8)

        // If reader.readAsDataURL() was called:
        //    Base64 encoded
        //    Example: data:text/plain;base64,VGVzdCBmaWxlDQpTZWNvbmQgcm93Lg0KVGhpcmQh
        // alert(dataURL);

        // For Internet Explorer
        // pos = dataURL.indexOf(",");
        // b64 = dataURL.substring(pos + 1);
        //alert(b64);
        //alert(atob(b64));

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
    // const length =
    //     typeof obj === "string" ? obj.length :
    //     typeof obj === "number" ? getNumberLength(obj) : throw Error("Unsupported type");

    const lengthOfLength = getNumberLength(length);
    if (9 < lengthOfLength)
        throw Error("Too long length of length");

    return lengthOfLength.toString() + length.toString() + obj;
}

function getContent() {
    let content = "";

    content += encodeWithLength(version);
    content += encodeWithLength(fileName);
    content += encodeWithLength(data);

    return content;
}

function getNumberOfFrames() {
    return Math.ceil(getContent().length / capacityForDataInOneFrame);
}

function getFrameContent(index) {
    const data = getContent();
    const contentFrom = index * capacityForDataInOneFrame;
    const contentTo = contentFrom + capacityForDataInOneFrame;
    const contentFrame = data.substring(contentFrom, contentTo);

    let content = "";

    // content += encodeNumberWithLength(index);
    content += encodeWithLength(index);
    content += contentFrame;

    return content;
}

function show(fileName, data) {
    this.fileName = fileName;
    this.data = data;

    log("File name = " + fileName);
    log("Data = " + data);
    // log("Data as bytes = " + toByteArray(data))
    log("Content = " + getContent());
    log("Speed = " + speed + " ms");
    // log("Content as bytes = " + toByteArray(getContent()))

    log("Frames = " + getNumberOfFrames());
    for (let frame = 0; frame < frames; frame++) {
        log("Frame " + frame + ": " + getFrameContent(frame));
    }

    onPlay();
}

function onPlay() {
    log("Start");

    // Show the QR code
    const el = document.getElementById("qrcode");
    el.style.visibility = "visible";

    showFrame();
}

function onShowFrame(frame) {
    log("Frame " + frame + ": " + getFrameContent(frame));

    const frameContent = getFrameContent(frame);
    qrcode.makeCode(frameContent);
}

function onEnd() {
    log("Finished");

    // TODO Hide the QR code - the following should work (and the hiding/showing of element should be removed)
    // qrcode.clear();

    // Hide the QR code
    const el = document.getElementById("qrcode");
    el.style.visibility = "hidden";
}

function showFrame() {
    let f;
    if (0 < missingFrames.length) {
        // log("Missing frames are " + missingFrames);
        f = missingFrames.shift();
    } else {
        frame++;

        if (frame >= getNumberOfFrames()) {
            onEnd();
            return;
        }

        f = frame;
    }

    onShowFrame(f);

    setTimeout(showFrame, speed);
}

function onMissingFramesChange(event) {
    if (event.keyCode === 13) {
        const el = document.getElementById("missing");

        const missingStr = el.value;
        const missingFramesNew = missingStr.split(/[,\. ]+/);

        log("Add to missing: " + missingFramesNew);
        // Add to missing frames to show
        let missingFramesWithDuplicates = missingFrames.concat(missingFramesNew);
        // Remove duplicates
        missingFrames = missingFramesWithDuplicates.filter(function (item, pos, a) {
            return a.indexOf(item) === pos;
        });
    }
}