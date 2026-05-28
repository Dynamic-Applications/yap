// import { NextAuthOptions } from "next-auth";
// import GoogleProvider from "next-auth/providers/google";
// import { findUserByEmail, createUser } from "@/lib/users";

// export const authOptions: NextAuthOptions = {
//     providers: [
//         GoogleProvider({
//             clientId: process.env.GOOGLE_CLIENT_ID!,
//             clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
//             authorization: {
//                 params: { prompt: "select_account" },
//             },
//         }),
//     ],
//     session: {
//         maxAge: 10 * 60, // 10 minutes
//         updateAge: 60, // refresh every 60 seconds
//     },
//     callbacks: {
//         async signIn({ user }) {
//             if (!user.email || !user.name) return false;
//             const existing = await findUserByEmail(user.email);
//             if (!existing) {
//                 await createUser(user.email, user.name, crypto.randomUUID());
//             }
//             return true;
//         },
//         async session({ session }) {
//             if (session.user?.email) {
//                 const user = await findUserByEmail(session.user.email);
//                 if (user) {
//                     (session.user as any).id = user.id;
//                 }
//             }
//             return session;
//         },
//     },
//     pages: {
//         signIn: "/",
//     },
//     secret: process.env.NEXTAUTH_SECRET,
// };
