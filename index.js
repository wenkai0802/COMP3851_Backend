require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const DegreeRouter = require("./Routes/DegreeRoute");
const CourseRouter = require("./Routes/CourseRoute");
const AdminRouter = require("./Routes/AdminRoute");
const MajorRouter = require("./Routes/MajorRoute");
const session = require("express-session");
const CampusRouter = require("./Routes/CampusRoute");

const environment = process.env.NODE_ENV;
app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.set("trust proxy", 1);
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: environment === "production", maxAge: 1000 * 60 * 60 },
  })
);
app.use(express.json());
app.use("/api/degree", DegreeRouter);
app.use("/api/course", CourseRouter);
app.use("/api/admin", AdminRouter);
app.use("/api/campus", CampusRouter);
app.use("/api/major", MajorRouter);
app.listen(process.env.PORT || 5000, () => {
  console.log("listening to port 5000");
});
