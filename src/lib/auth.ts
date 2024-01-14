import { auth } from "@/server/auth";
import { cache } from "react";

export const getAuth = cache(() => auth());
