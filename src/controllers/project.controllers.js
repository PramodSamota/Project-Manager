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
import { validateObjectId } from "../utils/helper.js";

const getProjects = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  if (!userId) {
    throw new ApiError(404, "user is not found!");
  }

  const projects = await ProjectMember.find({ user: userId }).populate({
    path: "project",
    populate: {
      path: "createdBy",
      select: "username email", // Project creator
    },
    select: "name description createdBy", // Fields from Project
  });

  //const projects = await ProjectMember.aggregate([
  // {
  //   $match: { user: userId },
  // },
  // {
  //   $lookup: {
  //     from: "projects",
  //     localField: "project",
  //     foreignField: "_id",
  //     as: "projectData",
  //   },
  // },
  // {
  //   $unwind: "$projectData",
  // },
  // {
  //   $lookup: {
  //     from: "users",
  //     localField: "projectData.createdBy",
  //     foreignField: "_id",
  //     as: "userData",
  //   },
  // },
  // {
  //   $unwind: "$userData",
  // },
  // {
  //   $lookup: {
  //     from: "projectmembers",
  //     localField: "project",
  //     foreignField: "project",
  //     as: "members",
  //   },
  // },
  // {
  //   $project: {
  //     _id: 0,
  //     pid: "$projectData._id",
  //     name: "$projectData.name",
  //     description: "$projectData.description",
  //     createdBy: {
  //       username: "$userData.username",
  //       email: "$userData.email",
  //     },
  //     role: 1,
  //     totalMembers: { $size: "$members" },
  //   },
  // },
  //]);

  res
    .status(200)
    .json(new ApiResponse(200, projects, "All projects are getting"));
});

const getProjectById = asyncHandler(async (req, res) => {
  const { pid } = req.params;
  validateObjectId(pid, "project");

  if (!pid) {
    throw new ApiError(404, "projectId not getting");
  }

  //try this way also

  const project = await Project.findById(pid).populate({
    path: "createdBy",
    select: "fullName username email avatar.url -_id",
  });

  if (!project) {
    throw new ApiError("Project not found", 404);
  }

  const member = await ProjectMember.find({ project: pid })
    .populate({
      path: "user",
      select: "fullName username email avatar.url -_id",
    })
    .select("role -_id");

  const fullData = {
    name: project.name,
    description: project.description,
    updatedAt: project.updatedAt,
    createdBy: project.createdBy,
    members: member.map((m) => ({
      role: m.role,
      user: m.user,
    })),
  };

  if (!project) {
    throw new ApiError(404, "project not found");
  }

  res
    .status(200)
    .json(new ApiResponse(200, fullData, "Project fetched successfully"));
});

const createProject = asyncHandler(async (req, res) => {
  const { name, description } = handleZodError(
    validateCreateProjectData(req.body),
  );

  const createdBy = req.user._id;

  if (!createdBy) {
    throw new ApiError(404, "user is not found");
  }

  // Transation on work on locak db;
  /*
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
  } 
  catch (error) {
    await clientSession.abortTransaction();

    logger.error(`Error occurred while creating project: ${error}`);

    if (error.code === 11000) {
      throw new ApiError(400, "Project name must be unique per user");
    }
    throw new ApiError(500, `Error while creating user ${error.message}`);
  } finally {
    await clientSession.endSession();
  }
*/
  // Without session for local dev
  const createdProject = await Project.create({
    name,
    description,
    createdBy,
  });

  await ProjectMember.create({
    user: createdProject.createdBy,
    project: createdProject._id,
    role: UserRolesEnum.ADMIN,
  });

  res
    .status(200)
    .json(new ApiResponse(200, createdProject, "Project created successfully"));
});

const updateProject = asyncHandler(async (req, res) => {
  const { pid } = req.params;

  validateObjectId(pid, "Project");
  const project = await Project.findById(pid);

  if (!project) {
    throw new ApiError(404, "project not fetched successfully");
  }

  const { name, description } = handleZodError(
    validateUpdateProjectData(req.body),
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

  validateObjectId(pid, "Project");

  const project = await Project.findById(pid);

  if (!project) {
    throw new ApiError(404, "project not fetched successfully");
  }

  const clientSession = await mongoose.startSession();
  clientSession.startTransaction();

  /*
  try {
    deletedProject = await Project.findByIdAndDelete(pid, {
      session: clientSession,
    });
    await ProjectMember.deleteMany(
      { project: pid },
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
*/

  const deletedProject = await Project.findByIdAndDelete(pid);

  if (!deletedProject) {
    throw new ApiError(404, "Project not delete");
  }

  // Delete all project members
  const projectMembers = await ProjectMember.deleteMany({ project: pid });

  if (!projectMembers) {
    throw new ApiError(404, "ProjectMembers not deleted");
  }
  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { deletedProjectId: pid },
        "Project deleted successfully",
      ),
    );

  res
    .status(200)
    .json(
      new ApiResponse(200, deletedProject, "Project deleted successfully."),
    );
});

const getProjectMembers = asyncHandler(async (req, res) => {
  const { pid } = req.params;

  validateObjectId(pid, "Project");

  const project = await Project.findById(pid);

  if (!project) {
    throw new ApiError(404, "project not fetched successfully");
  }
  /*
  const projectMembers = await ProjectMember.aggregate([
    {
      $match: { project: pid },
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
      },
    },
  ]);

  */

  const projectMembers = await ProjectMember.find({
    project: pid,
  })
    .populate({ path: "user", select: "username email fullName avatar -_id" })
    .select("role updatedAt");

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
  const { pid } = req.params;

  validateObjectId(pid, "Project");

  const project = await Project.findById(pid);

  if (!project) {
    throw new ApiError(404, "project not fetched successfully");
  }

  const { email, role } = handleZodError(
    validateAddProjectMemberData(req.body),
  );

  const user = await User.findOne({ email, isEmailVerified: true });

  if (!user) {
    throw new ApiError(400, "Email is wronge and user is not verified");
  }

  const existingMember = await ProjectMember.findOne({
    user: user._id,
    project: pid,
  });

  console.log(existingMember);
  if (existingMember) {
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

  res
    .status(201)
    .json(new ApiResponse(200, projecMember, "ProjectMember add Successfully"));
});

const updateMemberRole = asyncHandler(async (req, res) => {
  const { mid } = req.params;
  // console.log("mid:", mid);
  validateObjectId(mid, "member");
  const { role } = handleZodError(validateUpdateMemberData(req.body));
  // console.log("role", role);

  const existingMember = await ProjectMember.findById(mid);

  if (!existingMember) {
    throw new ApiError(404, "member does not exit");
  }

  if (existingMember.role === role) {
    throw new ApiError(400, "Member already have same role");
  }

  const updaterole = await ProjectMember.findByIdAndUpdate(
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

  res
    .status(200)
    .json(new ApiResponse(200, updaterole, "role updated successfully"));
});

const deleteMember = asyncHandler(async (req, res) => {
  const { mid } = req.params;

  const member = await ProjectMember.findById(mid);
  if (!member) {
    throw new ApiError(404, "Member not Found");
  }
  const deletedmember = await ProjectMember.findByIdAndDelete(mid);

  if (!deletedmember) {
    throw new ApiError(400, "Member not deleted Successfull");
  }

  res
    .status(200)
    .json(new ApiResponse(200, deletedmember, "Member deleted Successfully"));
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
