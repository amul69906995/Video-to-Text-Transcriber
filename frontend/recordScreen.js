
//console.log("looks good recordScreen file is served in index.html");

//the flow would we getuserMedia then get audio stream and video stream
//we will just store in user local memory (for efficiency if need we can just take audio stream and stor in momery if they dont need video just transcription)
//and then on click of transcribe i will stop recording and send vedio then the rest i coded in(videotranscribe.js take file path)

const record_screen = document.querySelector('#record_screen');
const stop_recording = document.querySelector('#stop_recording');
let mediaRecorder;
let stream;
let chunks = [];

const getFeed = async () => {
    const constraints = { video: true, audio: true };
    try {
        console.log("constraints", constraints)
        stream = await navigator.mediaDevices.getDisplayMedia(constraints);
        const track = stream.getTracks();
        console.log("track", track)
    } catch (e) {
        console.log("error inside getusermedia", e);
    }
}
const startRecording = async () => {
    try {
        await getFeed();
        if (!stream) {
            console.log("stream is null");
            return
        }
        mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.start();
        mediaRecorder.onstart = (e) => {
            console.log("recording started");
        }
        mediaRecorder.ondataavailable = (event) => {
            console.log("ondataavailable",event)
            if (event.data && event.data.size > 0) {
                chunks.push(event.data);
            };

        }
        mediaRecorder.onstop = async (e) => {
            e.preventDefault();
            const blob = new Blob(chunks, { type: 'video/webm' });
            const file = new File([blob], 'recording.webm', { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            const videoElement = document.createElement('video');
            videoElement.src = url;
            videoElement.controls = true; // Add controls for playback
            document.body.appendChild(videoElement);
            const videoBlob = new Blob(chunks, { type: 'video/webm' });
            const videoUrl = URL.createObjectURL(videoBlob);
            const videoA = document.createElement('a');
            videoA.href = videoUrl;
            videoA.download = 'recording.webm';
            videoA.click();
            videoA.remove();
            // Creating a FormData object to send the file to the backend
            const formData = new FormData();
            formData.append('file', file);
        
            try {
                const response = await fetch('http://localhost:5400/transcribe-video', {
                    method: 'POST',
                    body: formData,
                });
        
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
        
                const result = await response.json();
                console.log('File uploaded successfully', result);
        
                // Download transcription file
                // const a = document.createElement('a');
                // a.href = result.downloadUrl;
                // a.download = 'transcription.txt';
                // a.click();
                // a.remove();
        
                // Download recorded video

        
            } catch (error) {
                console.error('Error uploading file:', error);
            }
        
            // Clear chunks
            chunks = [];
        };
        
    } catch (e) {
        console.log("error inside startRecording", e);
    }
}
const stopRecording = () => {
    if (mediaRecorder.state !== 'inactive'){
        mediaRecorder.stop();
        stream.getTracks().forEach(track => track.stop()); // Stop tracks
    }
}

record_screen.addEventListener('click', (e) => {
    startRecording();
    console.log("recording started");
})
stop_recording.addEventListener('click', (e) => {
    stopRecording();
    console.log("recording stopped");
})