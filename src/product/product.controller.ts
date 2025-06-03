import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  BadRequestException,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post('create')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/png', 'image/jpeg', 'image/gif'];
        if (!allowedTypes.includes(file.mimetype)) {
          return cb(new BadRequestException('Chỉ được phép tải lên file PNG, JPEG hoặc GIF'), false);
        }
        cb(null, true);
      },
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    }),
  )
  async create(
    @Body() body: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    let imagePath: string | undefined;
    try {
      const createProductDto: CreateProductDto = {
        id: parseInt(body.id, 10),
        name: body.name,
        price: parseFloat(body.price),
        description: body.description,
        category: body.category,
        stock: body.stock ? parseInt(body.stock, 10) : undefined,
        isActive: body.isActive === 'true' ? true : false,
        image: file ? `/uploads/${file.filename}` : undefined,
      };

      if (!createProductDto.id || isNaN(createProductDto.id)) {
        throw new BadRequestException('Mã sản phẩm là bắt buộc và phải là số');
      }
      if (!createProductDto.name) {
        throw new BadRequestException('Tên sản phẩm là bắt buộc');
      }
      if (!createProductDto.price || isNaN(createProductDto.price)) {
        throw new BadRequestException('Giá sản phẩm là bắt buộc và phải là số');
      }
      if (!createProductDto.description) {
        throw new BadRequestException('Mô tả sản phẩm là bắt buộc');
      }
      if (!createProductDto.category) {
        throw new BadRequestException('Danh mục sản phẩm là bắt buộc');
      }

      if (file) {
        imagePath = join(__dirname, '..', '..', 'uploads', file.filename);
        createProductDto.image = `/uploads/${file.filename}`;
      }

      const data = await this.productService.create(createProductDto);
      return {
        method: 'CREATE',
        data,
      };
    } catch (error) {
      // Xóa ảnh nếu tạo thất bại
      if (imagePath && fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
      throw new BadRequestException({
        method: 'CREATE',
        error: {
          status: 400,
          message: error.message,
        },
      });
    }
  }

  @Post('update/:id')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/png', 'image/jpeg', 'image/gif'];
        if (!allowedTypes.includes(file.mimetype)) {
          return cb(new BadRequestException('Chỉ được phép tải lên file PNG, JPEG hoặc GIF'), false);
        }
        cb(null, true);
      },
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async update(
    @Param('id') id: string,
    @Body() body: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    let newImagePath: string | undefined;
    try {
      const updateProductDto: UpdateProductDto = {
        name: body.name,
        price: parseFloat(body.price),
        description: body.description,
        category: body.category,
        stock: body.stock ? parseInt(body.stock, 10) : undefined,
        isActive: body.isActive === 'true' ? true : false,
        image: file ? `/uploads/${file.filename}` : undefined,
      };

      if (!updateProductDto.name) {
        throw new BadRequestException('Tên sản phẩm là bắt buộc');
      }
      if (!updateProductDto.price || isNaN(updateProductDto.price)) {
        throw new BadRequestException('Giá sản phẩm là bắt buộc và phải là số');
      }
      if (!updateProductDto.description) {
        throw new BadRequestException('Mô tả sản phẩm là bắt buộc');
      }
      if (!updateProductDto.category) {
        throw new BadRequestException('Danh mục sản phẩm là bắt buộc');
      }

      if (file) {
        newImagePath = join(__dirname, '..', '..', 'uploads', file.filename);
        updateProductDto.image = `/uploads/${file.filename}`;
      }

      // Lấy sản phẩm hiện tại để lưu đường dẫn ảnh cũ
      const existingProduct = await this.productService.findOne(+id);
      const oldImagePath = existingProduct.image
        ? join(__dirname, '..', '..', existingProduct.image)
        : undefined;

      // Cập nhật sản phẩm
      const data = await this.productService.update(+id, updateProductDto);

      // Xóa ảnh cũ nếu cập nhật thành công và có ảnh mới
      if (file && oldImagePath && fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }

      return {
        method: 'UPDATE',
        data,
      };
    } catch (error) {
      // Xóa ảnh mới nếu cập nhật thất bại
      if (newImagePath && fs.existsSync(newImagePath)) {
        fs.unlinkSync(newImagePath);
      }
      throw new BadRequestException({
        method: 'UPDATE',
        error: {
          status: 400,
          message: error.message,
        },
      });
    }
  }

  @Get('list')
  async findAll(@Query('page') page: number, @Query('limit') limit: number) {
    try {
      if (!page || !limit) {
        throw new Error('Page và limit là bắt buộc');
      }
      const result = await this.productService.findAll(+page, +limit);
      return {
        method: 'GET_ALL',
        data: result,
      };
    } catch (error) {
      throw new BadRequestException({
        method: 'GET_ALL',
        error: {
          status: 400,
          message: error.message,
        },
      });
    }
  }

  @Get('detail/:id')
  async findOne(@Param('id') id: string) {
    try {
      const data = await this.productService.findOne(+id);
      return {
        method: 'GET_ONE',
        data,
      };
    } catch (error) {
      throw new BadRequestException({
        method: 'GET_ONE',
        error: {
          status: 400,
          message: error.message,
        },
      });
    }
  }

  @Delete('delete/:id')
  async remove(@Param('id') id: string) {
    try {
      // Lấy sản phẩm để kiểm tra ảnh
      const product = await this.productService.findOne(+id);
      const imagePath = product.image
        ? join(__dirname, '..', '..', product.image)
        : undefined;

      // Xóa sản phẩm
      await this.productService.remove(+id);

      // Xóa ảnh nếu tồn tại
      if (imagePath && fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }

      return {
        method: 'DELETE',
        data: { message: `Sản phẩm với ID ${id} đã được xóa thành công` },
      };
    } catch (error) {
      throw new BadRequestException({
        method: 'DELETE',
        error: {
          status: 400,
          message: error.message,
        },
      });
    }
  }
}