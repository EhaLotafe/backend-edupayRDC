import { Request, ParamsDictionary } from 'express-serve-static-core';
import { ParsedQs } from 'qs';

export interface TypedRequest<
  P extends ParamsDictionary = ParamsDictionary,
  ResBody = any,
  ReqBody = any,
  ReqQuery = ParsedQs
> extends Request<P, ResBody, ReqBody, ReqQuery> {}
