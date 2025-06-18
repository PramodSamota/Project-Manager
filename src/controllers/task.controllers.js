import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import { handleZodError } from "../utils/handleZodError.js";
import { Task } from "../models/task.models.js";
import { asyncHandler } from "../utils/async-handler.js";
import { User } from "../models/user.models.js";
import { ProjectMember } from "../models/projectmember.models.js";
import { Project } from "../models/project.models.js";
import mongoose from "mongoose";
import { SubTask } from "../models/subtask.models.js";
import { validateObjectId } from "../utils/helper.js";
import {
  validateSubTaskData,
  validateTaskData,
  validateUpdateTaskData,
} from "../validators/task.validator.js";

// get all tasks
const getTasks = asyncHandler(async (req, res) => {
  const { pid } = req.params;
  validateObjectId(pid, "project");

  const project = await Project.findById(pid);

  if (!project) {
    throw new ApiError(404, "project not found");
  }

  const allTasks = await Task.find({ project: pid });

  if (!allTasks) {
    throw new ApiError(404, "allTasks not feteched");
  }

  res
    .status(200)
    .json(new ApiResponse(200, allTasks, "All Tasks Feteched Successfully"));
});

// get task by id
const getTaskById = asyncHandler(async (req, res) => {
  const { tid } = req.params;
  validateObjectId(tid, "task");

  const task = await Task.findById(tid);

  if (!task) {
    throw new ApiError(404, "Task not found");
  }

  res
    .status(200)
    .json(new ApiResponse(200, task, "task is feteched Successfully"));
});

// create task
const createTask = asyncHandler(async (req, res) => {
  const { title, description, email } = handleZodError(
    validateTaskData(req.body),
  );

  const { pid } = req.params;
  validateObjectId(pid, "Project");
  const uid = req.user._id;

  const project = await Project.findById(pid);
  if (!project) {
    throw new ApiError(400, "Project not found");
  }

  const assigneToUser = await User.findOne({ email });
  if (!assigneToUser) {
    throw new ApiError(400, "assignedUser not found");
  }

  const member = await ProjectMember.findOne({ user: assigneToUser });
  if (!member) {
    throw new ApiError(400, "User is not member the  project");
  }

  const task = await Task.create({
    title,
    description,
    project: pid,
    assignedTo: assigneToUser._id,
    assignedBy: uid,
  });

  if (!task) {
    throw new ApiError(400, "task not created");
  }
  await task.save();
  //upload the attchement on cloudinary

  res
    .status(201)
    .json(new ApiResponse(201, task, "task is created successfully"));
});

// update task
const updateTask = asyncHandler(async (req, res) => {
  const { pid, tid } = req.params;

  validateObjectId(tid, "task");
  validateObjectId(pid, "Project");

  const { title, description, status } = handleZodError(
    validateUpdateTaskData(req.body),
  );

  const project = await Project.findById(pid);
  if (!project) {
    throw new ApiError(400, "Project not found");
  }

  const updatedTask = await Task.findByIdAndUpdate(
    tid,
    { title, description, status },
    { new: true },
  );

  if (!updatedTask) {
    throw new ApiError(404, "Task not update");
  }

  res
    .status(200)
    .json(new ApiResponse(200, updatedTask, "Task is updated successfully"));
});

// delete task
const deleteTask = asyncHandler(async (req, res) => {
  const { tid } = req.params;

  const clientSession = await mongoose.startSession();
  clientSession.startTransaction();
  try {
    await Task.findByIdAndDelete(tid);
    await SubTask.deleteMany({ task: tid });

    clientSession.commitTransaction();
  } catch (error) {
    clientSession.abortTransaction();
    throw new ApiError(400, error);
  } finally {
    clientSession.endSession();
  }

  res.status(200).json(new ApiResponse(200, null, "Task is deleted"));
});

// create subtask
const createSubTask = asyncHandler(async (req, res) => {
  const { tid } = req.params;
  const uid = req.user._id;

  validateObjectId(tid, "task");

  const { title } = handleZodError(validateSubTaskData(req.body));
  // const { title } = req.body;

  const task = await Task.findById(tid);
  if (!task) {
    throw new ApiError(404, "Task not found");
  }

  const subTask = await SubTask.create({
    title,
    task: tid,
    createdBy: uid,
  });

  if (!subTask) {
    throw new ApiError(400, "SubTask not create");
  }
  await subTask.save();

  res
    .status(201)
    .json(new ApiResponse(201, subTask, "SubTask is created Successfully"));
});

// update subtask
const updateSubTask = asyncHandler(async (req, res) => {
  const { title, isCompleted } = handleZodError(
    validateUpdateTaskData(req.body),
  );
  const { sid } = req.params;
  validateObjectId(sid, "subTaskId");

  const updatedsubTask = await SubTask.findByIdAndUpdate(
    sid,
    {
      title,
      isCompleted,
    },
    {
      new: true,
    },
  );

  if (!updatedsubTask) {
    throw new ApiError(400, "SubTask not updated");
  }

  res
    .status(200)
    .json(
      new ApiResponse(200, updatedsubTask, "SubTask is updated successfully"),
    );
});

// delete subtask
const deleteSubTask = async (req, res) => {
  const { sid } = req.params;
  validateObjectId(sid, "subTask");

  const deletedSubTask = await SubTask.findByIdAndDelete(sid);

  if (!deletedSubTask) {
    throw new ApiError(403, "SubTask not Deleted");
  }
  res
    .status(200)
    .json(new ApiResponse(200, null, "SubTask is Delete successfully"));
};

//TODO: addAttchements

//TODO: delteAttchements
export {
  createSubTask,
  createTask,
  deleteSubTask,
  deleteTask,
  getTaskById,
  getTasks,
  updateSubTask,
  updateTask,
};
