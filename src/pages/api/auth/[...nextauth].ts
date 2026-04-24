import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";
import { compare } from "bcryptjs";
import { rateLimit } from "@/utils/rateLimit";

const prisma = new PrismaClient();

const loginRateLimitStore: Record<string, { count: number; reset: number }> = {};
const LOGIN_LIMIT = 10; // max attempts per window
const LOGIN_WINDOW = 60 * 60 * 1000; // 1 hour

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "账号密码",
      credentials: {
        identifier: { label: "邮箱或用户名", type: "text" },
        password: { label: "密码", type: "password" },
      },
      async authorize(credentials, req) {
        const ip =
          (req?.headers && req.headers["x-forwarded-for"]?.toString().split(",")[0]) ||
          "unknown";

        const { limited } = rateLimit(loginRateLimitStore, ip, LOGIN_LIMIT, LOGIN_WINDOW);
        if (limited) {
          // Throw a unique error string for rate limit
          throw new Error("RATE_LIMIT");
        }

        if (!credentials?.identifier || !credentials?.password) return null;
        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { email: credentials.identifier },
              { username: credentials.identifier },
            ],
          },
        });
        if (!user) return null;
        const isValid = await compare(credentials.password, user.password);
        if (!isValid) return null;
        const display = user.nickname?.trim() || user.username;
        return {
          id: user.id,
          email: user.email,
          name: display,
          username: user.username,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user && "username" in user && user.username) {
        token.username = user.username;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.username = token.username as string | undefined;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET ?? process.env.JWT_SECRET,
};

export default NextAuth(authOptions);