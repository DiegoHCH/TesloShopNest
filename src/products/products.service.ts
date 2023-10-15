import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';
import { PaginationDto } from '../common/dtos/pagination.dto';
import { validate as isUUID } from 'uuid';

@Injectable()
export class ProductsService {

  private readonly logger = new Logger('ProductService')

  constructor(

    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,

  ){}

  async create(createProductDto: CreateProductDto) {
    try {
      const product = this.productRepository.create(createProductDto);
      await this.productRepository.save(product);
      return product;
    } catch (error) {
      this.handlerDBExceptions(error);
    }
  }

  async findAll(paginationDto:PaginationDto) {

    const {limit = 10, offset = 0} = paginationDto;

    try {
      const products: Product[] = await this.productRepository.find({
        take: limit,
        skip: offset,
      });
      return products;
    } catch (error) {
      this.handlerDBExceptions(error);
    }
  }

  async findOne(term: string) {
    let product: Product;

    if( isUUID(term) ){
      product = await this.productRepository.findOneBy({id:term});
    }

    if( !product ){
      product = await this.productRepository.findOneBy({slug:term});
    }

    if(!product) throw new NotFoundException(`Product with "${term}" not found`);
   
    return product;
  }

  update(id: number, updateProductDto: UpdateProductDto) {
    return `This action updates a #${id} product`;
  }

  async remove(id: string) {
    try {
      await this.productRepository.delete({id: id});
      return;
    } catch (error) {
      this.handlerDBExceptions(error);
    }
  }

  private handlerDBExceptions( error: any ){
    if( error.code == '23505' )
      throw new BadRequestException(error.detail);

    this.logger.error(error);
    throw new InternalServerErrorException('Unexpected error, check server logs');
  }
}
