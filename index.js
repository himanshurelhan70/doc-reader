const express = require('express');
const app = express();
const fileUpload = require("express-fileupload");
const cors = require("cors");
const fs = require("fs");
const axios = require("axios");

//controllers
const { createInterface } = require("./controllers/createInterface");

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
//////////////////
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
            console.log("file Data -->", data);
        }
        catch (err) {
            console.log("Error while downloading file");
            console.log(err);
            return res.status(400).json({
                success: false,
                message: "Error while downloading file"
            });
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
        const Ticket_Number = data.substring(Ticket_Number_start + 3, Ticket_Number_end).split("-")[1].trim();
        console.log("Ticket_Number-----> " + Ticket_Number);


        // Date
        const o_start = data.lastIndexOf("O-");
        const o_end = data.indexOf("\n", o_start);
        const O = data.substring(o_start + 3, o_end);
        console.log("O-----> " + O);


        const dateMatch = O.match(/(\d{2}[A-Z]{3}\d{2})/) ? O.match(/(\d{2}[A-Z]{3}\d{2})/) : ["", ""];
        const dateString = dateMatch[1];
        console.log("dateString  ---->", dateString);

        // Use string manipulation to insert hyphens
        const Date = dateString.slice(0, 2) + '-' + dateString.slice(2, 5) + '-' + dateString.slice(5);
        console.log("Date -->", Date);


        // Fair and currency
        const K_start = data.lastIndexOf("K-");
        const K_end = data.indexOf("\n", K_start);
        let Fair = data.substring(K_start, K_end).trim();
        console.log("fair", Fair);

        function extractBaseFareAndCurrency(inputString) {
            const match = inputString.match(/K-([A-Z]+)([\d.]+)\s*;/);

            if (match && match[1] && match[2]) {
                const baseCurrency = match[1].substring(1); // Remove the first character
                const baseAmount = parseFloat(match[2]).toFixed(2); // Convert to decimal with two decimal places
                return { baseCurrency, baseAmount };
            } else {
                return { baseCurrency: "", baseAmount: "" };
            }
        }

        const { baseCurrency, baseAmount } = extractBaseFareAndCurrency(Fair);
        console.log("Currency ->", baseCurrency, "Base Fair ->", baseAmount);


        //// exchange Rate
        function extractConversionRate(inputString) {
            const match = inputString.match(/;([\d.]+)\s*;*$/);

            if (match && match[1]) {
                const conversionRate = parseFloat(match[1]);
                return conversionRate.toFixed(2);
            } else {
                return null;
            }
        }

        const exchangeRate = extractConversionRate(Fair);
        console.log("Exchange Rate ->", exchangeRate);

        /////
        let murAmount = baseAmount;
        if (exchangeRate !== null) {
            murAmount = (baseAmount * exchangeRate).toFixed(2);
        }

        console.log("murAmount ->", murAmount);

        //Tax
        const TAX_start = data.lastIndexOf("TAX-");
        const TAX_end = data.indexOf("\n", TAX_start);
        const TAX = data.substring(TAX_start + 4, TAX_end);
        console.log("TAX-----> " + TAX);


        // Taxes, Names, and Codes
        const TaxesAndNames = TAX.split(';')
            .filter(tax => tax.trim() !== '')
            .map(tax => {
                const parts = tax.trim().match(/^([A-Z]+\s+\d+\s+[A-Z]+)$/);
                if (parts) {
                    const [taxInfo] = parts;
                    const [prefix, number, suffix] = taxInfo.split(/\s+/);
                    return { prefix, number, suffix };
                }
                else {
                    // If the previous regular expression doesn't match, try another format
                    const parts = tax.trim().match(/^([A-Z]+)(\d+)\s+([A-Z]+)$/);
                    if (parts) {
                        const [, prefix, number, suffix] = parts;
                        return { prefix, number, suffix };
                    } else {
                        return null;
                    }
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
            Email: Email,
            baseCurrency: baseCurrency,
            baseAmount: baseAmount,
            exchangeRate: exchangeRate,
            murAmount: murAmount
        };

        // Routing
        let Routing = [];
        // H-
        // H-001, H-002, H-003 and so on
        const regex = /(H-\d{3};)([^\n]*\n)/g; // Regular expression to match entire lines starting with H-001, H-002, etc.

        const matches = [...data.matchAll(regex)];

        console.log("matches ", matches);

        if (matches.length > 0) {
            // Get the second matched group and store in an array
            const hLines = matches.map(match => match[0].trim());

            const H = [];
            let Class = "";

            console.log("hineshineshineshineshineshineshineshineshineshines", hLines);

            hLines.forEach(async element => {
                // row for flight routing subform
                let flightRouting = {};

                // ////
                hArr = element.split(";");

                // Routing
                const r1 = hArr[1].substring(4);
                const r2 = hArr[3].trim();

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


                // ! //////////////// tattooNumber 
                let tattooNumber;
                const tattooNumberArr = element.match(/H-(\d{3});/);

                if (tattooNumberArr) {
                    tattooNumber = tattooNumberArr[1];
                    console.log("tattooNumber => ", tattooNumber);
                } else {
                    tattooNumber = "undefined";
                    console.log("tattooNumber not found.");
                }

                flightRouting.tattooNumber = tattooNumber;

                console.log("flightRouting", flightRouting);

                // ! //////////////// segmentNumber|stopOverId|originAirportCode
                const SSO = hArr[1];
                console.log("SSO =>", SSO?.substring(0,2));
                console.log("SSO =>", SSO?.substring(2,4));
                console.log("SSO =>", SSO?.substring(4,7));
               console.log(res,"result");
                flightRouting.SSO = SSO;
                flightRouting.SS0segmentNumber= SSO?.substring(0,2);
                flightRouting.SS0stopOverId= SSO?.substring(2,4);
                flightRouting.SS0originAirportCode= SSO?.substring(4,7);
                // ! /////////////// origin city name
                const originCityName = hArr[2].trim();
                flightRouting.originCityName = originCityName;

                // ! /////////////// destination airport code
                const destinationAirportCode = hArr[3];
                flightRouting.destinationAirportCode = destinationAirportCode;

                // ! /////////////////// destination city name
                const destinationCityName = hArr[4];
                flightRouting.destinationCityName = destinationCityName.trim();

                // ! /////////////// Multiple Fields
                const codeClassDate = hArr[5];
                const codeClassDateArr = codeClassDate.split(/\s+/).filter(Boolean);
                console.log("codeClassDateArr", codeClassDateArr);


                // ! /////////////// Airline Code + Flight Number
                const [airlineCode, flightNumber] = codeClassDateArr;
                const airlineCodeFlightNumber = `${airlineCode} ${flightNumber}`;
                flightRouting.airlineCodeFlightNumber = airlineCodeFlightNumber;

                // ! ////////////// Class of Service
                const classOfService = codeClassDateArr[2];
                flightRouting.classOfService = classOfService;

                // ! ////////////// Class of Booking
                const classOfBooking = codeClassDateArr[3];
                flightRouting.classOfBooking = classOfBooking;

                // ! ///////////// Departure Date/Time
                const departureDateTime = codeClassDateArr[4];
                flightRouting.departureDateTime = departureDateTime;

                // ! ///////////// Arrival Date/Time
                const arrivalDateTime = codeClassDateArr[5];
                flightRouting.arrivalDateTime = `${codeClassDateArr[6]}${codeClassDateArr[5]}`;

                // ! //////////// Meal Code
                const mealCode = hArr[8];
                flightRouting.mealCode = mealCode.trim();

                // ! //////////// Number Of Stops
                const numberOfStops = hArr[9];
                flightRouting.numberOfStops = numberOfStops;

                // ! //////////// Equipment Type
                const equipmentType = hArr[10];
                flightRouting.equipmentType = equipmentType;
                
                const entertainmentCode=hArr[11];
                flightRouting.entertainmentCode = entertainmentCode;

                const sharedDesignatorCommuter=hArr[12];
                flightRouting.sharedDesignatorCommuter = sharedDesignatorCommuter;

                const baggageAllowance=hArr[13];
                flightRouting.baggageAllowance = baggageAllowance;
                
                var checkInTerminal=hArr[14]?.match(/(\d+)/);
               
                flightRouting.checkInTerminal = checkInTerminal?checkInTerminal[0]:"";

                const latestCheckInTime=hArr[15];
                flightRouting.latestCheckInTime = latestCheckInTime;

                const ElectronicTicketSegmentIndicator=hArr[16];
                flightRouting.ElectronicTicketSegmentIndicator = ElectronicTicketSegmentIndicator;
                
                const flightDurationTime=hArr[17];
                flightRouting.flightDurationTime = flightDurationTime;
               
                const FlightNonsmokingIndicator=hArr[18];
                flightRouting.FlightNonsmokingIndicator = FlightNonsmokingIndicator;
                
                const geographicalMileage=hArr[19];
                flightRouting.geographicalMileage = geographicalMileage;
               
                const originCountryCode=hArr[20];
                flightRouting.originCountryCode = originCountryCode;

                const destinationCountryCode=hArr[21];
                flightRouting.destinationCountryCode = destinationCountryCode;

                const arrivalTerminal=hArr[22]?.match(/(\d+)/);
                flightRouting.arrivalTerminal =arrivalTerminal? arrivalTerminal[0]:"";
               
                // appending object/row in flight routing subform
                H.push(flightRouting);
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
/////////////////////

app.post("/createInterface", createInterface);

app.listen(PORT, () => {
    console.log('server is running');
});
