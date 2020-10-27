const express = require("express");
const path = require("path");
const hbs = require("express-handlebars");
const dashboardRoutes = require("./routes/dashboardRoutes");

// Initialize express app
const app = express();
const port = process.env.port || 3000;

// configure handlebars as the view engine of the app
app.set("view engine", "hbs");
app.set("views", "./views");
// configure handlebars itself
app.engine("hbs", hbs({ 
    layoutsDir: path.join(__dirname, "/views/layouts"),     // set layout dir
    extname: "hbs" // set file extension of handlebars template files
}));

// define routers
app.use("/dashboard/", dashboardRoutes);

// default route will (at this stage) redirect the user to the dashboard without authentication
app.get("/", (req, res) => {
    res.redirect("/dashboard");
});

// start server
app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});