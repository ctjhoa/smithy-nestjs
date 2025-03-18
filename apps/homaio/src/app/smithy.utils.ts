import { type IncomingMessage } from 'http';
import { Delete, Get, Patch, Put, Post, Req } from '@nestjs/common';
import { HttpRequest } from '@aws-sdk/protocol-http';
import { convertRequest } from './converter';
import { UriPattern } from './uri-pattern';

type OperationConfig = {
  operationName: string;
  method: string;
  uri: string;
};

const httpMethods = [
  'GET',
  'HEAD',
  'POST',
  'PUT',
  'DELETE',
  'CONNECT',
  'OPTIONS',
  'TRACE',
  'PATCH',
] as const;

type HttpMethod = (typeof httpMethods)[number];

function isHttpMethod(method: string): method is HttpMethod {
  return httpMethods.includes(method as HttpMethod);
}

export interface GenericSmithyHandler {
  handle(req: HttpRequest);
}

type SmithyHandlerConstructor<T extends GenericSmithyHandler> = new (
  ...args: any[]
) => T;

export function smithyControllerFactory<T extends GenericSmithyHandler>(
  controller: SmithyHandlerConstructor<T>,
  httpOperations: OperationConfig[]
) {
  for (const { method, operationName, uri } of httpOperations) {
    if (!isHttpMethod(method)) {
      throw Error(
        `Unrecognized http method. ${method} ${operationName} ${uri}`
      );
    }

    controller.prototype[operationName] = function (
      incomingMessage: IncomingMessage & { rawBody: Buffer }
    ) {
      return this.handle(convertRequest(incomingMessage));
    };

    const uriPattern = UriPattern.parse(uri);
    const nestUri =
      '/' +
      uriPattern
        .getSegments()
        .map((s) => (s.isLabel() ? `:${s.getContent()}` : s.getContent()))
        .join('/');

    switch (method) {
      case 'GET': {
        Get(nestUri)(
          controller,
          operationName,
          Object.getOwnPropertyDescriptor(controller.prototype, operationName)
        );
        break;
      }
      case 'POST':
        Post(nestUri)(
          controller,
          operationName,
          Object.getOwnPropertyDescriptor(controller.prototype, operationName)
        );
        break;
      case 'PUT':
        Put(nestUri)(
          controller,
          operationName,
          Object.getOwnPropertyDescriptor(controller.prototype, operationName)
        );
        break;
      case 'PATCH':
        Patch(nestUri)(
          controller,
          operationName,
          Object.getOwnPropertyDescriptor(controller.prototype, operationName)
        );
        break;
      case 'DELETE': {
        Delete(nestUri)(
          controller,
          operationName,
          Object.getOwnPropertyDescriptor(controller.prototype, operationName)
        );

        break;
      }
      default:
        throw Error(`Unknown HTTP method. ${operationName} ${method} ${uri}`);
    }

    Req()(controller.prototype, operationName, 0);
  }

  return controller;
}
