import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sendSecurityAlert } from "@/lib/email";

// Simple audit logging
const auditLogs: Array<{
  action: string;
  email?: string;
  userId?: string;
  timestamp: Date;
  reason?: string;
}> = [];

function auditLog(entry: { action: string; email?: string; userId?: string; reason?: string }) {
  const logEntry = { ...entry, timestamp: new Date() };
  auditLogs.push(logEntry);
  console.log(`[AUDIT] ${entry.action} | ${entry.email || entry.userId || "unknown"} | ${entry.reason || ""}`);
  if (auditLogs.length > 500) auditLogs.shift();
}

function getFailedLoginAttempts(email: string, minutes = 15): number {
  const cutoff = new Date(Date.now() - minutes * 60 * 1000);
  return auditLogs.filter(
    (log) => log.action === "LOGIN_FAILED" && log.email === email && log.timestamp >= cutoff
  ).length;
}

const adminEmails = (process.env.ADMIN_EMAILS ?? "manajel2026@gmail.com")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.toLowerCase().trim();
        const password = credentials?.password;

        if (!email || !password) {
          return null;
        }

        const failedAttempts = getFailedLoginAttempts(email, 15);
        
        if (failedAttempts >= 5) {
          auditLog({
            action: "LOGIN_BLOCKED",
            email,
            reason: "Too many failed attempts",
          });
          
          try {
            await sendSecurityAlert(adminEmails[0], {
              type: 'blocked_login',
              email,
              timestamp: new Date(),
              attempts: failedAttempts,
            });
          } catch (emailError) {
            console.error("Failed to send security alert:", emailError);
          }
          
          return null;
        }

        let user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user || !user.password) {
          auditLog({
            action: "LOGIN_FAILED",
            email,
            reason: "User not found",
          });
          throw new Error("EMAIL_NOT_REGISTERED");
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
          auditLog({
            action: "LOGIN_FAILED",
            email,
            reason: "Invalid password",
          });
          
          const newFailedCount = failedAttempts + 1;
          if (newFailedCount >= 3) {
            try {
              await sendSecurityAlert(adminEmails[0], {
                type: newFailedCount >= 5 ? 'blocked_login' : 'failed_login',
                email,
                timestamp: new Date(),
                attempts: newFailedCount,
              });
            } catch (emailError) {
              console.error("Failed to send security alert:", emailError);
            }
          }
          
          return null;
        }

        auditLog({
          action: "LOGIN_SUCCESS",
          userId: user.id,
          email,
        });

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id;
      }
      if ((user as { role?: string } | undefined)?.role) {
        token.role = (user as { role?: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token?.id) {
        (session.user as { id?: string; role?: string }).id = token.id as string;
        (session.user as { role?: string }).role = token.role as string | undefined;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
