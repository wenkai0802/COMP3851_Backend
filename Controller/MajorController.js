const { poolPromise, sql } = require("../database.js");
class MajorController {
  static async getMajor(req, res, next) {
    try {
      let { search } = req.query;
      const pool = await poolPromise;
      let result;
      //if search is exists, then search by the name and ID
      //else retrieve all records
      let queryString = "SELECT Major_ID,Major_Name FROM Major ";
      if (search && search != "") {
        search = "%" + search + "%";
        queryString += `WHERE Major_ID LIKE '${search}' OR Major_Name LIKE '${search}' `;
      }

      result = await pool.request().query(queryString);

      const { recordset: results, rowsAffected } = result;

      res.json({
        result: results,
        rowsAffected: rowsAffected[0],
      });
    } catch (error) {
      console.log(error);
      res.status(404).json({ status: "failed", message: error.message });
    }
  }
  static async getMajorById(req, res, next) {
    try {
      const majorId = req.params.majorId;

      const pool = await poolPromise;
      const result = await pool
        .request()
        .input("Major_Id", majorId)
        .query("SELECT * FROM Major WHERE Major_ID = @Major_Id");

      const { recordset, rowsAffected } = result;
      res.json({ result: recordset[0], rowsAffected: rowsAffected[0] });
    } catch (error) {
      console.log(error);
      res.status(404).json({ status: "failed", message: error.message });
    }
  }
  static async addMajor(req, res, next) {
    try {
      const { majorName, totalUnit } = req.body;
      const pool = await poolPromise;
      const result = await pool
        .request()
        .input("Major_Name", majorName)
        .input("Total_Unit", totalUnit)
        .query(
          "INSERT INTO Major VALUES(@Major_Name,@Total_Unit) " +
            "SELECT SCOPE_IDENTITY() AS id;"
        );

      res.json({ status: "success", insertedId: result.recordset[0].id });
    } catch (error) {
      res.status(409).json({ status: "failed", error: error.message });
    }
  }
  static async deleteMajor(req, res, next) {
    try {
      const { majorIds } = req.query;
      const pool = await poolPromise;
      const result = await pool
        .request()
        .query(
          `DELETE FROM Major WHERE Major_ID in (${majorIds.map(
            (id) => `'${id}'`
          )})`
        );

      res.json({ status: "success" });
    } catch (error) {
      res.status(404).json({ status: "failed", error: error.message });
    }
  }
  static async updateMajor(req, res, next) {
    try {
      const { majorId, majorName, totalUnit } = req.body;
      if (!majorId) throw Error("Please provide Major ID");
      const pool = await poolPromise;
      const result = await pool
        .request()
        .input("Major_Id", majorId)
        .input("Major_Name", majorName)
        .input("Total_Unit", totalUnit)
        .query(
          //chkecup with wenkai whether query should be done major with major name
          "UPDATE Major " +
            "SET Major_Name = @Major_Name,Total_Unit = @Total_Unit " +
            "WHERE Major_Id = @Major_Id"
        );

      if (result.rowsAffected[0] === 0) throw Error("Major ID not found"); //if update not occured
      res.json({ status: "success" });
    } catch (error) {
      res.status(409).json({ status: "failed", error: error.message });
    }
  }
  static async getMajorCourse(req, res, next) {
    try {
      const { majorId } = req.params;

      //grab course data with assumed knowledge first, then course availability
      const pool1 = await poolPromise;
      const result1 = await pool1
        .request()
        .input("Major_Id", majorId)
        .query(
          "SELECT Course.Course_ID,Course_Name,Unit,Required_Unit,Alternative1,Alternative2,[Type] FROM Course " +
            "LEFT JOIN Course_Assumed_Knowledge ON Course.Course_ID = Course_Assumed_Knowledge.Course_ID " +
            "INNER JOIN Major_Course ON Course.Course_ID = Major_Course.Course_ID " +
            "WHERE Major_ID = @Major_Id " +
            "ORDER BY Type,Course.Course_ID"
        );

      const pool2 = await poolPromise;
      const result2 = await pool2
        .request()
        .input("Major_Id", majorId)
        .query(
          "SELECT Course.Course_ID,Available_Year,Semester FROM Course " +
            "INNER JOIN Major_Course ON Course.Course_ID = Major_Course.Course_ID " +
            "INNER JOIN Course_Availability on Course_Availability.Course_ID = Course.Course_ID " +
            "WHERE Major_ID = @Major_Id " +
            "ORDER BY Type,Course.Course_ID"
        );
      const resultWithAK = result1.recordset;
      const resultWithAvailability = result2.recordset;
      var index = 0; //variable to transverse through courseList
      var courseList = [];
      // process assumed knowledge by group them into array respectively
      for (var i = 0; i < resultWithAK.length; i++) {
        //if the previous inserted course in courseList was same as the current course in the resultWithAK
        //append the assumed knowledge into the list
        //otherwise, create new instance of course and added into the courseList

        if (
          index > 0 &&
          courseList[index - 1].Course_ID === resultWithAK[i].Course_ID
        ) {
          const { Alternative1, Alternative2 } = resultWithAK[i];
          courseList[index - 1].Assumed_Knowledge.push({
            Alternative1,
            Alternative2,
          });
        } else {
          const {
            Course_ID,
            Course_Name,
            Unit,
            Required_Unit,
            Alternative1,
            Alternative2,
            Type,
          } = resultWithAK[i];
          courseList[index++] = {
            Course_ID,
            Course_Name,
            Type,
            Unit,
            Required_Unit,
            Assumed_Knowledge: [{ Alternative1, Alternative2 }],
            Availability: [],
          };
        }
      }

      index = 0;
      var x = 0;
      //add course available year and semester into courseList
      while (x < resultWithAvailability.length) {
        const course = resultWithAvailability[x];
        //if the course(with availability) match the courseList item
        //append the availability data(year and semester) into the courseList item
        //as both query were sorted in the same way (ORDER BY Course_ID) it will have same order
        if (course.Course_ID === courseList[index].Course_ID) {
          const { Available_Year, Semester } = course;
          courseList[index].Availability.push({
            year: Available_Year,
            semester: Semester,
          });
          x++;
        } else index++;
      }

      res.json({ Major_ID: majorId, result: courseList });
    } catch (error) {
      console.log(error);
      res.status(404).json({ status: "failed", error: error.message });
    }
  }
  static async addMajorCourse(req, res, next) {
    try {
      const { courseId, type } = req.body;
      const majorId = req.params.majorId;

      const pool = await poolPromise;
      const result = await pool
        .request()
        .input("Major_Id", majorId)
        .input("Course_Id", courseId)
        .input("Type", type)
        .query(
          "INSERT INTO Major_Course " + "VALUES(@Major_Id,@Course_Id,@Type)"
        );

      res.json({ status: "success" });
    } catch (error) {
      console.log(error);
      res.status(409).json({ status: "failed", error: error.message });
    }
  }
  static async deleteMajorCourse(req, res, next) {
    try {
      const { courseId } = req.query;
      const majorId = req.params.majorId;
      if (!courseId || !majorId)
        throw Error("Major ID or Course ID not provided");

      const pool = await poolPromise;
      const result = await pool
        .request()
        .input("Major_Id", majorId)
        .input("Course_Id", courseId)
        .query(
          "delete from Major_Course where Course_ID=@Course_Id and Major_ID=@Major_Id"
        );
      res.json({ status: "success" });
    } catch (error) {
      res.status(404).json({ status: "failed", error: error.message });
    }
  }
}

module.exports = MajorController;
