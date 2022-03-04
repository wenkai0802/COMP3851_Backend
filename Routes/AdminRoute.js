const AdminController = require("../Controller/AdminController.js");

const AdminRouter = require("express").Router();

AdminRouter.route("/login").post(AdminController.adminLogin);
AdminRouter.post("/logout", AdminController.adminLogout);
AdminRouter.get("/", AdminController.getAdmin);
module.exports = AdminRouter;
