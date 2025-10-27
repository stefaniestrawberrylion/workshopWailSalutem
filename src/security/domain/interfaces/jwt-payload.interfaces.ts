export interface JwtPayload {
  sub: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  rol?: string[];
  iat?: number;
  exp?: number;
}
