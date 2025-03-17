import { Module } from '@nestjs/common';
import { CoffeeShopService } from './coffee-shop.service';
import { smithyControllerFactory } from '../smithy.utils';
import { httpOperations } from '@homaio/smithy-api';
import { CoffeeShopController } from './coffee-shop.controller';

@Module({
  imports: [],
  controllers: [smithyControllerFactory(CoffeeShopController, httpOperations)],
  providers: [CoffeeShopService],
})
export class CoffeeShopModule {}
