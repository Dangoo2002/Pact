import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        role: { label: 'Role', type: 'text' }
      },
      async authorize(credentials) {
        const result = await query('SELECT * FROM users WHERE email = $1', [credentials.email]);
        const user = result.rows[0];
        
        if (!user) {
          throw new Error('No account found with this email');
        }
        
        if (!bcrypt.compareSync(credentials.password, user.password_hash)) {
          throw new Error('Incorrect password');
        }
        
        if (user.role !== credentials.role) {
          throw new Error(`This account is registered as a ${user.role}. Please select the correct role.`);
        }
        
        return {
          id: user.user_id,
          email: user.email,
          name: user.full_name,
          role: user.role
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.role = token.role;
      session.user.id = token.id;
      session.user.name = token.name;
      return session;
    }
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  cookies: {
    sessionToken: {
      name: `__Secure-next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: true,
        domain: process.env.NEXTAUTH_URL === 'http://localhost:3000' ? undefined : '.vercel.app',
      },
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
});

export { handler as GET, handler as POST };