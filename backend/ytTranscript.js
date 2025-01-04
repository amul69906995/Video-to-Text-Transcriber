//the url which is used in tactiq to get transcript
// it takes yt video url and langCode language in which u want to extract video.
// english "en"  hindi "hi"
import axios from "axios";

let langCode = "en";
let videoUrl = "https://www.youtube.com/watch?v=UIyQvUe08Zc";
const baseUrl = "https://tactiq-apps-prod.tactiq.io/transcript";
let error = null;
const body = {
    langCode: langCode || "en",
    videoUrl
};
const fetchTranscript = async () => {
    try {
         const {data}= await axios.post(baseUrl,body);
        //console.log("your transcript", data);
        const transcript = convertToText(data?.captions);
        console.log("transcript", transcript);
    } catch (e) {
        console.log("this is an error", e)
    }
}
fetchTranscript();
const convertToText = (captions) => {
   
    const onlyText=captions.reduce((acc,caption) => {
        return acc+caption.text+" ";
    },"").trim();
    return onlyText;
}