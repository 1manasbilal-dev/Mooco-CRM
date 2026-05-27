import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        username: { label: "Username/User ID", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;
        
        const user = await db.user.findFirst({
          where: {
            OR: [
              { email: credentials.username },
              { name: credentials.username }
            ]
          }
        });
        
        if (!user) return null;

        // Check if stored password is encrypted with bcrypt
        const isBcrypt = user.password.startsWith("$2a$") || user.password.startsWith("$2b$");
        const isPasswordCorrect = isBcrypt
          ? await bcrypt.compare(credentials.password, user.password)
          : credentials.password === user.password;

        if (!isPasswordCorrect) {
          return null;
        }
        
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          permissions: user.permissions
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.permissions = (user as any).permissions;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).permissions = token.permissions;
      }
      return session;
    }
  },
  session: {
    strategy: "jwt"
  },
  pages: {
    signIn: "/login"
  },
  secret: process.env.NEXTAUTH_SECRET || "supersecretnextauthkey123"
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
