const CampusController = require("../Controller/CampusController");
const authenticate = require("../Middleware/authenticate");
const CampusRouter = require("express").Router();

CampusRouter.route("/")
  .get(CampusController.getCampus)
  .post(authenticate, CampusController.addCampus)
  .delete(authenticate, CampusController.deleteCampus);
CampusRouter.route("/:campusId/degree")
  .get(CampusController.getDegreeByCampus)
  .post(authenticate, CampusController.addDegreeToCampus)
  .delete(authenticate, CampusController.deleteDegreeFromCampus);
CampusRouter.get("/filterOptions", CampusController.getFilterOptions);
module.exports = CampusRouter;
