"use strict";

const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const dns = require("dns");
dns.setServers(["1.1.1.1", "8.8.8.8"]);

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const portNumber = process.env.PORT || process.argv[2] || 3000;

const app = express();
const routes = require("./routes");

app.set("view engine", "ejs");
app.set("views", path.resolve(__dirname, "templates"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.resolve(__dirname, "public")));

mongoose.connect(process.env.MONGO_CONNECTION_STRING);

app.get("/", function(request, response) {
   response.render("index");
});

app.use("/spots", routes);

app.listen(portNumber);
console.log("Web server started and running at http://localhost:" + portNumber);
console.log("Type stop to shutdown the server: ");

process.stdin.setEncoding("utf8");
process.stdin.on("readable", () => {
   const dataInput = process.stdin.read();
   if (dataInput !== null) {
      const command = dataInput.trim();
      if (command === "stop") {
         console.log("Shutting down the server");
         process.exit(0);
      } else {
         console.log("Invalid command: " + command);
      }
      process.stdin.resume();
   }
});
