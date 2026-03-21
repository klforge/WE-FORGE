import AzureADProvider from "next-auth/providers/azure-ad";
import connectDB from "@/lib/db";
import Member from "@/lib/models/Member";

const nameToSlug = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export const authOptions = {
  providers: [
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
      tenantId: process.env.AZURE_AD_TENANT_ID,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!user.email?.endsWith('@kluniversity.in')) {
        return false;
      }

      try {
        await connectDB();
        const existingMember = await Member.findOne({ email: user.email });
        
        if (!existingMember) {
          const rollNumber = user.email.split('@')[0];
          await Member.create({
            id: rollNumber,
            name: user.name || 'New Member',
            role: 'Student',
            email: user.email,
            rollNumber: user.email.split('@')[0],
            status: 'Online',
            photoUrl: user.image || '',
            domain: 'General',
            department: 'Pending',
            bio: 'K L University Student',
            orderIndex: 999 
          });
          user.role = 'Student';
        } else {
          if (existingMember.isSuspended) {
            throw new Error('SUSPENDED');
          }
          user.role = existingMember.role;
        }
        return true;
      } catch (error) {
        console.error("Error during member auth/creation:", error);
        return true;
      }
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub;
        session.user.role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
};
