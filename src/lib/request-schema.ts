import { z } from "zod";

export const requestSchema = z.object({
  room: z
    .string()
    .trim()
    .min(1, { message: "Room number is required." })
    .max(10, { message: "Room number must be 10 characters or less." }),
  guest_name: z
    .string()
    .trim()
    .max(80, { message: "Name must be less than 80 characters." }),
  details: z
    .string()
    .trim()
    .max(1000, { message: "Details must be less than 1000 characters." }),
});

export type RequestInput = z.infer<typeof requestSchema>;
