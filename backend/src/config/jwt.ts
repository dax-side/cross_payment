import { useJwt } from '@dax-side/jwt-abstraction';

const jwtSecret = process.env.JWT_SECRET;
const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;

if (!jwtSecret || !jwtRefreshSecret) {
  throw new Error('JWT_SECRET and JWT_REFRESH_SECRET must be set in environment variables');
}

export const jwt = useJwt({
  secret: jwtSecret,
  refreshTokenSecret: jwtRefreshSecret ?? jwtSecret,
  accessTokenTTL: '15m',
  refreshTokenTTL: '7d',
  algorithm: 'HS256'
});
