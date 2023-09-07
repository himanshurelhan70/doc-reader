const express = require('express');
const app = express();
const fileUpload = require("express-fileupload");
const cors = require("cors");
const fs = require("fs");
const axios = require("axios");

// zoho access token 
const { getAccessToken } = require("./accessToken");
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
    try {
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

        try {
            const response = await axios(config);
            data = await response.data;
            // console.log("file Data -->", data);
        }
        catch (err) {
            console.log("Error while downloading file");
            console.log(err);
            return res.status(400).json({
                success: false,
                message: "Error while downloading file"
            })
        }

        // Airline
        const Airline_start = data.indexOf("A-");
        const Airline_end = data.indexOf(";", Airline_start);
        const Airline = data.substring(Airline_start + 2, Airline_end);
        console.log("Airline -----> " + Airline);

        // Passenger
        const Passenger_start = data.lastIndexOf("I-");
        const Passenger_end = data.indexOf(";", Passenger_start + 8);
        const Passenger = data.substring(Passenger_start + 8, Passenger_end);
        console.log("Passenger -----> " + Passenger);

        // Ticket Number
        const Ticket_Number_start = data.lastIndexOf("T-K");
        const Ticket_Number_end = data.indexOf("\n", Ticket_Number_start);
        const Ticket_Number = data.substring(Ticket_Number_start + 3, Ticket_Number_end);
        console.log("Ticket_Number-----> " + Ticket_Number);

        // Date
        const o_start = data.lastIndexOf("O-");
        const o_end = data.indexOf("\n", o_start);
        const O = data.substring(o_start + 3, o_end);
        console.log("O-----> " + O);
        const inputString = "O-XXXX;24DECXX;LD20DEC232359";

        const dateMatch = O.match(/(\d{2}[A-Z]{3}\d{2})/);
        const Date = dateMatch[1];
        console.log("Date  ---->", Date);

        // Fair
        const K_start = data.lastIndexOf("K-");
        const K_end = data.indexOf(";", K_start);
        let Fair = data.substring(K_start + 2, K_end).trim();

        Fair = Fair.match(/\d+/)[0];
        console.log("Fair-----> " + Fair);

        //Tax
        const TAX_start = data.lastIndexOf("TAX-");
        const TAX_end = data.indexOf("\n", TAX_start);
        const TAX = data.substring(TAX_start + 4, TAX_end);
        console.log("TAX-----> " + TAX);

        // Taxes, Names and Codes
        const TaxesAndNames = TAX.split(';')
            .filter(tax => tax.trim() !== '')
            .map(tax => {
                const parts = tax.trim().match(/^([A-Z]+)(\d+)\s+([A-Z]+)$/);
                if (parts) {
                    const [, prefix, number, suffix] = parts;
                    return { prefix, number, suffix };
                } else {
                    return null;
                }
            })
            .filter(tax => tax !== null);
        console.log("TaxesAndNames --->", TaxesAndNames);



        // Total Tax
        // Extract numbers using regular expression
        const Taxes = TAX.match(/\d+/g);
        console.log("Extracted Taxes ---->", Taxes);
        const Total_Tax = Taxes.reduce((total, tax) => total + parseInt(tax), 0);
        console.log("Total_Tax ---->", Total_Tax);

        // B-
        const b_start = data.indexOf("B-");
        const b_end = data.indexOf("\n", b_start);
        const B = data.substring(b_start + 2, b_end);
        console.log("B -----> " + B);

        // Mail
        // Regular expression pattern to match an email address
        const emailRegex = /-(\w+@\w+\.\w+)/;

        // Use the match method to find the email address in the string
        let Email = B.match(emailRegex);

        // Check if there is a match and extract the email address
        if (Email && Email.length > 0) {
            Email = Email[1];
            console.log(Email);
        } else {
            const Email = "";
            console.log("No email address found in the string.");
        }



        let recordDetails = {
            Passenger: Passenger,
            Ticket_Number: Ticket_Number,
            Airline: Airline,
            Fair: Fair,
            TaxesAndNames: TaxesAndNames,
            Total_Tax: Total_Tax,
            Email: Email
        };

        // Routing
        let Routing = [];
        // H-
        // H-001, H-002, H-003 and so on
        const regex = /(H-\d{3};)([^\n]*\n)/g; // Regular expression to match entire lines starting with H-001, H-002, etc.

        const matches = [...data.matchAll(regex)];

        if (matches.length > 0) {
            // Get the second matched group and store in an array
            const hLines = matches.map(match => match[2].trim());

            const H = [];
            let Class = "";

            console.log("hines", hLines);

            hLines.forEach(element => {

                hArr = element.split(";");

                // Routing
                const r1 = hArr[0].substring(4);
                const r2 = hArr[2].trim();

                if (!(Routing[Routing.length - 1] == r1)) {
                    Routing.push(r1);
                }

                if (!(Routing[Routing.length - 1] == r2)) {
                    Routing.push(r2);
                }

                // Class of booking
                let Bookings = element.match(/([A-Z]) \d{2}[A-Z]{3}\d{4}/);
                Class = Bookings[1];
                console.log("Class of booking ---->", Class);


                // const hData = {
                //     h1: hArr[0].trim(),
                //     h2: hArr[1].trim(),
                //     h3: hArr[2].trim(),
                //     h4: hArr[3].trim(),
                //     h5: hArr[4].trim(),
                // }

                const hData = hArr.join("\n");

                H.push(hData);
            });

            Routing = Routing.join("/");
            recordDetails.H = H;
            recordDetails.Class = Class;

            // Flight Description
            const Flight_Description = `${Passenger}\nROUTING: ${Routing}\nDEP ${Date}\n${Airline}\n${Ticket_Number}`;
            console.log("Flight_Description ----->", Flight_Description);
            recordDetails.Flight_Description = Flight_Description;
        } else {
            console.log("No matches found.");
        }



        res.status(200).json({
            success: true,
            message: "Data pushed to CRM successfully",
            data: recordDetails
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "Something went wrong",
        });
    }
});

app.listen(PORT, () => {
    console.log('server is running');
});
