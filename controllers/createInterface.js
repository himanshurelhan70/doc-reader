const fs = require("fs");
const path = require('path');

// This will create a Interface File after structuring the data
exports.createInterface = (req, res) => {
    let fileContent = "";

    const { filteredInvoice, productsInfo } = req.body;

    // // validation
    if (!filteredInvoice || !productsInfo) {
        console.log("data is empty");

        return res.json({
            success: false,
            message: "Data is null"
        })
    }


    filteredInvoice.forEach(invoice => {
        //// amounts
        let totalIncVat = 0;
        let totalExcVat = 0;
        let onlyVat = 0;
        let onlyTicketAmount = 0;
        //
        let headerRow = "";
        let detailRows = "";
        let doubleEntry = "";
        //
        let lineNo = 0;
        let headerVatCode = "ZER";
        let refNo = 0;

        ////////////// Detail Row
        invoice.Product_Details.forEach((product, index, products) => {

            // Detail Record - D
            detailRows += "D";

            // For Company Code
            detailRows += "TL";

            // transaction Type
            const isCreditNote = invoice.Credit_Note;
            detailRows += isCreditNote ? "CR" : "IN";

            // Item Reference
            const invRef = invoice.Invoice_Reference ? invoice.Invoice_Reference : "".padEnd(8, ' ');
            const invArr = invRef.split("");
            invArr[3] = refNo;
            const invoiceReference = invArr.join("");
            detailRows += invoiceReference;

            // Line no 
            detailRows += lineNo.toString().padStart(4, ' ');

            // Line Description -
            const proDesc = invoice.Product_Details[index].product_description ? invoice.Product_Details[index].product_description : "";
            console.log("proDesc -->", proDesc);
            const lineDescription = proDesc.match(/(\d+)$/) ? proDesc.match(/(\d+)$/)[1].padEnd(30, ' ') : "".padEnd(30, ' ');
            detailRows += lineDescription;

            // /////////// Finding GL codes of the current product
            const productId = product.product.id;
            const productCodes = productsInfo.find(p => p.id === productId);

            // ////////// GL Code
            let glCode = productCodes.General_Ledger_Account_Code;
            glCode = glCode ? glCode.padEnd(20, ' ') : "".padEnd(20, ' ');
            detailRows += glCode;

            // ////////// GL Code L7
            let glCodeL7 = productCodes.GL_Analysis_Code_Level_7;
            glCodeL7 = glCodeL7 ? glCodeL7.padEnd(4, ' ') : "".padEnd(4, ' ');
            detailRows += glCodeL7;

            // ////////// GL Code L8
            let glCodeL8 = productCodes.GL_Analysis_Code_Level_8;
            glCodeL8 = glCodeL8 ? glCodeL8.padEnd(8, ' ') : "".padEnd(8, ' ');
            detailRows += glCodeL8;

            // ////////// GL Code L9
            let glCodeL9 = productCodes.GL_Analysis_Code_Level_9;
            glCodeL9 = glCodeL9 ? glCodeL9.padEnd(8, ' ') : "".padEnd(8, ' ');
            detailRows += glCodeL9;

            //////// base amounts
            const inclVat = product.net_total === 0 ? '0' : product.net_total.toFixed(5).replace('.', '');
            const exclVat = product.total_after_discount === 0 ? '0' : product.total_after_discount.toFixed(5).replace('.', '');
            // const tax = product.Tax === 0 ? '0' : product.Tax.toFixed(5).replace('.', '');
            const tax = '0';

            detailRows += exclVat.padStart(18, ' ');
            detailRows += exclVat.padStart(18, ' ');
            detailRows += tax.padStart(18, ' ');

            // adding amounts to global variables
            totalIncVat += product.net_total === 0 ? 0 : product.net_total;
            totalExcVat += product.total_after_discount === 0 ? 0 : product.total_after_discount;
            onlyVat += product.Tax === 0 ? 0 : product.Tax;

            if(product?.product?.id == "5810070000000494011"){
                onlyTicketAmount = exclVat;
            }


            ////////For prime amounts
            detailRows += exclVat.padStart(18, ' ');
            detailRows += exclVat.padStart(18, ' ');
            detailRows += tax.padStart(18, ' ');

            // ///////////// VAT CODE
            detailRows += productCodes.Tax_Code.trim().padEnd(50, ' ');
            if(productCodes.Tax_Code == "STD"){
                headerVatCode = "STD";
            }

            // ///////// Currency Code - MUR
            detailRows += "MUR".padEnd(10, ' ');

            // ////////// Currency Rate 
            detailRows += "100000".padStart(18, ' ');

            // Invoice:
            // 50042, 62121, 26060092 - CR
            // 25042 - DR

            // Credit Note:
            // 50042, 62121, 26060092 - DR*
            // 25042 - CR
            if (!isCreditNote) {
                let code = glCode.trim();
                detailRows += (code == 50042 || code == '62121' || code == '26060092') ? "CR" : "DR";
            }
            else {
                let code = glCode.trim();
                detailRows += (code == 50042 || code == '62121' || code == '26060092') ? "DR" : "CR";
            }


            detailRows += "\n";

            // ////////////////////////////////////////////////////// For Tax amount Line
            if (product.Tax) {
                // Detail Record - D
                detailRows += "D";

                // For Company Code
                detailRows += "TL";

                // transaction Type
                const isCreditNote = invoice.Credit_Note;
                detailRows += isCreditNote ? "CR" : "IN";

                // Item Reference
                const invRef = invoice.Invoice_Reference ? invoice.Invoice_Reference : "".padEnd(8, ' ');
                const invArr = invRef.split("");
                invArr[3] = refNo;
                const invoiceReference = invArr.join("");
                detailRows += invoiceReference;

                // Line no
                detailRows += lineNo.toString().padStart(4, ' ');;

                // Line Description 
                const proDesc = invoice.Product_Details[index].product_description ? invoice.Product_Details[index].product_description : "";
                console.log("proDesc -->", proDesc);
                const lineDescription = proDesc.match(/(\d+)$/) ? proDesc.match(/(\d+)$/)[1].padEnd(30, ' ') : "".padEnd(30, ' ');
                detailRows += lineDescription;

                // /////////// Finding GL codes of the current product
                const productId = product.product.id;
                const productCodes = productsInfo.find(p => p.id === productId);

                // ////////// GL Code
                // let glCode = productCodes.General_Ledger_Account_Code;
                const glCode = "26060092".padEnd(20, ' ');
                detailRows += glCode;

                // ////////// GL Code L7
                // let glCodeL7 = productCodes.GL_Analysis_Code_Level_7;
                const glCodeL7 = "".padEnd(4, ' ');
                detailRows += glCodeL7;

                // ////////// GL Code L8
                // let glCodeL8 = productCodes.GL_Analysis_Code_Level_8;
                const glCodeL8 = "".padEnd(8, ' ');
                detailRows += glCodeL8;

                // ////////// GL Code L9
                // let glCodeL9 = productCodes.GL_Analysis_Code_Level_9;
                const glCodeL9 = "".padEnd(8, ' ');
                detailRows += glCodeL9;

                //////// base amounts
                const inclVat = product.Tax.toFixed(5).replace('.', '');
                const exclVat = product.Tax.toFixed(5).replace('.', '');
                const tax = '0';

                detailRows += inclVat.padStart(18, ' ');
                detailRows += exclVat.padStart(18, ' ');
                detailRows += tax.padStart(18, ' ');

                ////////For prime amounts
                detailRows += inclVat.padStart(18, ' ');
                detailRows += exclVat.padStart(18, ' ');
                detailRows += tax.padStart(18, ' ');

                // ///////////// VAT CODE
                detailRows += productCodes.Tax_Code.trim().padEnd(50, ' ');

                // ///////// Currency Code - MUR
                detailRows += "MUR".padEnd(10, ' ');

                // ////////// Currency Rate 
                detailRows += "100000".padStart(18, ' ');

                // ////////// DR/CR
                if (!isCreditNote) {
                    let code = glCode.trim();
                    detailRows += (code == 50042 || code == '62121' || code == '26060092') ? "CR" : "DR";
                }
                else {
                    let code = glCode.trim();
                    detailRows += (code == 50042 || code == '62121' || code == '26060092') ? "DR" : "CR";
                }

                detailRows += "\n";
            }

            //////////////////////////////////// Checking if it's a Air Ticket then create header and insert it
            if ((index < products.length - 1 && products[index + 1].product.id == "5810070000000494011") || index == products.length - 1) {
                ////////////////////////////// Adding Double Entry
                {
                    // Detail Record - D
                    doubleEntry += "D";

                    // For Company Code
                    doubleEntry += "TL";

                    // transaction Type
                    const isCreditNote = invoice.Credit_Note;
                    doubleEntry += isCreditNote ? "CR" : "IN";

                    // Item Reference
                    const invRef = invoice.Invoice_Reference ? invoice.Invoice_Reference : "".padEnd(8, ' ');
                    const invArr = invRef.split("");
                    invArr[3] = refNo;
                    const invoiceReference = invArr.join("");
                    doubleEntry += invoiceReference;

                    // Line no 
                    doubleEntry += lineNo.toString().padStart(4, ' ');

                    // Line Description 
                    const proDesc = invoice.Product_Details[index].product_description ? invoice.Product_Details[index].product_description : "";
                    console.log("proDesc -->", proDesc);
                    const lineDescription = proDesc.match(/(\d+)$/) ? proDesc.match(/(\d+)$/)[1].padEnd(30, ' ') : "".padEnd(30, ' ');
                    doubleEntry += lineDescription;

                    // /////////// Finding GL codes of the current product
                    const productId = product.product.id;
                    const productCodes = productsInfo.find(p => p.id === productId);

                    // ////////// GL Code
                    const glCode = "25042".padEnd(20, ' ');
                    doubleEntry += glCode;

                    // ////////// GL Code L7
                    const glCodeL7 = "SHLD".padEnd(4, ' ');
                    doubleEntry += glCodeL7;

                    // ////////// GL Code L8
                    const glCodeL8 = "".padEnd(8, ' ');
                    doubleEntry += glCodeL8;

                    // ////////// GL Code L9
                    const glCodeL9 = "50042".padEnd(8, ' ');
                    doubleEntry += glCodeL9;

                    //base amounts
                    doubleEntry += totalIncVat.toFixed(5).replace('.', '').padStart(18, ' ');
                    doubleEntry += totalIncVat.toFixed(5).replace('.', '').padStart(18, ' ');
                    doubleEntry += onlyVat.toFixed(5).replace('.', '').padStart(18, ' ');

                    // prime amounts i.e PA = BA if currency is MUR
                    doubleEntry += totalIncVat.toFixed(5).replace('.', '').padStart(18, ' ');
                    doubleEntry += totalIncVat.toFixed(5).replace('.', '').padStart(18, ' ');
                    doubleEntry += onlyVat.toFixed(5).replace('.', '').padStart(18, ' ');

                    // ///////////// VAT CODE
                    doubleEntry += productCodes.Tax_Code.trim().padEnd(50, ' ');

                    // ///////// Currency Code - MUR
                    doubleEntry += "MUR".padEnd(10, ' ');

                    // ////////// Currency Rate 
                    doubleEntry += "100000".padStart(18, ' ');

                    // ////////// DR/CR
                    if (!isCreditNote) {
                        let code = glCode.trim();
                        doubleEntry += (code == 50042 || code == '62121' || code == '26060092') ? "CR" : "DR";
                    }
                    else {
                        let code = glCode.trim();
                        doubleEntry += (code == 50042 || code == '62121' || code == '26060092') ? "DR" : "CR";
                    }

                    doubleEntry += "\n";
                }

                // //////////////////////////////////////////// Header Row
                {
                    // // H - For Header
                    headerRow += "H";

                    // Company Code
                    headerRow += "TL";

                    // customer code - todo
                    const customerCode = invoice.Customer_Code ? invoice.Customer_Code.padEnd(20, ' ') :  "".padEnd(20, ' ');
                    headerRow += customerCode;

                    // transaction Type
                    const isCreditNote = invoice.Credit_Note;
                    headerRow += isCreditNote ? "CR" : "IN";

                    // Item Reference - ticket number - todo make it 7 ch in zoho
                    const invRef = invoice.Invoice_Reference ? invoice.Invoice_Reference : "".padEnd(8, ' ');
                    const invArr = invRef.split("");
                    invArr[3] = refNo;
                    const invoiceReference = invArr.join("");
                    headerRow += invoiceReference;

                    //Reason Code
                    const reasonCode = "".padEnd(2, ' ');
                    headerRow += reasonCode;

                    //Transaction Date
                    const transDateObj = new Date(invoice.Created_Time);
                    const transDate = String(transDateObj.getDate()).padStart(2, '0') + String(transDateObj.getMonth() + 1).padStart(2, '0') + String(transDateObj.getFullYear());
                    headerRow += transDate;

                    // Document Date
                    const docDateObj = new Date();
                    const docDate = String(docDateObj.getDate()).padStart(2, '0') + String(docDateObj.getMonth() + 1).padStart(2, '0') + String(docDateObj.getFullYear());
                    headerRow += docDate;

                    // Amounts
                    //base amounts
                    headerRow += totalIncVat.toFixed(5).replace('.', '').padStart(18, ' ');
                    headerRow += totalExcVat.toFixed(5).replace('.', '').padStart(18, ' ');
                    headerRow += onlyVat.toFixed(5).replace('.', '').padStart(18, ' ');

                    // prime amounts i.e PA = BA if currency is MUR
                    headerRow += totalIncVat.toFixed(5).replace('.', '').padStart(18, ' ');
                    headerRow += onlyTicketAmount.padStart(18, ' ');
                    headerRow += onlyVat.toFixed(5).replace('.', '').padStart(18, ' ');

                    // posting Period
                    transDateObj.setMonth(transDateObj.getMonth() + 7);
                    const postingYear = transDateObj.getFullYear().toString().substring(2);
                    const postingMonth = transDateObj.getMonth() < 10 ? `0${transDateObj.getMonth()}` : `${transDateObj.getMonth()}`;
                    const postingPeriod = `1${postingYear}${postingMonth}`;
                    headerRow += postingPeriod.padStart(5, ' ');

                    // Description - Invoice/Credit Note
                    headerRow += (invoice.Credit_Note ? "Credit Note" : "Invoice").padEnd(15, ' ');

                    // Currency - MUR
                    headerRow += "MUR";

                    // Currency Rate
                    headerRow += "100000".padStart(18, ' ');

                    // VAT Code
                    headerRow += headerVatCode.padEnd(50, ' ');


                    headerRow += "\n";
                }

                fileContent += headerRow + doubleEntry + detailRows;
                headerRow = "";
                detailRows = "";
                doubleEntry = "";
                /////
                totalIncVat = 0;
                totalExcVat = 0;
                onlyVat = 0;
                /////
                lineNo++;
                headerVatCode = "ZER";
                refNo++;
              
            }
        })
    });


    console.log("fileContent ->", fileContent);
    fs.writeFileSync("files/interface.txt", fileContent, (err) => {
        if (err) {
            console.log("Error While creating File", err);
        }
        else {
            console.log("File Generated Successfully");
        }
    });



    // Define a route to handle file downloads


    const filePath = path.join(__dirname, '../files', 'interface.txt');
    console.log("__dirname", filePath);

    // Send the file as a response
    return res.sendFile(filePath, (err) => {
        if (err) {
            console.error('Error sending file:', err);
            res.status(err.status).end();
        } else {
            console.log('File sent successfully');
        }
    });

    // return res.json({
    //     success: true,
    //     message: "Data Received Successfully",
    //     data: fileContent
    // });
}