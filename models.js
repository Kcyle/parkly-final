const mongoose = require("mongoose");

const spotSchema = new mongoose.Schema({
   address: String,
   city: String,
   lat: Number,
   lon: Number,
   price: Number,
   hostName: String,
   description: String
});

const bookingSchema = new mongoose.Schema({
   spotId: mongoose.Schema.Types.ObjectId,
   spotAddress: String,
   driverName: String,
   driverEmail: String,
   plate: String,
   hours: Number,
   total: Number
});

const Spot = mongoose.model("Spot", spotSchema);
const Booking = mongoose.model("Booking", bookingSchema);

module.exports = { Spot, Booking };
