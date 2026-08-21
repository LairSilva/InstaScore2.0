export interface AuthenticatedUser {
  uid: string;
  email?: string;
  email_verified?: boolean;
  admin?: boolean;
  role?: string;
  [key: string]: any;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}
