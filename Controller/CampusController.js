const { poolPromise, sql } = require("../database.js");
class CampusController {
  static async getCampus(req, res, next) {
    try {
      let { search, location } = req.query;
      const pool = await poolPromise;
      let result;
      let queryString = "SELECT * FROM Campus ";
      //if query is exists, then search by the name and ID
      //else retrieve all records
      if (search && search != "") {
        search = "%" + search + "%";

        queryString += `WHERE Campus_ID LIKE '${search}' OR Campus_Name LIKE '${search}' `;
      } else if (location) {
        queryString += `WHERE Location IN (${location.map(
          (loc) => `'${loc}'`
        )}) `;
      }

      result = await pool.request().query(queryString);

      const { recordset, rowsAffected } = result;

      res.json({ result: recordset, rowsAffected: rowsAffected[0] });
    } catch (error) {
      res.status(404).json({ status: "failed", error: error.message });
    }
  }
  static async addCampus(req, res, next) {
    try {
      const { campusId, campusName } = req.body;
      const pool = await poolPromise;

      const result = await pool
        .request()
        .input("Campus_Id", campusId)
        .input("Campus_Name", campusName)
        .query("INSERT INTO Campus VALUES(@Campus_Id,@Campus_Name)");
      res.json({ status: "success" });
    } catch (error) {
      res.status(409).json({ status: "failed", error: error.message });
    }
  }
  static async deleteCampus(req, res, next) {
    try {
      const { campusIds } = req.query;
      const pool = await poolPromise;
      const result = await pool
        .request()
        .query(
          `DELETE FROM Campus WHERE Campus_ID in (${campusIds.map(
            (id) => `'${id}'`
          )})`
        );

      res.json({ status: "success" });
    } catch (error) {
      res.status(404).json({ status: "failed", error: error.message });
    }
  }
  static async getDegreeByCampus(req, res, next) {
    try {
      const campusId = req.params.campusId;
      const pool = await poolPromise;
      const result = await pool
        .request()
        .input("campus_id", campusId)
        .query(
          "SELECT Degree.Degree_ID,Degree_Name FROM Degree " +
            "inner join Campus_Degree  ON  Degree.Degree_ID = Campus_Degree.Degree_ID " +
            "WHERE Campus_ID = @campus_id"
        );
      const { recordset: results, rowsAffected } = result;

      if (rowsAffected[0] === 0)
        throw Error("No record founded for the campus id");

      res.json({
        result: results,
        rowsAffected: rowsAffected[0],
      });
    } catch (error) {}
  }
  static async addDegreeToCampus(req, res, next) {
    try {
      const campusId = req.params.campusId;
      const degreeId = req.body.degreeId;
      const pool = await poolPromise;
      const result = await pool
        .request()
        .input("Campus_Id", campusId)
        .input("Degree_Id", degreeId)
        .query("INSERT INTO Campus_Degree VALUES(@Degree_Id,@Campus_Id)");
      res.json({ status: "success" });
    } catch (error) {
      res.status(409).json({ status: "failed", error: error.message });
    }
  }
  static async deleteDegreeFromCampus(req, res, next) {
    try {
      const campusId = req.params.campusId;
      const degreeId = req.body.degreeId;
      const pool = await poolPromise;
      const result = await pool
        .request()
        .input("Campus_Id", campusId)
        .input("Degree_Id", degreeId)
        .query(
          "DELETE FROM Campus_Degree WHERE Campus_ID=@Campus_Id AND Degree_ID=@Degree_Id"
        );
      res.json({ status: "success" });
    } catch (error) {
      res.status(409).json({ status: "failed", error: error.message });
    }
  }
  static async getFilterOptions(req, res, next) {
    try {
      const pool = await poolPromise;
      const result = await pool
        .request()
        .query("SELECT DISTINCT(Location) as location FROM Campus");
      let { recordset } = result;
      recordset = recordset.map((record) => {
        return record.location;
      });
      const response = [{ name: "Location", options: recordset }];
      res.json({ result: response });
    } catch (error) {
      res.status(409).json({ status: "failed", error: error.message });
    }
  }
}
module.exports = CampusController;
