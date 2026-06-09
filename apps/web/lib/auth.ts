import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { env } from "@/lib/env";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;

        if (!email || !password) return null;

        if (
          email === env.AUTH_USER_EMAIL &&
          password === env.AUTH_USER_PASSWORD
        ) {
          return { id: "1", email: env.AUTH_USER_EMAIL, name: "Owner" };
        }

        return null;
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  secret: env.AUTH_SECRET,
});
