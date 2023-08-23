const express = require('express');
const app = express();
const fileUpload = require("express-fileupload");
const cors = require("cors");
const fs = require("fs");
const axios = require("axios");

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

app.post("/uploadFile/:fileId", async (req, res) => {
    const { fileId } = req.params;
    console.log("file ID is -->", fileId);

    let access_token = "1000.110eeb6d007d0178312a11c472916116.8a661ec33c210b69a717a00310ab2fe9";

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
        const data = await response.data;
        console.log("file Data -->", data)
    }
    catch(err){
        console.log("Error while downloading file");
        console.log(err);
        return res.status(400).json({
            success: false,
            message: "Error while downloading file"
        })
    }


    // saving file to server
    // try {
    //     file.mv("temp", () => {
    //         console.log('file saved to server successfully');
    //     });
    // }
    // catch (error) {
    //     console.log("Error while saving file to server");
    //     return res.status(500).json({
    //         success: false,
    //         message: "Error while saving file to server"
    //     });
    // }

    // reading file
    // try {
    //     const data = fs.readFileSync("temp", 'utf8');
    //     console.log(data);
    // }
    // catch (error) {
    //     console.log("error while reading file");
    //     console.log(error);
    // }

    res.status(200).json({
        success: true,
        message: "Data pushed to CRM successfully"
    });
})

app.listen(PORT, () => {
    console.log('server is running');
});
