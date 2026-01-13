import { DrizzleAdapter } from '@auth/drizzle-adapter';
import NextAuth from 'next-auth';
import GitHub from 'next-auth/providers/github';
import Google from 'next-auth/providers/google';
import MicrosoftEntraID from 'next-auth/providers/microsoft-entra-id';
import SendGrid from 'next-auth/providers/sendgrid';
import { db } from '@/database/drizzle/drizzle';
// import Postmark from "next-auth/providers/postmark";

export const { handlers, signIn, signOut, auth } = NextAuth({
  accountLinking: true,
  allowDangerousEmailAccountLinking: true,
  adapter: DrizzleAdapter(db),
  pages: {
    signIn: '/login',
    // signUp: "/signup",
    error: '/error',
    verifyRequest: '/verify-request',
    newUser: '/dashboard', // Redirect new users to the dashboard instead of a non-existent /new-user page
  },
  providers: [
    Google,
    GitHub,
    MicrosoftEntraID({
      clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID,
      clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET,
      issuer: process.env.AUTH_MICROSOFT_ENTRA_ID_ISSUER,
      authorization: {
        params: {
          scope: 'openid profile email', // make sure you ask for openid
        },
      },
    }),
    SendGrid({
      server: {
        host: process.env.EMAIL_SERVER,
        port: 587,
        auth: {
          user: 'apikey',
          pass: process.env.AUTH_SENDGRID_KEY,
        },
      },
      from: process.env.EMAIL_FROM,
    }),
    // Postmark({
    //   server: process.env.POSTMARK_EMAIL_SERVER,
    //   from: process.env.EMAIL_FROM,
    // }),
  ],
  session: {
    strategy: 'jwt', // Ensure JWT strategy is used for sessionj
  },
  callbacks: {
    async session({ session, token }) {
      session.user.id = token.id as string;
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
  },
});
