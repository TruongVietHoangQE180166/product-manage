import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './schemas/product.schema';

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(Product.name)
    private productModel: Model<Product>,
  ) {}

  async create(createDto: CreateProductDto): Promise<Product> {
    if (!createDto.id) {
      throw new BadRequestException('Product ID is required');
    }

    const existingProduct = await this.productModel.findOne({
      id: createDto.id,
    });

    if (existingProduct) {
      throw new BadRequestException('A product with this ID already exists');
    }

    const newProduct = new this.productModel({
      id: createDto.id,
      name: createDto.name,
      price: createDto.price,
      description: createDto.description,
      category: createDto.category,
      stock: createDto.stock ?? 0,
      isActive: createDto.isActive ?? true,
      image: createDto.image,
    });

    return await newProduct.save();
  }

  async update(id: number, updateDto: UpdateProductDto): Promise<Product> {
    const product = await this.productModel.findOne({ id });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} does not exist`);
    }

    return await this.productModel
      .findOneAndUpdate(
        { id },
        { ...updateDto, image: updateDto.image },
        { new: true },
      )
      .exec();
  }

  async remove(id: number): Promise<void> {
    const result = await this.productModel.deleteOne({ id }).exec();

    if (result.deletedCount === 0) {
      throw new NotFoundException(`Product with ID ${id} does not exist`);
    }
  }

  async findAll(page: number = 1, limit: number = 4, search?: string): Promise<{ data: Product[]; total: number }> {
  if (!Number.isInteger(page) || page < 1) {
    throw new BadRequestException('Page must be a positive integer');
  }
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new BadRequestException('Limit must be a positive integer and not exceed 100');
  }

  try {
    const skip = (page - 1) * limit;
    const query = search && search.trim() ? { name: { $regex: search, $options: 'i' } } : {};

    const [data, total] = await Promise.all([
      this.productModel.find(query).skip(skip).limit(limit).exec(),
      this.productModel.countDocuments(query),
    ]);

    return { data, total };
  } catch (error) {
    throw new BadRequestException('Failed to fetch products');
  }
}

  async findOne(id: number): Promise<Product> {
    if (!Number.isInteger(id) || id < 1) {
      throw new BadRequestException('ID must be a positive integer');
    }

    const product = await this.productModel.findOne({ id }).exec();

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} does not exist`);
    }

    return product;
  }
}
