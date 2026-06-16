import jwt from 'jsonwebtoken';
import { config } from '../config';
import { JwtPayload, TokenPair } from '../types';

export const generateAccessToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  } as jwt.SignOptions);
};

export const generateRefreshToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
  } as jwt.SignOptions);
};

export const generateTokenPair = (payload: JwtPayload): TokenPair => {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
};

export const verifyToken = (token: string, isRefresh = false): JwtPayload => {
  const secret = isRefresh ? config.jwt.refreshSecret : config.jwt.secret;
  const decoded = jwt.verify(token, secret) as JwtPayload;
  return {
    userId: decoded.userId,
    email: decoded.email,
  };
};

export const verifyAccessToken = (token: string): JwtPayload => {
  return verifyToken(token, false);
};
