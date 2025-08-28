import * as jwt from 'jsonwebtoken';

const secret = process.env.SMALLCASE_SECRET as string;

if (!secret) {
  throw new Error("SMALLCASE_SECRET environment variable is missing.");
}

export function createAuthToken(authId?: any) { // Made authId optional
  const expiresIn = '1m';
  if (authId) {
    console.log('Creating token for authId:', authId);
    return jwt.sign({ smallcaseAuthId: authId }, secret, { expiresIn });
  }
   console.log('creating for guestt')
  return jwt.sign({ guest: true }, secret, { expiresIn }); // Guest token
}

export function isTokenExpired(token: string): boolean {
  try {
    const decoded = jwt.decode(token) as jwt.JwtPayload | null;
    if (!decoded || !decoded.exp) return false; // If no expiration, assume it's valid
    return Date.now() >= decoded.exp * 1000;
  } catch (error) {
    return true; // If token is invalid, consider it expired
  }
}