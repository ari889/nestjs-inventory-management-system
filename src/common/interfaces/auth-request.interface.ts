import { FastifyRequest } from 'fastify';

export interface AuthRequest extends FastifyRequest {
  email: string;
}
