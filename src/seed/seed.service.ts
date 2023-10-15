import { Injectable } from '@nestjs/common';
import { ProductsService } from 'src/products/products.service';

@Injectable()
export class SeedService {

  constructor(
    private readonly productServices: ProductsService,
  ){}

  async runSeed() {
    await this.insertNewProducts();
    return `Seed Executed`;
  }

  private async insertNewProducts() {
    await this.productServices.deleteAllProducts();
    return true;
  }
}
