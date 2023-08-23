const express = require('express');
const app = express();
const fileUpload = require("express-fileupload");
const cors = require("cors");
const fs = require("fs");

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

app.post("/readFile", (req, res) => {
    const { name } = req.body;
    const { file } = req.files;

    console.log(name);

    file.mv("temp", () => {
        console.log('file saved to server successfully');
    });

    try {
        const data = fs.readFileSync("temp", 'utf8');
        console.log(data);
    }
    catch (error) {
        console.log("error while reading file");
        console.log(error);
    }

    res.json({
        success: true
    });
})

app.listen(PORT, () => {
    console.log('server is running');
});
