"use server";

import { type loginUserSchemaType } from "@/schemas";
import { signIn } from "@/server/auth";
import { AuthError } from "next-auth";

export async function authenticate(creadentials: loginUserSchemaType) {
  try {
    await signIn("credentials", { ...creadentials, redirect: false });
    return "Authenticated successfully";
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          throw new Error("Invalid credentials.");
        default:
          throw new Error("Something went wrong.");
      }
    }
    throw error;
  }
}
