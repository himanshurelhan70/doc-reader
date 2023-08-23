const express = require('express');
const app = express();
const fileUpload = require("express-fileupload");
const cors = require("cors");
const fs = require("fs");
const axios = require("axios");

// zoho access token 
const {getAccessToken} =  require("./accessToken");
let access_token = ""

require('dotenv').config();
const PORT = process.env.PORT;

app.use(express.json()); 
app.use(fileUpload());
app.use(cors("*"));


app.get("/", (req, res) => {
    console.log("welcome");
    res.json({
        success: true
    });
})

// Obtains Zoho access token
const getZohoAccessToken = async () => {
    try {
      access_token = await getAccessToken();
      console.log("access token", access_token);
      console.log("successfully generated access token");
    }
    catch (err) {
      console.log("error while generating access Token");
    }
  }

app.post("/uploadFile/:fileId", async (req, res) => {
    const { fileId } = req.params;
    console.log("file ID is -->", fileId);
    let data;

    await getZohoAccessToken();

    console.log("atsss", access_token);
    
    const config = {
        method: 'GET',
        url: `https://download.zoho.com/v1/workdrive/download/${fileId}`,
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${access_token}`,
          },
    }

    try{
        const response = await axios(config);
        data = await response.data;
        console.log("file Data -->", data);
    }
    catch(err){
        console.log("Error while downloading file");
        console.log(err);
        return res.status(400).json({
            success: false,
            message: "Error while downloading file"
        })
    }

    // Find the position of "A-" and "B-"
    startIndex = data.indexOf("A-");
    endIndex = data.indexOf("B-");
    // Extract the content between "A-" and "B-"
    AContent = data.substring(startIndex + 2,endIndex);
    console.log("AContent - " + AContent);
    
    // Find the position of "B-" and "C-"
    startIndex = data.indexOf("B-TTP/ITR-EML-");
    endIndex = data.indexOf("C-");
    BContent = data.substring(startIndex + 2,endIndex);
    console.log("BContent - " + BContent);

    // Find the position of "C-" and "D-"
    startIndex = data.indexOf("C-");
    endIndex = data.indexOf("D-");
    CContent = data.substring(startIndex + 2,endIndex);
    console.log("CContent - " + CContent);
    
    // Find the position of "D-" and "G-"
    startIndex = data.indexOf("D-");
    endIndex = data.indexOf("G-");
    DContent = data.substring(startIndex + 2,endIndex);
    console.log("DContent - " + DContent);
    
    // Find the position of "H-" and "K-"
    startIndex = data.indexOf("H-");
    endIndex = data.indexOf("H-004");
    HContent = data.substring(startIndex + 2,endIndex);
    console.log("HContent - " + HContent);
    

    // Find the position of "I-" and "T-"
    startIndex = data.lastIndexOf("I-");
    endIndex = data.indexOf("MR;;");
    IContent = data.substring(startIndex + 2,endIndex);
    console.log("IContent - " + IContent);
    

    res.status(200).json({
        success: true,
        message: "Data pushed to CRM successfully",
        data: {
            A: AContent,
            B: BContent,
            C: CContent,
            D: DContent,
            H: HContent,
            I: IContent
        }
    });
})

app.listen(PORT, () => {
    console.log('server is running');
});
