import { BeforeInsert, BeforeUpdate, Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { ProductImage } from "./";
import { User } from "src/auth/entities/user.entity";
import { ApiProperty } from "@nestjs/swagger";

@Entity({name: 'products'})
export class Product {

    @ApiProperty({
        example: '3dae0d9d-afae-41ce-8183-409516e33608',
        description: 'Product ID',
        uniqueItems: true
    })
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ApiProperty({
        example: 'Teslo T-Shirt',
        description: 'Product Title',
        uniqueItems: true
    })
    @Column('text',{
        unique: true
    })
    title: string;

    @ApiProperty({
        example: '99.00',
        description: 'Product Price',
    })
    @Column('float',{
        default: 0
    })
    price: number;

    @ApiProperty({
        example: `Designed to celebrate Tesla's incredible performance mode, the Plaid Mode`,
        description: 'Product Description',
    })
    @Column({
        type: 'text',
        nullable: true
    })
    description: string;

    @ApiProperty({
        example: 'teslo-t-shirt',
        description: 'Product Slug - for SEO',
        uniqueItems: true
    })
    @Column('text',{
        unique: true
    })
    slug: string;

    @ApiProperty({
        example: '10',
        description: 'Product Stock',
        default: 0
    })
    @Column('int',{
        default: 0
    })
    stock: number;

    @ApiProperty({
        example: ['M', 'XL', 'XXL'],
        description: 'Product Sizes',
    })
    @Column('text',{
        array: true
    })
    sizes: string[];

    @ApiProperty({
        example: 'Men',
        description: 'Product Gender',
    })
    @Column('text')
    gender: string;

    @ApiProperty({
        example: ['shirt', 'hoodie'],
        description: 'Product Tags',
    })
    @Column('text',{
        array:true,
        default: []
    })
    tags: string[];

    @ApiProperty({
        example: ['1549268-00-A_0_2000.jpg', '1549268-00-A_2.jpg'],
        description: 'Product Images',
    })
    @OneToMany(
        () => ProductImage,
        (productImage) => productImage.product,
        {cascade: true, eager: true}
    )
    images?: ProductImage[];

    @ManyToOne(
        () => User,
        (user) => user.products,
        {eager: true}
    )
    user: User;

    @BeforeInsert()
    checkSlugInsert(){
        if(!this.slug) {
            this.slug = this.title
        }

        this.slug = this.slug
            .toLowerCase()
            .replaceAll(' ', '_')
            .replaceAll("'", '') 
    }

    @BeforeUpdate()
    checkSlugUpdate(){
        this.slug = this.slug
            .toLowerCase()
            .replaceAll(' ', '_')
            .replaceAll("'", '') 
    }
}
