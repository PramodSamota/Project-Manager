import { asyncHandler } from "../utils/async-handler.js";
import { ApiError } from "../utils/api-error.js";
import { validateObjectId } from "../utils/helper.js";
import { ProjectMember } from "../models/projectmember.models.js";
import { Project } from "../models/project.models.js";

export const checkPermission = (roles = []) => {
  return asyncHandler(async (req, res, next) => {
    const userId = req.user._id;
    const { pid } = req.params;

    if (!userId) {
      throw new ApiError(401, "Unauthorized - User not identified");
    }

    validateObjectId(pid, "project");

    const project = await Project.findById(pid);

    if (!project) {
      throw new ApiError(404, "Project not found");
    }
    const member = await ProjectMember.findOne({
      user: userId,
      project: pid,
    });

    if (!member) {
      throw new ApiError(404, "Project member not found");
    }

    const existinRole = member.role;
    res.role = existinRole;
    // console.log(member);
    if (!roles.includes(existinRole)) {
      throw new ApiError(403, "Permision Denied");
    }

    next();
  });
};
