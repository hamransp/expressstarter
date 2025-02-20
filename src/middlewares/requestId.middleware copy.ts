/*
 * File: requestId.middleware.ts
 * Project: starterexpress
 * File Created: Tuesday, 21st January 2025 2:38:56 pm
 * Author: Rede (hamransp@gmail.com)
 * Last Modified: Tuesday, 21st January 2025 2:39:06 pm
 * Copyright 2017 - 2022 10RI Dev
 */

import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

declare global {
  namespace Express {
    interface Request {
      requestId: string;
    }
  }
}

export const requestIdMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Check if request already has an ID from upstream service
  const headerRequestId = req.header('X-Request-ID');
  
  // Use existing request ID or generate new one
  const requestId = headerRequestId || uuidv4();
  
  // Attach to request object
  req.requestId = requestId;
  
  // Add as response header
  res.set('X-Request-ID', requestId);
  
  next();
};