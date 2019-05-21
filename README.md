# cpqr

cpqr transfers files between two computers.

This is a proof o concept of a transfer of data between two [air gapped](https://en.wikipedia.org/wiki/Air_gap_(networking)) computers. Typically, the source computer is a computer with secret information that is displayed on the display as a sequence of QR codes and the target computer is a mobile device that records the qr codes, decodes them and saves the file once itc complete.

## Try it

1. Setup the target device, which will use the camera to scan the sequence of QR codes.
 
   Use [scan.html](https://jmalenko.github.io/cpqr/scan.html) on a smart phone with camera. Point the camera at the screen of source computer and wait. Once the file is transfered, it will be saved.

2. On the source computer, which initially contains a file, show the sequence of QR codes that encode the file content.

   Use [show.html](https://jmalenko.github.io/cpqr/show.html), open a file to be transferred.


## How it works (old version)

0. You have to clone the repository and put it on the source and target computers.

   `git clone https://github.com/jmalenko/cpqr.git` 

   Alternative 1: You can download the repository as [ZIP](https://github.com/jmalenko/cpqr/archive/master.zip) archive. Unzip is usually available on computers without git.
   
   Alternative 2: I'm aware the best beginning would be to anchor the links directly to the Git Hub URL. However, that was not possible (and I was unable to make it work with [http://htmlpreview.github.io/](http://htmlpreview.github.io/))   

1. On the target computer, scan the sequence of QR codes and write the decoded content to a file.
 
   Use [scan.html](scan.html) on a smart phone with camera. Point the camera at the screen of source computer and wait till the file is transfered.

2. On the source computer, show the sequence of QR codes that encode the file content.

   Use [show.html](show.html), open a file to be transferred.
    

## Further development

1. Currently, the QR codes encoding the file are shown in rounds. (In fact, there is a little improvement: the content encoded in one QR code a round is actually encoded by two QR codes in the next round.) A smart person could propose a better algorithm for the sender (without any inputs; specifically, the sender may not be aware of the unreceived QR codes).

2. To improved reliability, keep progress in blob (in show.html). The current limit for blob is 5 MB (maybe split to files that can be merged by Total Commander).
   
3. Transfer multiple files. See https://developer.mozilla.org/en-US/docs/Using_files_from_web_applications


### Licence

This software is distributed under the BSD license.


### Used Libraries

QRCode.js
	https://github.com/davidshimjs/qrcodejs/

Instascan
	https://github.com/schmich/instascan
