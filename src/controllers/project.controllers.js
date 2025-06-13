import { asyncHandler } from "../utils/async-handler.js";
import { ApiError } from "../utils/api-error.js";
import { Project } from "../models/project.models.js";
import mongoose from "mongoose";
import { ProjectMember } from "../models/projectmember.models.js";
import { ApiResponse } from "../utils/api-response.js";
import { handleZodError } from "../utils/handleZodError.js";
import {
  validateAddProjectMemberData,
  validateCreateProjectData,
  validateUpdateMemberData,
  validateUpdateProjectData,
} from "../validators/project.validator.js";
import { User } from "../models/user.models.js";
import { UserRolesEnum } from "../utils/constants.js";

import logger from "../utils/logger.js";

const getProjects = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  if (!userId) {
    throw new ApiError(404, "user is not found!");
  }

  const projects = await ProjectMember.aggregate([
    {
      $match: { user: new mongoose.Types.ObjectId.createFromHexString(userId) },
    },
    {
      $lookup: {
        from: "projects",
        localField: "project",
        foreignField: "_id",
        as: "projectData",
      },
    },
    {
      $unwind: "$projectData",
    },
    {
      $lookup: {
        from: "users",
        localField: "projectData.createdBy",
        foreignField: "_id",
        as: "userData",
      },
    },
    {
      $unwind: "$userData",
    },
    {
      $lookup: {
        from: "projectmembers",
        localField: "project",
        foreignField: "project",
        as: "members",
      },
    },
    {
      $project: {
        _id: 0,
        pid: "$projectData._id",
        name: "$projectData.name",
        description: "$projectData.description",
        createdBy: {
          username: "$userData.username",
          email: "$userData.email",
        },
        role: 1,
        totalMembers: { $size: "$members" },
      },
    },
  ]);

  res
    .status(200)
    .json(new ApiResponse(200, projects, "All projects are getting"));
});

