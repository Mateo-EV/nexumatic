import "server-only";
import { cache } from "react";
import { getServerAuthSession } from "./auth";

export const getSession = cache(() => getServerAuthSession());
