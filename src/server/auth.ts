import { PrismaAdapter } from "@auth/prisma-adapter";

import { env } from "@/env";
import { db } from "@/server/db";

import bcrypt from "bcryptjs";
import CredentialsProvider from "next-auth/providers/credentials";
import { loginUserSchema } from "@/schemas";

import NextAuth from "next-auth";
import { getUserByEmail, getUserById } from "@/lib/data";
/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "@auth/core/types" {
  interface Session extends DefaultSession {
    user: {
      id: number;
      name: string;
      email: string;
    };
  }
}

export const {
  auth,
  handlers: { GET, POST },
  signIn,
  signOut,
} = NextAuth({
  pages: {
    signIn: "/",
  },
  adapter: PrismaAdapter(db),
  session: {
    strategy: "jwt",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith("/dashboard");
      if (isOnDashboard) {
        if (isLoggedIn) return true;
        return false; // Redirect unauthenticated users to login page
      } else if (isLoggedIn) {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }
      return true;
    },
    session: ({ session, token }) => {
      if (token.id && session.user) {
        session.user.id = token.id as number;
      }

      if (session.user) {
        session.user.name = token.name!;
        session.user.email = token.email!;
      }

      return session;
    },
    jwt: async ({ token }) => {
      if (!token.id) return token;

      const existingUser = await getUserById(token.id as number);

      if (!existingUser) return token;

      token.name = existingUser.name;
      token.email = existingUser.email;

      return token;
    },
  },
  providers: [
    CredentialsProvider({
      name: "Login",
      credentials: {
        email: {
          label: "Email",
        },
        password: {
          label: "Password",
        },
      },
      async authorize(credentials) {
        const { email, password } = loginUserSchema.parse(credentials);
        const user = await getUserByEmail(email);

        if (!user) return null;

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) return null;

        return {
          ...user,
          id: user.id as unknown as string,
        };
      },
    }),
  ],
  secret: env.AUTH_SECRET,
});