const getProjectById = asyncHandler(async (req, res) => {
  const { pid } = req.params;

  if (!pid) {
    throw new ApiError(404, "projectId not getting");
  }

  //try this way also
  /*
         const project = await Project.findById(pid)
    .populate({
      path: "createdBy",
      select: "fullName username email avatar.url -_id",
    })
    .lean();

  if (!project) {
    throw new ApiError("Project not found", 404);
  }

  const members = await ProjectMember.find({ project: pid })
    .populate({
      path: "user",
      select: "fullName username email avatar.url -_id",
    })
    .select("role -_id")
    .lean();

  const fullData = {
    name: project.name,
    description: project.description,
    updatedAt: project.updatedAt,
    createdBy: project.createdBy,
    members: members.map((m) => ({
      role: m.role,
      ...m.user,
    })),
  };

  res.status(200).json(new ApiResponse(200, fullData, "Project fetched"));
        */

  const project = await Project.aggregate([
    {
      $match: { _id: new mongoose.Types.ObjectId.createFromHexString(pid) },
    },
    {
      $lookup: {
        from: "users",
        localField: "createdBy",
        foreignField: "_id",
        as: "createdBy",
      },
    },
    {
      $unwind: "$createdBy",
    },
    {
      $lookup: {
        from: "projectmembers",
        localField: "_id",
        foreignField: "project",
        as: "membersData",
      },
    },

    {
      $unwind: {
        path: "$membersData",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "membersData.user",
        foreignField: "_id",
        as: "membersData.userData",
      },
    },
    {
      $unwind: {
        path: "$membersData.userData",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $group: {
        _id: "$_id",
        name: { $first: "$name" },
        description: { $first: "$description" },
        updatedAt: { $first: "$updatedAt" },
        createdBy: { $first: "$createdBy" },
        members: {
          $push: {
            role: "$membersData.role",
            fullName: "$membersData.userData.fullName",
            username: "$membersData.userData.username",
            email: "$membersData.userData.email",
            avatar: "$membersData.userData.avatar.url",
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        name: 1,
        description: 1,
        updatedAt: 1,
        createdBy: {
          fullName: "$createdBy.fullName",
          username: "$createdBy.username",
          email: "$createdBy.email",
          avatar: "$createdBy.avatar.url",
        },
        members: 1,
      },
    },
  ]);

  if (!project) {
    throw new ApiError(404, "project not found");
  }

  res.status(200).json(200, project, "Project fetched successfully");
});

const createProject = asyncHandler(async (req, res) => {
  const { name, description } = handleZodError(
    validateCreateProjectData(req.boyd),
  );

  const createdBy = req.user._id;

  if (!createdBy) {
    throw new ApiError(404, "user is not get");
  }

  // here want to use transaction
  const clientSession = await mongoose.startSession();
  clientSession.startTransaction();
  let createdProject;
  try {
    createdProject = await Project.create(
      [
        {
          name,
          description,
          createdBy,
        },
      ],

      { session: clientSession },
    );

    // after creating also have to add me as a admin in project member
    await ProjectMember.create(
      [
        {
          user: createdProject[0].createdBy,
          project: createdProject[0]._id,
          role: UserRolesEnum.ADMIN,
        },
      ],
      { session: clientSession },
    );
    await clientSession.commitTransaction();
  } catch (error) {
    await clientSession.abortTransaction();
    logger.error(`Error occurred while creating project: ${error}`);
    if (error.code === 11000) {
      throw new ApiError("Project name must be unique per user", 400);
    }
    throw new ApiError(`Error while creating user ${error.message}`, 500);
  } finally {
    await clientSession.endSession();
  }
  res
    .status(200)
    .json(new ApiResponse(200, createdProject, "Project created successfully"));
});

const updateProject = asyncHandler(async (req, res) => {
  const { pid } = req.params;

  if (!pid) {
    throw new ApiError(404, "project not fetched successfully");
  }

  const { name, description } = handleZodError(
    validateUpdateProjectData(req.boyd),
  );

  const projectUpdate = await Project.findByIdAndUpdate(
    pid,
    { name, description },
    { new: true },
  );

  if (!projectUpdate) {
    throw new ApiError(400, "project not update successfully");
  }

  res
    .status(200)
    .json(new ApiResponse(200, projectUpdate, "Project update successfully"));
});

const deleteProject = asyncHandler(async (req, res) => {
  const { pid } = req.params;

  if (!pid) {
    throw new ApiError(404, "ProjectId not feteched");
  }

  const clientSession = await mongoose.startSession();
  clientSession.startTransaction();

  let deletedProject;

  try {
    deletedProject = await Project.findByIdAndDelete(pid, {
      session: clientSession,
    });
    await ProjectMember.deleteMany(
      { project: new mongoose.Types.ObjectId(pid) },
      {
        session: clientSession,
      },
    );

    await clientSession.commitTransaction();
  } catch (error) {
    await clientSession.abortTransaction();
    logger.error(`Error while deleting project: ${error}`);
    throw new ApiError(500, `Error while deleting project: ${error.message}`);
  } finally {
    await clientSession.endSession();
  }
  res
    .status(200)
    .json(
      new ApiResponse(200, deletedProject, "Project deleted successfully."),
    );
});

const getProjectMembers = asyncHandler(async (req, res) => {
  const { pid } = req.params;

  if (!pid) {
    throw new ApiError(400, "ProjectId not feteched");
  }

  const projectMembers = await ProjectMember.aggregate([
    {
      $match: { project: new mongoose.Types.ObjectId(pid) },
    },
    {
      $lookup: {
        from: "users", // <-- this should match your MongoDB collection name
        localField: "user",
        foreignField: "_id",
        as: "user",
      },
    },
    {
      $unwind: "$user",
    },
    {
      $project: {
        role: 1,
        updatedAt: 1,
        "user.username": 1,
        "user.email": 1,
        "user.fullName": 1,
        "user.avatar": 1,
        // exclude _id from user
        "user._id": 0,
      },
    },
  ]);

  /*
 const projectMembers = await ProjectMember.find({
    project: pid,
  })
    .populate({ path: "user", select: "username email fullName avatar -_id" })
    .select("role updatedAt");
   })
*/
  if (!projectMembers) {
    throw new ApiError(404, "Projec member not feteched");
  }

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        projectMembers,
        "Project Member fetched successfully",
      ),
    );
});

const addMemberToProject = asyncHandler(async (req, res) => {
  const { email, role } = handleZodError(
    validateAddProjectMemberData(req.body),
  );

  const { pid } = req.params;

  if (!pid) {
    throw new ApiError(400, "project Id not fetched from URL");
  }

  const user = await User.findOne({ email, isEmailVerified: true });

  if (!user) {
    throw new ApiError(400, "Email is wronge and user is not verified");
  }

  const existinMember = await ProjectMember.findOne({
    user: user._id,
    project: pid,
  });

  if (existinMember) {
    throw new ApiError(400, "User is already present in project");
  }

  const projecMember = await ProjectMember.create({
    user: user._id,
    project: pid,
    role: role,
  });

  if (!projecMember) {
    throw new ApiError(400, "projectMember does not add to project");
  }

  res.status(201).json(200, projecMember, "ProjectMember add Successfully");
});

const deleteMember = asyncHandler(async (req, res) => {
  const { mid } = req.params;

  const member = await ProjectMember.findByIdAndDelete(mid);

  if (!member) {
    throw new ApiError(400, "Member not deleted Successfull");
  }

  res.status(200).json(200, member, "Member deleted Successfully");
});

const updateMemberRole = asyncHandler(async (req, res) => {
  const { role } = handleZodError(validateUpdateMemberData(req.body));

  const { mid } = req.params;

  const existingMember = await ProjectMember.findById(mid);

  if (!existingMember) {
    throw new ApiError(400, "member does not exit");
  }

  if (existingMember.role === role) {
    throw new ApiError(400, "Member already have same role");
  }

  const updaterole = ProjectMember.findByIdAndUpdate(
    mid,
    {
      role,
    },
    {
      new: true,
    },
  );

  if (!updaterole) {
    throw new ApiError(400, "update role failed");
  }

  res.status(200).json(200, updaterole, "role updated successfully");
});

export {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getProjectMembers,
  addMemberToProject,
  deleteMember,
  updateMemberRole,
};
