import AWS from "aws-sdk";
import fs from "fs";
import axios from "axios";

let videoId = null;
let converting = false;
let transcribFileId = null;

const getAwsUrl = "https://convertor-backend.restream.io/public/uploads";
const transcribeUrl = "https://convertor-backend.restream.io/public/conversions";
const headers = {
  "x-re-caller-app": "public-frontend",
  "x-re-request-id": "1e4b0257-40a2-4afd-9dec-680d9b22a025",
};

// Function to get AWS credentials
const getAwsCredentials = async (size) => {
  try {
    const response = await axios.post(getAwsUrl, { fileSizeBytes: size }, { headers });
    return response.data;
  } catch (e) {
    console.error("Error fetching AWS credentials:", e.message);
    return null;
  }
};

// Function to upload the file to S3
const uploadToS3 = async (credentials, destination, filePath) => {
  try {
    const s3 = new AWS.S3({
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
      sessionToken: credentials.sessionToken,
      region: destination.region,
    });

    const fileStream = fs.createReadStream(filePath);

    const params = {
      Bucket: destination.bucket,
      Key: destination.filename,
      Body: fileStream,
    };

    const result = await s3.upload(params).promise();
    console.log("File uploaded successfully:", result);

    return result.Location;
  } catch (err) {
    console.error("Error uploading to S3:", err.message);
  }
};

// Function to finalize the upload
const finishPost = async (videoId) => {
  const finishPostUrl = `https://convertor-backend.restream.io/public/uploads/${videoId}/finish`;
  try {
    await axios.post(finishPostUrl, {}, { headers });
  } catch (e) {
    console.error("Error in finishPost");
  }
};

const transcribeVideo = async (videoId) => {
  const transcribeBody = {
    output: "txt",
    uploadId: videoId,
  };
  try {
    const { data } = await axios.post(transcribeUrl, transcribeBody, { headers });
    return data;
  } catch (e) {
    console.error("Error in transcribeVideo", e?.response?.data);
  }
};

const getDownloadUrl = async (id) => {
  const downloadUrl = `https://convertor-backend.restream.io/public/conversions/${id}/download`;
  try {
    const { data } = await axios.get(downloadUrl, { headers });
    return data.downloadUrl;
  } catch (e) {
    console.error("Error in getDownloadUrl:", e?.response?.data || e.message);
  }
};

export const transcribeVideoFile = async (filePath, size) => {
  try {
    const awsResponse = await getAwsCredentials(size);
    if (!awsResponse || !awsResponse.credentials || !awsResponse.destination) {
      console.error("Invalid AWS response. Aborting upload.");
      return;
    }

    videoId = awsResponse.id;

    await uploadToS3(awsResponse.credentials, awsResponse.destination, filePath);

    await finishPost(videoId);

    converting = true;
    const transcribeResponse = await transcribeVideo(videoId);
    transcribFileId = transcribeResponse.id;
    converting = false;

    const downloadUrlPromise = new Promise(async (resolve, reject) => {
      setTimeout(async () => {
        try {
          const downloadUrl = await getDownloadUrl(transcribFileId);
          console.log("Transcription file download URL:", downloadUrl);
          resolve(downloadUrl);  // Resolve the promise with the download URL
        } catch (error) {
          console.error("Error fetching download URL:", error);
          reject(error);  // Reject the promise if an error occurs
        }
      }, 5000);  // Delay for 5 seconds
    });

    return downloadUrlPromise;
  } catch (error) {
    console.error("Error in transcribeVideoFile:", error.message);
    
  }
};




































// //what u need is just give url of the video file to this script currently it is using local using node js path module

// import AWS from "aws-sdk";
// import fs from "fs";
// import axios from "axios";

// let videoId = null;
// let converting = false;
// let transcribFileId = null;
// // Function to get file size if we are using from dir
// const getFileSize = (filePath) => {
//   try {
//     const stats = fs.statSync(filePath);
//     return stats.size;
//   } catch (err) {
//     console.error("Error getting file size:", err);
//     return null;
//   }
// };
// // const getFileSize = (file) => {
// //   return file.size;
// // };

// // Headers for the initial API request
// const getAwsUrl = "https://convertor-backend.restream.io/public/uploads";
// const transcribeUrl = "https://convertor-backend.restream.io/public/conversions"
// const headers = {
//   "x-re-caller-app": "public-frontend",
//   "x-re-request-id": "1e4b0257-40a2-4afd-9dec-680d9b22a025",
// };
// const uploadBody = {
//   fileSizeBytes: getFileSize(videoFilePath) || null,
// };
// // Function to get AWS credentials
// const getAwsCredentials = async () => {
//   try {
//     const response = await axios.post(getAwsUrl, uploadBody, { headers });
//     console.log("AWS Credentials Response:", response.data);
//     return response.data;
//   } catch (e) {
//     console.error("Error fetching AWS credentials:", e.message);
//     return null;
//   }
// };

