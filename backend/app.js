import express from 'express';
import multer from 'multer';
import path from 'node:path'
const app = express();
const port = 5400;
import { transcribeVideoFile } from './videoTranscript.js';
import cors from 'cors';
import fs from 'node:fs/promises'
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname)); // Unique filename with extension
  }
});

const upload = multer({ storage: storage });


app.use(express.json());
//cors config
app.use(cors())

//helper 

async function deleteFile(filePath) {
  try {
    await fs.unlink(filePath); // Waits for the file to be deleted
    console.log(`File at ${filePath} deleted successfully`);
  } catch (error) {
    console.error(`Error deleting file at ${filePath}:`, error.message);
  }
}
//test route
app.post('/test', (req, res) => {
  console.log(req.body)
  res.status(200).json({ "downloadUrl":"sfdgfhjmkl;jgkhdf"});

})
// Route to receive and process the video file
app.post('/transcribe-video', upload.single('file'), async (req, res) => {
  try {
    const videoFile = req.file;
    console.log(videoFile);
    if (!videoFile) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    const filePath = path.resolve('uploads', videoFile.filename);
    console.log(filePath)
    console.log(filePath, videoFile.size);
    const downloadUrl = await transcribeVideoFile(filePath, videoFile.size); // Pass filePath and file size
    console.log(downloadUrl, "this is download url")
    //remove file from uploads folder filepath
    await deleteFile(filePath)
    res.status(200).json({ "downloadUrl": downloadUrl });
  } catch (error) {
    console.error('Error in transcribing video:', error);
    res.status(500).json({ message: 'Error processing video' });
  }
});

app.listen(port, () => {
  console.log('Server is running on port 5400');
});
