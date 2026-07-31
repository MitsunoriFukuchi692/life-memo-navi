import { Response } from 'express';
export declare function requireAuth(req: any, res: Response, next: Function): Response<any, Record<string, any>> | undefined;
