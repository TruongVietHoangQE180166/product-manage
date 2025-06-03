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
      throw new BadRequestException('Mã sản phẩm là bắt buộc');
    }

    const existingProduct = await this.productModel.findOne({
      id: createDto.id,
    });

    if (existingProduct) {
      throw new BadRequestException('Sản phẩm với mã này đã tồn tại');
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
      throw new NotFoundException(`Sản phẩm với ID ${id} không tồn tại`);
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
      throw new NotFoundException(`Sản phẩm với ID ${id} không tồn tại`);
    }
  }

  async findAll(
    page: number,
    limit: number,
  ): Promise<{ data: Product[]; total: number }> {
    if (!Number.isInteger(page) || page < 1) {
      throw new BadRequestException('Page phải là số nguyên dương');
    }
    if (!Number.isInteger(limit) || limit < 1) {
      throw new BadRequestException('Limit phải là số nguyên dương');
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.productModel.find().skip(skip).limit(limit).exec(),
      this.productModel.countDocuments(),
    ]);

    return { data, total };
  }

  async findOne(id: number): Promise<Product> {
    if (!Number.isInteger(id) || id < 1) {
      throw new BadRequestException('ID phải là số nguyên dương');
    }

    const product = await this.productModel.findOne({ id }).exec();

    if (!product) {
      throw new NotFoundException(`Sản phẩm với ID ${id} không tồn tại`);
    }

    return product;
  }
}