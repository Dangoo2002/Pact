import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        role: { label: 'Role', type: 'text' }
      },
      async authorize(credentials) {
        try {
          console.log('Authorizing user:', credentials.email);
          
          const result = await query('SELECT * FROM users WHERE email = $1', [credentials.email]);
          const user = result.rows[0];
          
          if (!user) {
            console.log('No user found with email:', credentials.email);
            throw new Error('No account found with this email');
          }
          
          const isValid = await bcrypt.compare(credentials.password, user.password_hash);
          if (!isValid) {
            console.log('Invalid password for user:', credentials.email);
            throw new Error('Incorrect password');
          }
          
          if (user.role !== credentials.role) {
            console.log(`Role mismatch. Expected: ${credentials.role}, Got: ${user.role}`);
            throw new Error(`This account is registered as a ${user.role}. Please select the correct role.`);
          }
          
          console.log('User authorized successfully:', user.user_id);
          
          return {
            id: user.user_id,
            email: user.email,
            name: user.full_name,
            role: user.role
          };
        } catch (error) {
          console.error('Authorization error:', error);
          throw error;
        }
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
      if (session?.user) {
        session.user.role = token.role;
        session.user.id = token.id;
        session.user.name = token.name;
      }
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
    updateAge: 24 * 60 * 60, // 24 hours
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 30 * 24 * 60 * 60 // 30 days
      }
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
  debug: process.env.NODE_ENV === 'development', // Enable debug in development
};