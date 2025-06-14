import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
// import { handleZodError } from "../utils/handleZodError.js";
import { Task } from "../models/task.models.js";
import { asyncHandler } from "../utils/async-handler";
import { User } from "../models/user.models.js";
import { ProjectMember } from "../models/projectmember.models.js";
import mongoose from "mongoose";
import { SubTask } from "../models/subtask.models.js";
// get all tasks
const getTasks = asyncHandler(async (req, res) => {
  const { pid } = req.params;

  if (!pid) {
    throw new ApiError(403, "project Id not get");
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

  if (!tid) {
    throw new ApiError(400, "task id is wrong");
  }

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
  const { title, description, email } = req.body;
  const { pid } = req.params;
  const { uid } = req.user._id;

  const assigneToUser = await User.findOne({ email });

  if (!assigneToUser) {
    throw new ApiError(400, "assignUser not found");
  }

  const member = await ProjectMember.findById(assigneToUser._id);

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

  //upload the attchement on cloudinary

  res.status(201, task, "task is created successfully");
});

// update task
const updateTask = asyncHandler(async (req, res) => {
  const { pid, tid } = req.params;

  const { title, description, status } = req.body;

  const updatedTask = await Task.findByIdAndUpdate(
    tid,
    { title, description, project: pid, status },
    { new: true },
  );

  if (!updatedTask) {
    throw new ApiError(404, "Task not update");
  }

  res
    .status(200)
    .json(new ApiResponse(200, updateTask, "Task is updated successfully"));
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
  const { tid, sid } = req.params;
  const { uid } = req.user._id;

  if (!sid) {
    throw new ApiError(400, "SubTask id not provided");
  }

  const { title } = req.body;

  const subTask = await SubTask.create({
    title,
    task: tid,
    createdBy: uid,
  });

  if (!subTask) {
    throw new ApiError(400, "SubTask not create");
  }

  res
    .status(201)
    .json(new ApiResponse(201, subTask, "SubTask is created Successfully"));
});

// update subtask
const updateSubTask = asyncHandler(async (req, res) => {
  const { title, isCompleted } = req.body;
  const { sid } = req.params;

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
    .json(new ApiResponse(200, null, "SubTask is updated successfully"));
});

// delete subtask
const deleteSubTask = async (req, res) => {
  const { sid } = req.params;
  if (!sid) {
    throw new ApiError(403, "SubTaks Id not provided");
  }

  const deletedSubTask = await SubTask.findByIdAndDelete(sid);

  if (!deletedSubTask) {
    throw new ApiError(403, "SubTask not Deleted");
  }
  res
    .status(200)
    .json(new ApiResponse(200, null, "SubTask is Delete successfully"));
};

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
