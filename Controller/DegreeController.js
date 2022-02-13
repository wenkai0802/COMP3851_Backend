const { poolPromise, sql } = require("../database.js");
class DegreeController {
  static async getDegreeByCampus(req, res, next) {
    try {
      const campusId = req.query.campusId;
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

      res.json({ status: "success", results, rowsAffected: rowsAffected[0] });
    } catch (error) {
      console.log(error);
      res.status(404).json({ status: "failed", message: error.message });
    }
  }
  static async getDegreeById(req, res, next) {
    try {
      const degreeId = req.params.degreeId;

      const pool = await poolPromise;
      const result = await pool
        .request()
        .input("Degree_Id", degreeId)
        .query("SELECT * FROM Degree WHERE Degree_ID = @Degree_Id");

      const { recordset, rowsAffected } = result;
      res.json({ result: recordset[0], rowsAffected: rowsAffected[0] });
    } catch (error) {
      console.log(error);
      res.status(404).json({ status: "failed", message: error.message });
    }
  }
  static async addDegree(req, res, next) {
    try {
      const { degreeId, degreeName, totalCredit, minYear, maxYear } = req.body;
      const pool = await poolPromise;
      const result = await pool
        .request()
        .input("Degree_Id", degreeId)
        .input("Degree_Name", degreeName)
        .input("Total_Credit", totalCredit)
        .input("Min_Year", minYear)
        .input("Max_Year", maxYear)
        .query(
          "INSERT INTO Degree VALUES(@Degree_Id,@Degree_Name,@Total_Credit,@Min_Year,@Max_Year)"
        );

      res.json({ status: "success" });
    } catch (error) {
      res.status(409).json({ status: "failed", error: error.message });
    }
  }
  static async updateDegree(req, res, next) {
    try {
      const { degreeId, degreeName, totalCredit, minYear, maxYear } = req.body;
      const pool = await poolPromise;
      const result = await pool
        .request()
        .input("Degree_Id", degreeId)
        .input("Degree_Name", degreeName)
        .input("Total_Credit", totalCredit)
        .input("Min_Year", minYear)
        .input("Max_Year", maxYear)
        .query(
          "UPDATE Degree " +
            "SET Degree_Name = @Degree_Name,Total_Credit = @Total_Credit,Min_Year = @Min_Year, Max_Year = @Max_Year " +
            "WHERE Degree_ID = @Degree_Id"
        );

      if (result.rowsAffected[0] === 0) throw Error("Degree ID not found"); //if update not occured
      res.json({ status: "success" });
    } catch (error) {
      res.status(409).json({ status: "failed", error: error.message });
    }
  }
  static async getDegreeCourse(req, res, next) {
    try {
      const { degreeId } = req.params;

      //grab course data with assumed knowledge first, then course availability
      const pool1 = await poolPromise;
      const result1 = await pool1
        .request()
        .input("Degree_Id", degreeId)
        .query(
          "SELECT Course.Course_ID,Course_Name,Unit,Required_Unit,Alternative1,Alternative2,[Type] FROM Course " +
            "LEFT JOIN Course_Assumed_Knowledge ON Course.Course_ID = Course_Assumed_Knowledge.Course_ID " +
            "INNER JOIN Degree_Course ON Course.Course_ID = Degree_Course.Course_ID " +
            "WHERE Degree_ID = @Degree_Id " +
            "ORDER BY Course.Course_ID"
        );

      const pool2 = await poolPromise;
      const result2 = await pool2
        .request()
        .input("Degree_Id", degreeId)
        .query(
          "SELECT Course.Course_ID,Available_Year,Semester FROM Course " +
            "INNER JOIN Degree_Course ON Course.Course_ID = Degree_Course.Course_ID " +
            "INNER JOIN Course_Availability on Course_Availability.Course_ID = Course.Course_ID " +
            "WHERE Degree_ID = @Degree_Id " +
            "ORDER BY Course.Course_ID"
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

      res.json({ Degree_ID: degreeId, result: courseList });
    } catch (error) {
      console.log(error);
      res.status(404).json({ status: "failed", error: error.message });
    }
  }
  static async addDegreeCourse(req, res, next) {
    try {
      const { courseId, type } = req.body;
      const degreeId = req.params.degreeId;

      const pool = await poolPromise;
      const result = await pool
        .request()
        .input("Degree_Id", degreeId)
        .input("Course_Id", courseId)
        .input("Type", type)
        .query(
          "INSERT INTO Degree_Course " + "VALUES(@Degree_Id,@Course_Id,@Type)"
        );

      res.json({ status: "success" });
    } catch (error) {
      console.log(error);
      res.status(409).json({ status: "failed", error: error.message });
    }
  }
  static async deleteDegreeCourse(req, res, next) {
    try {
      const { courseId } = req.query;
      const degreeId = req.params.degreeId;
      if (!courseId || !degreeId)
        throw Error("Degree ID or Course ID not provided");

      const pool = await poolPromise;
      const result = await pool
        .request()
        .input("Degree_Id", degreeId)
        .input("Course_Id", courseId)
        .query(
          "delete from Degree_Course where Course_ID=@Course_Id and Degree_ID=@Degree_Id"
        );
      res.json({ status: "success" });
    } catch (error) {
      res.status(404).json({ status: "failed", error: error.message });
    }
  }
}

module.exports = DegreeController;
