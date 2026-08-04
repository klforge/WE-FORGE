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
        const rollNumber = user.email.split('@')[0];
        
        // Find existing member by email OR roll number
        let existingMember = await Member.findOne({
          $or: [
            { email: user.email },
            { rollNumber: rollNumber }
          ]
        });
        
        if (!existingMember) {
          existingMember = await Member.create({
            id: rollNumber,
            name: user.name || 'New Member',
            role: 'Student',
            email: user.email,
            rollNumber: rollNumber,
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
          
          // Check if names match (at least partially) to prevent giving someone the wrong DB profile
          let isNameMatch = false;
          if (existingMember.name && user.name) {
            const dbName = existingMember.name.toLowerCase().trim();
            const msName = user.name.toLowerCase().trim();
            
            const dbFirstName = dbName.split(' ')[0];
            const msFirstName = msName.split(' ')[0];
            
            if (dbName.includes(msName) || msName.includes(dbName) || dbFirstName === msFirstName) {
              isNameMatch = true;
            }
          }

          if (!isNameMatch) {
            // Name mismatch! The database has dummy/seed data for this roll number.
            // Treat as a new user: clear out the old data and use Microsoft data.
            existingMember.name = user.name || 'New Member';
            existingMember.email = user.email;
            existingMember.photoUrl = user.image || '';
            existingMember.role = 'Student';
            existingMember.domain = 'General';
            existingMember.department = 'Pending';
            existingMember.bio = 'K L University Student';
            existingMember.skills = [];
            existingMember.telegram = '';
            existingMember.github = '';
            existingMember.linkedin = '';
            await existingMember.save();
          } else {
            // Name matches! Just update their Microsoft details but keep their roles/skills
            let updated = false;
            if (existingMember.email !== user.email) {
              existingMember.email = user.email;
              updated = true;
            }
            if (user.name && existingMember.name !== user.name) {
              existingMember.name = user.name;
              updated = true;
            }
            if (user.image && existingMember.photoUrl !== user.image) {
              existingMember.photoUrl = user.image;
              updated = true;
            }
            if (updated) {
              await existingMember.save();
            }
          }
          
          user.role   = existingMember.role;
          user.domain = existingMember.domain;
        }
        return true;
      } catch (error) {
        console.error("Error during member auth/creation:", error);
        return true;
      }
    },
    async jwt({ token, user }) {
      if (user) {
        token.role   = user.role;
        token.domain = user.domain;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id     = token.sub;
        session.user.role   = token.role;
        session.user.domain = token.domain;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
};
