const express = require('express');
const app = express();
const fileUpload = require("express-fileupload");
const cors = require("cors");
const fs = require("fs");
const axios = require("axios");

// zoho access token 
const {getAccessToken} =  require("./accessToken");
let access_token = "";

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

    console.log("access token", access_token);
    
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
        // console.log("file Data -->", data);
    }
    catch(err){
        console.log("Error while downloading file");
        console.log(err);
        return res.status(400).json({
            success: false,
            message: "Error while downloading file"
        })
    }

    // a. Name of passenger: Single line
    // b. Reservation number: Single line
    // c. Ticket Number: Single Line (Header T)
    // d. Airline: Single Line
    // e. Flight routing: Subform (1 entry for each H  line)
    // f. Flight description for Invoice field: (Multi line which will be mapped to Line
    // Item description field:
    // g. Dates of travel (Date)
    // h. Class of booking (Single Line)
    // i. Fare (Currency)
    // j. Taxes (Composite airfile field to be broken down in subform, tax name +
    // amount)
    // k. Tax Total (Currency)


    // A-
    const a_start = data.indexOf("A-");
    const a_end = data.indexOf("\n", a_start);
    const A = data.substring(a_start + 2, a_end);
    console.log("A -----> " + A);
    
    // B-
    const b_start = data.indexOf("B-");
    const b_end = data.indexOf("\n", b_start);
    const B = data.substring(b_start + 2, b_end);
    console.log("B -----> " + B);

    // C-
    const c_start = data.indexOf("C-");
    const c_end = data.indexOf("\n", c_start);
    const C = data.substring(c_start + 2, c_end);
    console.log("C -----> " + C);
    
    // D-
    const d_start = data.indexOf("D-");
    const d_end = data.indexOf("\n", d_start);
    const D = data.substring(d_start + 2, d_end);
    console.log("D -----> " + D);

    // G-X
    const gx_start = data.indexOf("G-X");
    const gx_end = data.indexOf("\n", gx_start);
    const GX = data.substring(gx_start + 3, gx_end);
    console.log("GX -----> " + GX);

    // I-
    const i_start = data.lastIndexOf("I-");
    const i_end = data.indexOf("\n", i_start);
    const I = data.substring(i_start + 3, i_end);
    console.log("I -----> " + I);

    // T -
    const t_start = data.lastIndexOf("T-");
    const t_end = data.indexOf("\n", t_start);
    const T = data.substring(t_start + 3, t_end);
    console.log("T-----> " + T);

    // O -
    const o_start = data.lastIndexOf("O-");
    const o_end = data.indexOf("\n", o_start);
    const O = data.substring(o_start + 3, o_end);
    console.log("O-----> " + O);
           
    // N-NUC
    const NUC_start = data.lastIndexOf("O-");
    const NUC_end = data.indexOf("\n", NUC_start);
    const NUC = data.substring(NUC_start + 3, NUC_end);
    console.log("NUC-----> " + NUC);
       

    let recordDetails = {
        A: A,
        B: B,
        C: C,
        D: D,
        GX: GX,
        I: I,
        T: T,
        O: O,
        NUC : NUC
    };

    // H-
    // H-001, H-002, H-003 and so on
    const regex = /(H-\d{3};)([^\n]*\n)/g; // Regular expression to match entire lines starting with H-001, H-002, etc.

    const matches = [...data.matchAll(regex)];

    if (matches.length > 0) {
        // Get the second matched group and store in an array
        const hLines = matches.map(match => match[2].trim()); 

        const H = [];

        hLines.forEach(element => {

            hArr = element.split(";");

            const hData = {
                h1: hArr[0].trim(),
                h2: hArr[1].trim(),
                h3: hArr[2].trim(),
                h4: hArr[3].trim(),
                h5: hArr[4].trim(),
            }

            H.push(hData);
        });

        recordDetails.H = H;
    } else {
        console.log("No matches found.");
    }



    res.status(200).json({
        success: true,
        message: "Data pushed to CRM successfully",
        data: recordDetails
    });
});

app.listen(PORT, () => {
    console.log('server is running');
});
