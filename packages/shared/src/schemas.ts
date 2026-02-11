import { z } from "zod";

export const RoleSchema = z.enum(["CLIENT", "PRO", "EMP"]);
