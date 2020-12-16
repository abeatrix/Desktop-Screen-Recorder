// IMPORTS
const { desktopCapturer, remote } = require('electron');
const dialog = require('electron').remote.dialog
//  From v9 version, we are not allowed to use remote on the renderer unless set the enableRemoteModule as true.
const { Menu } = remote; //handle inter-process communication (IPC), but also allow us to build internal menu
// write file to system after video is recorded and save
const { writeFile } = require("fs");

// Video Element
const videoElement = document.querySelector("video");
const displayText = document.querySelector("p");

// START BUTTON
const startBtn = document.getElementById("startBtn");
startBtn.onclick = e => {
  mediaRecorder.start();
  startBtn.classList.add("is-danger");
  startBtn.innerText = "Recording";
  displayText.innerText = "Recording..."
};

// STOP BUTTON
const stopBtn = document.getElementById('stopBtn');

stopBtn.onclick = e => {
  mediaRecorder.stop();
  startBtn.classList.remove("is-danger");
  startBtn.innerText = "🎥Start";
  displayText.innerText = "Select a Video Source"
};

// SELECT BUTTON
const selectBtn = document.getElementById('selectBtn');
selectBtn.onclick = e => {
    getVideoSources();
    displayText.innerText = "Click Start to begin recording.";
};

// Get available video sources on screen to record
// ref: https://www.electronjs.org/docs/api/structures/desktop-capturer-source
async function getVideoSources() {
    const inputSources = await desktopCapturer.getSources({
      types: ['window', 'screen']
    });

    const videoOptionsMenu = Menu.buildFromTemplate(
      inputSources.map(source => {
        //   console.log(source)
        return {
          label: source.name,
          click: () => selectSource(source)
        };
      })
    );


    videoOptionsMenu.popup();
  }


// VIDEO RECORDING

//Global Variable for screen recording:
let mediaRecorder; //browser built-in media recorder instance to capture videos
const recordedClips = [];

// Change the videoSource window to record before stream
async function selectSource(source) {
    selectBtn.innerText = "Source: " + source.name;

  const constraints = {
      audio: false,
      video: {
          mandatory: {
              chromeMediaSource: "desktop",
              chromeMediaSourceId: source.id
          }
      }
  }

  // Create a Stream

  const stream = await navigator.mediaDevices.getUserMedia(constraints);

  // Preview the source in video element
  videoElement.srcObject = stream;
  videoElement.play();

  // Media Recorder
  const options = { mimeType: "video/webm; codecs=vp9"};
  mediaRecorder = new MediaRecorder(stream, options);

  // Register Event Handlers (event controlling by users)
  mediaRecorder.ondataavailable = handleDataAvailable;
  mediaRecorder.onstop = handleStop;

};


// Captures all recorded parts
function handleDataAvailable(e) {
    displayText.innerText = "Saving..."
    recordedClips.push(e.data);
}

// Save recorded parks to a video file on stop
async function handleStop(e){
    // blob is a data structure to handle raw data like video files
    const blob = new Blob(recordedClips, {
        type: 'video/webm; codecs=vp9'
    });

    // buffer is also an object for representing raw data
    const buffer = Buffer.from(await blob.arrayBuffer());

    // create native dialog for save and open file
    const { filePath } = await dialog.showSaveDialog({

        buttonLabel: "Save video",
        defaultPath: `screen-${Date.now()}.webm`
    });

    console.log(filePath);
    // when data is available to save, write file. buffer is the argument for raw data
    if (filePath) {
        writeFile(filePath, buffer, () => displayText.innerText = "File Saved Successfully!");
      }

}