// // Function to upload the file to S3
// const uploadToS3 = async (credentials, destination, videoFilePath) => {
//   try {
//     // Configure AWS SDK with temporary credentials
//     const s3 = new AWS.S3({
//       accessKeyId: credentials.accessKeyId,
//       secretAccessKey: credentials.secretAccessKey,
//       sessionToken: credentials.sessionToken,
//       region: destination.region,
//     });

//     // Read file
//     const fileStream = fs.createReadStream(videoFilePath);

//     // Upload parameters
//     const params = {
//       Bucket: destination.bucket,
//       Key: destination.filename, // Key is the file path/name in the bucket
//       Body: fileStream,
//     };

//     // Upload the file
//     const result = await s3.upload(params).promise();
//     console.log("File uploaded successfully:", result);

//     return result.Location;
//   } catch (err) {
//     console.error("Error uploading to S3:", err.message);
//   }
// };
// //sending finish req
// const finishPost = async (videoId) => {
//   const finishPostUrl = `https://convertor-backend.restream.io/public/uploads/${videoId}/finish`;
//   try {
//     console.log("finish posturl", finishPostUrl);
//     await axios.post(finishPostUrl, {}, { headers })
//   } catch (e) {
//     console.log("error in finishPost")
//   }
// }
// const transcribeVideo = async (videoId) => {
//   const transcribeBody = {
//     "output": "txt",
//     "uploadId": videoId
//   }
//   try {
//     const { data } = await axios.post(transcribeUrl, transcribeBody, { headers });
//     console.log("Transcribe Response:", data);
//     return data;
//   } catch (e) {
//     console.log("error in transcribeVideo", error?.response.data);
//   }
// }
// const getDownloadUrl = async (id) => {
//   const downloadUrl = `https://convertor-backend.restream.io/public/conversions/${id}/download`
//   try {
//     console.log("Download URL:", downloadUrl);
//     const { data } = await axios.get(downloadUrl, { headers });
//     return data.downloadUrl;
//   } catch (e) {
//     console.log("Error in getDownloadUrl:", e?.response?.data || e.message);

//   }
// }
// // Main Execution
// // (async () => {
// //     // Fetch AWS credentials 
// //     //not actual aws credentials (what i know is we generate these keys for some time like 30 sec - 1 min but i donot know that it can be generated unique each time)
// //   const awsResponse = await getAwsCredentials();

// //   if (!awsResponse || !awsResponse.credentials || !awsResponse.destination) {
// //     console.error("Invalid AWS response. Aborting upload.");
// //     return;
// //   }
// //   // if not done here u will get classic race condition in async programming
// //   videoId=awsResponse.id;
// //   console.log("Video ID:", videoId);  // Log the video ID after it's assigned
// //   console.log("awsResponse.id Video ID:", awsResponse.id);  // Log the video ID after it's assigned
// //   // Upload to S3
// //   await uploadToS3(awsResponse.credentials, awsResponse.destination, videoFilePath);
// //   //send a finish to backend maybe just to update status from frontend saying ok i have uploaded you video
// //   await finishPost(videoId);
// //   //transcribe the video
// //  converting=true
// //  const transcribeResponse=await transcribeVideo(videoId);
// //  console.log(transcribeResponse.id);
// //  transcribFileId=transcribeResponse.id;
// //  converting=false;
// //  //this is not appropirate if file is not transcribe in 5 sec we get error
// //  setTimeout(async()=>{
// //     const downloadUrl=await getDownloadUrl(transcribFileId);
// //     console.log(downloadUrl)
// //  },5000)

// // })();
// export const transcribeVideoFile = async (file) => {
//   try {
//     // Get AWS credentials
//     const awsResponse = await getAwsCredentials();
//     if (!awsResponse || !awsResponse.credentials || !awsResponse.destination) {
//       console.error("Invalid AWS response. Aborting upload.");
//       return;
//     }

//     videoId = awsResponse.id; // Update videoId
//     console.log("Video ID:", videoId);

//     // Upload file to S3
//     await uploadToS3(awsResponse.credentials, awsResponse.destination, file);

//     // Notify backend that upload is complete
//     await finishPost(videoId);

//     // Transcribe video
//     converting = true;
//     const transcribeResponse = await transcribeVideo(videoId);
//     transcribFileId = transcribeResponse.id;
//     converting = false;
//     let downloadUrl;
//     setTimeout(async () => {
//        downloadUrl = await getDownloadUrl(transcribFileId);
//       console.log("Transcription file download URL:", downloadUrl);     
//     }, 5000);
    
//   } catch (error) {
//     console.error("Error in transcribeVideoFile:", error.message);
//   }
// };

