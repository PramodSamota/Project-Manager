import { z } from "zod";
import { AvailableTaskStatuses } from "../utils/constants.js";
const taskSchema = z.object({
  title: z.string().trim().nonempty(),
  description: z.string().optional(),
  email: z.string().trim().nonempty(),
});

const taskUpdateSchema = z.object({
  title: z.string().min(2).max(100).optional(),
  description: z.string().max(500).optional(),
  status: z.enum(AvailableTaskStatuses).optional(),
});

const subTaskSchema = z.object({
  title: z.string().min(2).max(100).trim(),
});

const updateSubTaskSchema = z.object({
  title: z.string().min(2).max(100).trim(),
  isCompleted: z.boolean().default("false"),
});

const validateTaskData = (data) => {
  return taskSchema.safeParse(data);
};

const validateUpdateTaskData = (data) => {
  return taskUpdateSchema.safeParse(data);
};

const validateSubTaskData = (data) => {
  return subTaskSchema.safeParse(data);
};

const validateUpdateSubTaskDate = (data) => {
  return updateSubTaskSchema.safeParse(data);
};
export {
  validateTaskData,
  validateUpdateTaskData,
  validateSubTaskData,
  validateUpdateSubTaskDate,
};
