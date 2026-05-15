"use strict";

const express = require("express");
const router = express.Router();
const { Spot, Booking } = require("./models");
router.get("/", async (request, response) => {
   const spots = await Spot.find({});
   let table = "<table><tr><th>Address</th><th>City</th><th>Price</th><th>Host</th><th></th></tr>";
   for (let i = 0; i < spots.length; i++) {
      table += "<tr>";
      table += "<td>" + spots[i].address + "</td>";
      table += "<td>" + spots[i].city + "</td>";
      table += "<td>$" + spots[i].price + "/hr</td>";
      table += "<td>" + spots[i].hostName + "</td>";
      table += "<td><a href='/spots/book/" + spots[i]._id + "'>Book</a></td>";
      table += "</tr>";
   }
   table += "</table>";
   response.render("browse", { table: table, count: spots.length });
});

router.get("/list", function(request, response) {
   response.render("listSpot");
});

router.get("/api/suggest", async (request, response) => {
   const q = request.query.q;
   if (!q || q.length < 3) {
      response.json({ results: [] });
      return;
   }
   
   const url = "https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&countrycodes=us&limit=6&q=" + encodeURIComponent(q + ", Maryland");
   const res = await fetch(url, { headers: { "User-Agent": "Parkly/1.0" } });
   const data = await res.json();
   const results = [];
   
   for (let i = 0; i < data.length; i++) {
      const a = data[i].address;
      if (!a || a.state !== "Maryland") continue;
      const city = a.city || a.town || a.village || a.county || "";
      const road = a.road || data[i].display_name.split(",")[0];
      const fullAddr = (a.house_number ? a.house_number + " " : "") + road;
      
      results.push({
         label: data[i].display_name,
         address: fullAddr,
         city: city,
         lat: Number(data[i].lat),
         lon: Number(data[i].lon)
      });
   }
   response.json({ results: results });
});

router.post("/list", async (request, response) => {
   const spot = new Spot({
      
      address: request.body.address,
      city: request.body.city,
      lat: Number(request.body.lat),
      lon: Number(request.body.lon),
      price: Number(request.body.price),
      hostName: request.body.hostName,
      description: request.body.description
      
   });
   await spot.save();

   response.render("result", {
      heading: "Listing posted",
      message: "Your driveway at " + request.body.address + " is now available."
   });
});

router.get("/book/:id", async (request, response) => {
   const spot = await Spot.findById(request.params.id);
   if (!spot) {
      response.render("result", { heading: "Not found", message: "That spot does not exist." });
      return;
   }
   let coords = null;
   let weather = null;
   
   if (spot.lat && spot.lon) {
      coords = { lat: spot.lat, lon: spot.lon };
      const url = "https://api.open-meteo.com/v1/forecast?latitude=" + spot.lat + "&longitude=" + spot.lon + "&current=temperature_2m,weather_code&temperature_unit=fahrenheit";
      const res = await fetch(url);
      const data = await res.json();
      
      if (data.current) {
         const code = data.current.weather_code;
         let desc = "Unknown";
         if (code === 0) desc = "Clear";
         else if (code <= 3) {
            desc = "Partly cloudy";
         }
         else if (code <= 48) {
            desc = "Foggy";
         }
         else if (code <= 67) {
            desc = "Rain";
         }
         else if (code <= 77) {
            desc = "Snow";
         }
         else if (code <= 82) {
            desc = "Showers";
         }
         else if (code <= 99) {
            desc = "Thunderstorm";
         }
         weather = { temp: Math.round(data.current.temperature_2m), desc: desc };
      }
   }
   response.render("bookSpot", { spot: spot, weather: weather, coords: coords });
});

router.post("/book/:id", async (request, response) => {
   const spot = await Spot.findById(request.params.id);
   const hours = Number(request.body.hours);
   const total = spot.price * hours;

   const booking = new Booking({
      spotId: spot._id,
      spotAddress: spot.address,
      driverName: request.body.driverName,
      driverEmail: request.body.driverEmail,
      plate: request.body.plate,
      hours: hours,
      total: total
   });
   await booking.save();

   response.render("result", {
      heading: "Booked",
      message: request.body.driverName + " booked " + hours + " hours at " + spot.address + " for $" + total + "."
   });
});

router.get("/mybookings", function(request, response) {
   response.render("lookup");
});

router.post("/mybookings", async (request, response) => {
   const bookings = await Booking.find({ driverEmail: request.body.driverEmail });
   let table = "<table><tr><th>Address</th><th>Plate</th><th>Hours</th><th>Total</th></tr>";
   for (let i = 0; i < bookings.length; i++) {
      table += "<tr>";
      table += "<td>" + bookings[i].spotAddress + "</td>";
      table += "<td>" + bookings[i].plate + "</td>";
      table += "<td>" + bookings[i].hours + "</td>";
      table += "<td>$" + bookings[i].total + "</td>";
      table += "</tr>";
   }
   table += "</table>";
   response.render("bookings", { table: table, count: bookings.length, email: request.body.driverEmail });
});

module.exports = router;
