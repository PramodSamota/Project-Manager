import { asyncHandler } from "../utils/async-handler.js";
import { ApiError } from "../utils/api-error.js";
import { validateObjectId } from "../utils/helper.js";
import { ProjectMember } from "../models/projectmember.models.js";

export const checkPermission = (roles = []) => {
  return asyncHandler(async (req, res, next) => {
    const userId = req.user_id;
    const { pid } = req.params;

    validateObjectId(pid, "project");
    const member = await ProjectMember.find({
      user: userId,
      project: pid,
    });

    if (!member) {
      throw new ApiError(404, "Project member not found");
    }

    const existinRole = member.role;
    res.role = existinRole;

    if (!roles.includes(existinRole)) {
      throw new ApiError(403, "Permision Denied");
    }

    next();
  });
};
