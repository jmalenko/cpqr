# cpqr

cpqr transfers files between two computers.

This is a proof of concept of a method to transfer of data between two [air gapped](https://en.wikipedia.org/wiki/Air_gap_(networking)) computers. Typically, the source computer is a computer with a file that is displayed on the display as a sequence of QR codes and the target computer is a mobile device that records the sequence of QR codes, decodes it and saves the file once the transfer completes.

The following image summarizes the data flow starting with 1. a file existing on source device to be transfered, 2. QR code on the source device displyed in the show.html page, 3. a camera recording the displayed QR code is used on target device, and 4. when the complete file is received the file is saved at the target device.


## Try it

1. Setup the target device, which will use the camera to scan the sequence of QR codes.
 
   Use [scan.html](https://jmalenko.github.io/cpqr/scan.html) on a smart phone with camera. Point the camera at the screen of source computer and wait. Once the file is transfered, it will be saved.

2. On the source computer, which initially contains a file, show the sequence of QR codes that encode the file content.

   Use [show.html](https://jmalenko.github.io/cpqr/show.html), open a file to be transferred.

## Further development

1. Currently, the QR codes encoding the file are shown in rounds. (In fact, there is a little improvement: the content encoded in one QR code a round is actually encoded by two QR codes in the next round.) A smart person could propose a better algorithm for the sender (without any inputs; specifically, the sender may not be aware of the unreceived QR codes).

2. On target, keep progress in blob to improve reliability. The current limit for blob is 5 MB (maybe split to files that can be merged by Total Commander).
   
3. Transfer multiple files. See https://developer.mozilla.org/en-US/docs/Using_files_from_web_applications

4. On source, estimate the best parameters for QR density vs duration (for which one QR code is displayed). 

4. On target, estimate the transfer duration.



## Licence

This software is distributed under the BSD license.


## Used Libraries

QRCode.js
	https://github.com/davidshimjs/qrcodejs/

Instascan
	https://github.com/schmich/instascan
