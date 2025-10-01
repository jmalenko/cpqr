# cpqr

cpqr transfers files between two computers.

This is a proof of concept of a method to transfer of data between two [air gapped](https://en.wikipedia.org/wiki/Air_gap_(networking)) computers. Typically, the source computer is a computer with a file that is displayed on the display as a sequence of QR codes and the target computer is a mobile device that records the sequence of QR codes, decodes it and saves the file once the transfer completes.

The following image summarizes the data flow starting with 1. a file existing on source device to be transferred, 2. QR code on the source device displayed in the show.html page, 3. a camera recording the displayed QR code is used on target device, and 4. when the complete file is received the file is saved at the target device.

![Architecture diagram](https://github.com/jmalenko/cpqr/raw/master/architecture.png "Architecture diagram")


## Try it

1. Set up the target device, which will use the camera to scan the sequence of QR codes.
 
   Use [scan.html](https://jmalenko.github.io/cpqr/scan.html) on a smartphone with camera. Point the camera at the screen of source computer and wait. Once the file is transferred, it will be saved.

2. On the source computer, which initially contains a file, show the sequence of QR codes that encode the file content.

   Use [show.html](https://jmalenko.github.io/cpqr/show.html), open a file to be transferred.


## Further development

1. Currently, the QR codes encoding the file are shown in rounds. Then, correction frames are sent using Progressive Forward Error Correction (PFEC).

2. On target, keep progress in a blob to improve reliability. The current limit for blob is 5 MB (maybe split to files that can be merged by Total Commander).
   
3. Transfer multiple files. See https://developer.mozilla.org/en-US/docs/Using_files_from_web_applications

4. On source, estimate the best parameters for QR density vs duration (for which one QR code is displayed). 


## Licence

This software is distributed under the BSD license.


## Used Libraries

- [QRCode.js](https://github.com/davidshimjs/qrcodejs) for generating the QR code.

- [jsQR](https://github.com/cozmo/jsQR) for reading the QR code.
	
