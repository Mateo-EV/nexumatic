import { cache } from "react";
import "server-only";
import { getServerAuthSession } from "./auth";

export const getSession = cache(() => getServerAuthSession());
