exports.createInterface = (req, res) => {
    console.log("createInterface");
    const data = req.body;
    console.log(data);

    return res.json({
        success: true
    });
}