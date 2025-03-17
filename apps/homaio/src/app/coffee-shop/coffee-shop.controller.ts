import { Controller } from '@nestjs/common';
import { HttpRequest } from '@aws-sdk/protocol-http';
import { getCoffeeShopServiceHandler } from '@homaio/smithy-api';
import { CoffeeShopService } from './coffee-shop.service';
import { type GenericSmithyHandler } from '../smithy.utils';

const ctx = { orders: new Map(), queue: [] };

@Controller()
export class CoffeeShopController implements GenericSmithyHandler {
  constructor(private readonly coffeeService: CoffeeShopService) {}

  handle(req: HttpRequest) {
    const serviceHandler = getCoffeeShopServiceHandler(this.coffeeService);
    return serviceHandler.handle(req, ctx);
  }
}
