const fs = require("fs");
const axios = require("axios");

exports.getAccessToken = async () => {
    try {
        // reading file Data
        const readFile = fs.readFileSync("accessToken.txt", "utf-8");
        const fileData = JSON.parse(readFile);
        const storedTime = new Date(fileData.expiresAt);
        // console.log("fileData", fileData);

        // runs when token expires or doesn't exist
        if (
            new Date().getTime() > storedTime.getTime() ||
            fileData.token === "" ||
            fileData.token === undefined ||
            fileData.expiresAt === "" ||
            fileData.expiresAt === undefined
        ) {
            // adding 55 minutes to current time
            var d = new Date();
            d.setMinutes(d.getMinutes() + 55);

            // generating ZOHO access token
            const response = await axios.post(
                "https://accounts.zoho.com/oauth/v2/token",
                {},
                {
                    params: {
                        refresh_token: "1000.fd3d22b8f8c9ee22b7a9e84315afc7fc.18eb54f4914d619680f2766ae0110884",
                        client_id: "1000.48UBCJB3IQ53C49MYGYAKMAQT69HMA",
                        client_secret: "fc65975aef30fad236f6bf576bff6f3b89826c3d71",
                        grant_type: "refresh_token",
                    },
                }
            );

            const newToken = response.data.access_token;

            // Storing Token in accessToken.txt file
            fs.writeFileSync(
                "accessToken.txt",
                JSON.stringify({
                    token: newToken,
                    expiresAt: d,
                }, null, 2),
                "utf8"
            );

            console.log("New token", newToken);
            return newToken;
        } 
        // runs when token exist and expires
        else {
            console.log("fileData", fileData);
            return fileData.token;
        }
    } catch (err) {
        console.log(err);
        return err.message;
    }
};
