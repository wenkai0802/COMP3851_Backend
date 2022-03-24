const { poolPromise, sql } = require("../database.js");
class CourseController {
  static async getCourseList(req, res, next) {
    try {
      let { search, level, unit } = req.query;

      const pool = await poolPromise;
      let result;
      let queryString = "SELECT Course_ID,Course_Name FROM Course "; //general query
      if (search && search != "") {
        //if search variable exist, search by id and name
        search = "%" + search + "%";
        queryString += `WHERE Course_ID LIKE '${search}' OR Course_Name LIKE '${search}' `;
      } else if (level || unit) {
        if (level && unit)
          //get record by both of the field
          queryString += `WHERE SUBSTRING(Course_ID,5,1) IN (${level.map(
            (lvl) => `'${lvl.replace(/0/g, "")}'` //replace all 0 with empty string eg it will find all course with id that have specific integer value at 5th position
          )}) AND Unit in (${unit.map((u) => `'${u}'`)})`;
        else if (level)
          //get by level field
          queryString += `WHERE SUBSTRING(Course_ID,5,1) IN (${level.map(
            (lvl) => `'${lvl.replace(/0/g, "")}'`
          )})`;
        //get by unit field
        else queryString += `WHERE Unit in (${unit.map((u) => `'${u}'`)})`;
      }
      result = await pool.request().query(queryString);

      const { recordset, rowsAffected } = result;

      res.json({ result: recordset, rowsAffected: rowsAffected[0] });
    } catch (error) {
      res.status(404).json({ status: "failed", error: error.message });
    }
  }
  static async addCourse(req, res, next) {
    try {
      const { courseId, courseName, unit, requiredUnit } = req.body;
      if (courseId === "") throw new Error("Id cannot be empty");
      const pool = await poolPromise;
      const result = await pool
        .request()
        .input("Course_Id", courseId)
        .input("Course_Name", courseName)
        .input("Unit", unit)
        .input("Required_Unit", requiredUnit)
        .query(
          "INSERT INTO Course VALUES(@Course_Id,@Course_Name,@Unit,@Required_Unit)"
        );
      res.status(201).json({ status: "success" });
    } catch (error) {
      res.status(409).json({ status: "failed", error: error.message });
    }
  }
  static async updateCourse(req, res, next) {
    try {
      const { courseId, courseName, unit, requiredUnit } = req.body;
      const pool = await poolPromise;
      const result = await pool
        .request()
        .input("Course_Id", courseId)
        .input("Course_Name", courseName)
        .input("Unit", unit)
        .input("Required_Unit", requiredUnit)
        .query(
          "UPDATE Course " +
            "SET Course_Name = @Course_Name," +
            "Unit = @Unit," +
            "Required_Unit = @Required_Unit " +
            "WHERE Course_ID = @Course_Id"
        );
      res.json({ status: "success" });
    } catch (error) {
      res.status(409).json({ status: "failed", error: error.message });
    }
  }
  static async getCourseById(req, res, next) {
    try {
      const courseId = req.params.courseId;
      const pool = await poolPromise;
      const result = await pool
        .request()
        .input("Course_Id", courseId)
        .query("SELECT * FROM Course WHERE Course_ID = @Course_Id");
      if (result.rowsAffected[0] === 0) throw Error("Course ID not found");
      res.json({ result: result.recordset[0] });
    } catch (error) {
      res.status(404).json({ status: "failed", error: error.message });
    }
  }
  static async deleteCourseById(req, res, next) {
    try {
      const { courseIds } = req.query;
      const pool = await poolPromise;
      const result = await pool
        .request()
        .query(
          `DELETE FROM Course WHERE Course_ID in (${courseIds.map(
            (id) => `'${id}'`
          )})`
        );

      res.json({ status: "success" });
    } catch (error) {
      res.status(404).json({ status: "failed", error: error.message });
    }
  }
  static async getAssumedKnowledge(req, res, next) {
    try {
      const courseId = req.params.courseId;
      const pool = await poolPromise;
      const result = await pool
        .request()
        .input("Course_Id", courseId)
        .query(
          "SELECT AssumedKnowledge_ID,Alternative1,Alternative2 FROM Course_Assumed_Knowledge WHERE Course_ID = @Course_Id"
        );
      res.json({ Course_ID: courseId, AssumedKnowledge: result.recordset });
    } catch (error) {
      res.status(404).json({ status: "failed", error: error.message });
    }
  }
  static async addAssumedKnowledge(req, res, next) {
    try {
      const courseId = req.params.courseId;
      const { alternative1, alternative2 } = req.body;
      if (!alternative1)
        throw Error("Please provide course for Assumed Knowledge");
      const pool = await poolPromise;
      const result = await pool
        .request()
        .input("Course_Id", courseId)
        .input("Alternative1", alternative1)
        .input("Alternative2", alternative2)
        .query(
          "INSERT INTO Course_Assumed_Knowledge VALUES(@Course_Id,@Alternative1,@Alternative2) " +
            "SELECT SCOPE_IDENTITY() AS id;"
        );

      res.json({ status: "success", insertedId: result.recordset[0].id });
    } catch (error) {
      res.status(409).json({ status: "failed", error: error.message });
    }
  }
  static async deleteAssumedKnowledge(req, res, next) {
    try {
      const courseId = req.params.courseId;
      const assumedKnowledgeId = req.query.id;
      if (!assumedKnowledgeId)
        throw Error("Please provide assumed knowledge id");
      const pool = await poolPromise;
      const result = await pool
        .request()
        .input("AssumedKnowledge_Id", assumedKnowledgeId)
        .query(
          "DELETE FROM Course_Assumed_Knowledge WHERE AssumedKnowledge_ID = @AssumedKnowledge_Id"
        );
      if (result.rowsAffected[0] === 0) throw Error("id not found");
      res.json({ status: "success" });
    } catch (error) {
      res.status(404).json({ status: "failed", error: error.message });
    }
  }
  static async getCourseAvailability(req, res, next) {
    try {
      const courseId = req.params.courseId;
      const campusId = req.query.campusId;
      if (!campusId) throw Error("Please provide campus id");
      const pool = await poolPromise;
      const result = await pool
        .request()
        .input("Course_Id", courseId)
        .input("Campus_Id", campusId)
        .query(
          "SELECT Availability_ID,Available_Year,Semester FROM Course_Availability WHERE Course_ID = @Course_Id AND Campus_ID=@Campus_Id"
        );
      res.json({ Course_ID: courseId, result: result.recordset });
    } catch (error) {
      res.status(404).json({ status: "failed", error: error.message });
    }
  }
  static async addCourseAvailability(req, res, next) {
    try {
      const courseId = req.params.courseId;
      const { campusId, year, semester } = req.body;
      const pool = await poolPromise;
      const result = await pool
        .request()
        .input("Course_Id", courseId)
        .input("Campus_Id", campusId)
        .input("Year", year)
        .input("Semester", semester)
        .query(
          "INSERT INTO Course_Availability VALUES(@Campus_Id,@Course_Id,@Year,@Semester) " +
            "SELECT SCOPE_IDENTITY() AS id;"
        );

      res.json({ status: "success", insertedId: result.recordset[0].id });
    } catch (error) {
      res.status(409).json({ status: "failed", error: error.message });
    }
  }
  static async deleteCourseAvailability(req, res, next) {
    try {
      const courseId = req.params.courseId;
      const availabilityId = req.query.id;
      if (!availabilityId) throw Error("Please provide availability ID");
      const pool = await poolPromise;
      const result = await pool
        .request()
        .input("Course_Id", courseId)
        .input("Availability_Id", availabilityId)
        .query(
          "DELETE FROM Course_Availability WHERE Availability_ID = @Availability_Id"
        );
      if (result.rowsAffected[0] === 0)
        throw Error("Availability ID not found");
      res.json({ status: "success" });
    } catch (error) {
      res.status(404).json({ status: "failed", error: error.message });
    }
  }
  static async getFilterOptions(req, res, next) {
    try {
      const pool = await poolPromise;
      const result = await pool
        .request()
        .query(
          "SELECT DISTINCT(SUBSTRING(Course_ID,5,1)) as Level FROM Course;" +
            "SELECT DISTINCT(Unit) as Unit FROM Course;"
        );

      let [Level, Unit] = result.recordsets;
      Level = Level.map((item) => item.Level + "000");
      Unit = Unit.map((item) => item.Unit);
      const response = [
        { name: "Level", options: Level },
        { name: "Unit", options: Unit },
      ];
      res.json({ result: response });
    } catch (error) {
      res.status(404).json({ status: "failed", error: error.message });
    }
  }
}

module.exports = CourseController;
