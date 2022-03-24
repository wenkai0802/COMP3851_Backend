const CampusController = require("../Controller/CampusController");
const authenticate = require("../Middleware/authenticate");
const CampusRouter = require("express").Router();

CampusRouter.get("/filterOptions", CampusController.getFilterOptions);
CampusRouter.route("/")
  .get(CampusController.getCampus)
  .post(authenticate, CampusController.addCampus)
  .put(authenticate, CampusController.updateCampus)
  .delete(authenticate, CampusController.deleteCampus);
CampusRouter.get("/:campusId", CampusController.getCampusById);
CampusRouter.route("/:campusId/degree")
  .get(CampusController.getDegreeByCampus)
  .post(authenticate, CampusController.addDegreeToCampus)
  .delete(authenticate, CampusController.deleteDegreeFromCampus);

module.exports = CampusRouter;
