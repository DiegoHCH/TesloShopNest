import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PaginationDto } from '../common/dtos/pagination.dto';
import { validate as isUUID } from 'uuid';
import { Product, ProductImage } from './entities';
import { url } from 'inspector';

@Injectable()
export class ProductsService {

  private readonly logger = new Logger('ProductService')

  constructor(

    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,

    @InjectRepository(ProductImage)
    private readonly productImagesRepository: Repository<ProductImage>,

    private readonly dataSource : DataSource,

  ){}

  async create(createProductDto: CreateProductDto) {
    try {
      const {images = [], ...productDetails } = createProductDto;

      const product = this.productRepository.create({
        ...createProductDto,
        images: images.map((image) => this.productImagesRepository.create({url: image})),
      });
      await this.productRepository.save(product);
      return {...product, images};
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
        relations: {
          images: true
        }
      });
      return products.map(({ images, ...rest }) => ({
        ...rest,
        images: images.map((image) => image.url)
      }));
    } catch (error) {
      this.handlerDBExceptions(error);
    }
  }

  async findOne(term: string) {
    let product: Product;

    if( isUUID(term) ){
      product = await this.productRepository.findOneBy({id:term});
    } else {
      const queryBuilder = this.productRepository.createQueryBuilder('prod');
      product = await queryBuilder
      .where('UPPER(title) =:title or slug=:slug', {
        title: term.toUpperCase(),
        slug: term.toLowerCase(),
      })
      .leftJoinAndSelect('prod.images', 'prodImages')
      .getOne();
    }

    if(!product) throw new NotFoundException(`Product with "${term}" not found`);
   
    return product;
  }

  async findOnePlain (term: string) {
    const {images = [], ...rest} = await this.findOne(term);
    return {
      ...rest,
      images: images.map(image => image.url),
    }
  }

  async update(id: string, updateProductDto: UpdateProductDto) {

    const {images, ...toUpdate} = updateProductDto

    const product = await this.productRepository.preload({ id, ...toUpdate });

    if(!product) throw new NotFoundException(`Product with id:  "${id}" not found`);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {

      if( images ) {
        await queryRunner.manager.delete(ProductImage, {propduct:{id}});

        product.images = images.map((image) => this.productImagesRepository.create({url: image}));
      }

      await queryRunner.manager.save(product);
      await queryRunner.commitTransaction();
      await queryRunner.release();

      //await this.productRepository.save(product);
      return this.findOnePlain(id);
    } catch (error) {

      await queryRunner.rollbackTransaction();
      await queryRunner.release();

      this.handlerDBExceptions(error)
    }
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
