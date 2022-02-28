require("dotenv").config();
const { poolPromise, sql } = require("../database.js");
const bcrypt = require("bcrypt");
class AdminController {
  static async adminLogin(req, res, next) {
    try {
      //const { adminId, password } = req.body;
      const adminId = req.body.adminId
      const password = req.body.password
      const pool = await poolPromise;
      const result = await pool
        .request()
        .input("Admin_Id", adminId)
        .query("SELECT * FROM Admin WHERE Admin_ID = @Admin_Id");
      const [row] = result.rowsAffected;
      if (row === 0) throw Error("Admin ID not exist");
      const [{ Admin_Name, Campus_ID, Password }] = result.recordset;
      const isPasswordCorrect = await bcrypt.compare(password, Password);

      if (!isPasswordCorrect) throw Error("Password Incorrect");
      req.session.user = { Admin_Name, Campus_ID };
      res.json({ status: "success" });
    } catch (error) {
      res.status(401).json({ status: "failed", error: error.message });
    }
  }
  static async adminRegister(req, res, next) {
    try {
      const { adminId, password, campusId, adminName } = req.body;
      const hashedPassword = await bcrypt.hash(
        password,
        process.env.SALT_ROUND
      );
      const pool = await poolPromise;
      const result = await pool
        .request()
        .input("Admin_Id", adminId)
        .input("Password", hashedPassword)
        .input("Admin_Name", adminName)
        .input("Campus_Id", campusId)
        .query(
          "INSERT INTO Admin VALUES(@Admin_Id,@Admin_Name,@Campus_Id,@Password)"
        );
      res.json({ status: "success" });
    } catch (error) {
      res.status(401).json({ status: "failed", error: error.message });
    }
  }
  static async adminLogout(req, res, next) {
    req.session.user = null;
    res.json({ status: "successfully log out" });
  }
  static getAdmin(req, res, next) {
    res.json({ ...req.session.user });
  }
}

module.exports = AdminController;
