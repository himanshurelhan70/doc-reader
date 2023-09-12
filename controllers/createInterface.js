const fs = require("fs");

exports.createInterface = (req, res) => {
    let fileContent = "";

    console.log("createInterface");
    const {filteredInvoice, productsInfo} = req.body;

    filteredInvoice.forEach(invoice => {
        invoice.Product_Details.forEach(product => {
            const productId = product.product.id;
            const productCodes = productsInfo.find(p => p.id === productId);
            // //////
            let glCode = productCodes.General_Ledger_Account_Code;
            glCode = glCode ? glCode.padEnd(20, ' ') : "".padEnd(20, ' ');
            fileContent += glCode;


            ///////
            let glCodeL7 = productCodes.GL_Analysis_Code_Level_7;
            glCodeL7 = glCodeL7 ? glCodeL7.padEnd(4, ' ') : "".padEnd(4, ' ');
            fileContent += glCodeL7;


            ////////////
            let glCodeL8 = productCodes.GL_Analysis_Code_Level_8;
            glCodeL8 = glCodeL8 ? glCodeL8.padEnd(8, ' ') : "".padEnd(8, ' ');
            fileContent += glCodeL8;

            //////
            let glCodeL9 = productCodes.GL_Analysis_Code_Level_9;
            glCodeL9 = glCodeL9 ? glCodeL9.padEnd(8, ' ') : "".padEnd(8, ' ');
            fileContent += glCodeL9;

            /////
            // console.log("product", product);
            let total = product.total;
            let tax = product.Tax;
            console.log(total);
            console.log(tax);

            fileContent += "\n";
        })
    });


    console.log("fileContent ->", fileContent);
    fs.writeFile("files/interface.txt", fileContent, (err) => {
        if(err){
            console.log("Error While creating File", err);
        }
        else{
            console.log("File Generated Successfully");
        }
    });

    return res.json({
        success: true
    });
}