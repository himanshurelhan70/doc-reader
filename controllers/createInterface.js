const fs = require("fs");

// This will create a Interface File after structuring the data
exports.createInterface = (req, res) => {
    let fileContent = "";

    const { filteredInvoice, productsInfo } = req.body;

    filteredInvoice.forEach(invoice => {
        fileContent += "H";
        fileContent += "TL";
    
        //Transaction Date
        const transDateStr = invoice.Created_Time;
        const transDateObj = new Date(transDateStr);

        const transDate = String(transDateObj.getDate()).padStart(2, '0') + String(transDateObj.getMonth() + 1).padStart(2, '0') + String(transDateObj.getFullYear());
        fileContent += transDate;

        // Document Date
        const docDateObj = new Date();
        const docDate = String(docDateObj.getDate()).padStart(2, '0') + String(docDateObj.getMonth() + 1).padStart(2, '0') + String(docDateObj.getFullYear());
        fileContent += docDate;

        fileContent += "\n";
        //////////////
        invoice.Product_Details.forEach(product => {
            // Detail Record - D
            fileContent += "D";

            // For Company Code - todo
            fileContent += "TL";

            // transaction Type IN or CR - todo
            fileContent += "IN";

            const productId = product.product.id;
            // Finding GL codes of the current product
            const productCodes = productsInfo.find(p => p.id === productId);

            // ////////// GL Code
            let glCode = productCodes.General_Ledger_Account_Code;
            glCode = glCode ? glCode.padEnd(20, ' ') : "".padEnd(20, ' ');
            fileContent += glCode;

            // ////////// GL Code L7
            let glCodeL7 = productCodes.GL_Analysis_Code_Level_7;
            glCodeL7 = glCodeL7 ? glCodeL7.padEnd(4, ' ') : "".padEnd(4, ' ');
            fileContent += glCodeL7;

            // ////////// GL Code L8
            let glCodeL8 = productCodes.GL_Analysis_Code_Level_8;
            glCodeL8 = glCodeL8 ? glCodeL8.padEnd(8, ' ') : "".padEnd(8, ' ');
            fileContent += glCodeL8;

            // ////////// GL Code L9
            let glCodeL9 = productCodes.GL_Analysis_Code_Level_9;
            glCodeL9 = glCodeL9 ? glCodeL9.padEnd(8, ' ') : "".padEnd(8, ' ');
            fileContent += glCodeL9;

            //////// base amounts
            const inclVat = product.net_total === 0 ? '0' : product.net_total.toFixed(5).replace('.', '');
            const exclVat = product.total_after_discount === 0 ? '0' : product.total_after_discount.toFixed(5).replace('.', '');
            const tax = product.Tax === 0 ? '0' : product.Tax.toFixed(5).replace('.', '');

            fileContent += inclVat.padStart(18, ' ');
            fileContent += exclVat.padStart(18, ' ');
            fileContent += tax.padStart(18, ' ');

            ////////For prime amounts
            fileContent += inclVat.padStart(18, ' ');
            fileContent += exclVat.padStart(18, ' ');
            fileContent += tax.padStart(18, ' ');

            // ///////////// VAT CODE
            fileContent += productCodes.Tax_Code.trim().padEnd(50, ' ');

            // ///////// Currency Code - MUR
            fileContent += "MUR".padEnd(10, ' ');

            // ////////// Currency Rate 
            fileContent += "100000".padStart(18, ' ');

            // //////////
            fileContent += "CR";

            fileContent += "\n";
        })
    });


    console.log("fileContent ->", fileContent);
    fs.writeFile("files/interface.txt", fileContent, (err) => {
        if (err) {
            console.log("Error While creating File", err);
        }
        else {
            console.log("File Generated Successfully");
        }
    });

    return res.json({
        success: true
    });
}