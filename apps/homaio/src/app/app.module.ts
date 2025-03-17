import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CoffeeShopModule } from './coffee-shop/coffee-shop.module';

@Module({
  imports: [CoffeeShopModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
