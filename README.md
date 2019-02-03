# cpqr

cpqr transfers files between two computers.

This is a proof o concept of a transfer of data between two [air gapped](https://en.wikipedia.org/wiki/Air_gap_(networking)) computers. Typically, the source computer

## How it works

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

2. On target, keep progress in blob to improve reliability. The current limit for blob is 5 MB (maybe split to files that can be merged by Total Commander).
   
3. Transfer multiple files. See https://developer.mozilla.org/en-US/docs/Using_files_from_web_applications

4. On source, estimate the best parameters for QR density vs duration (for which one QR code is displayed). 

4. On target, estimate the transfer duration.


### Licence

This software is distributed under the BSD license.


### Used Libraries

QRCode.js
	https://github.com/davidshimjs/qrcodejs/

Instascan
	https://github.com/schmich/instascan
