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
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { AuthGuard } from 'src/guard/auth.guard';
@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post('create')
  @UseGuards(AuthGuard)
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
          return cb(new BadRequestException('Only PNG, JPEG, or GIF files are allowed'), false);
        }
        cb(null, true);
      },
      limits: { fileSize: 5 * 1024 * 1024 },
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
        throw new BadRequestException('Product ID is required and must be a number');
      }
      if (!createProductDto.name) {
        throw new BadRequestException('Product name is required');
      }
      if (!createProductDto.price || isNaN(createProductDto.price)) {
        throw new BadRequestException('Product price is required and must be a number');
      }
      if (!createProductDto.description) {
        throw new BadRequestException('Product description is required');
      }
      if (!createProductDto.category) {
        throw new BadRequestException('Product category is required');
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
  @UseGuards(AuthGuard)
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
          return cb(new BadRequestException('Only PNG, JPEG, or GIF files are allowed'), false);
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
        throw new BadRequestException('Product name is required');
      }
      if (!updateProductDto.price || isNaN(updateProductDto.price)) {
        throw new BadRequestException('Product price is required and must be a number');
      }
      if (!updateProductDto.description) {
        throw new BadRequestException('Product description is required');
      }
      if (!updateProductDto.category) {
        throw new BadRequestException('Product category is required');
      }

      if (file) {
        newImagePath = join(__dirname, '..', '..', 'uploads', file.filename);
        updateProductDto.image = `/uploads/${file.filename}`;
      }

      const existingProduct = await this.productService.findOne(+id);
      const oldImagePath = existingProduct.image
        ? join(__dirname, '..', '..', existingProduct.image)
        : undefined;

      const data = await this.productService.update(+id, updateProductDto);

      if (file && oldImagePath && fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }

      return {
        method: 'UPDATE',
        data,
      };
    } catch (error) {
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
async findAll(
  @Query('page') page?: string,
  @Query('limit') limit?: string,
  @Query('search') search?: string,
) {
  try {
    const pageNum = parseInt(page || '1', 10);    
    const limitNum = parseInt(limit || '4', 10);  

    if (isNaN(pageNum) || pageNum < 1) {
      throw new BadRequestException('Page must be a positive integer');
    }

    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      throw new BadRequestException('Limit must be between 1 and 100');
    }

    const result = await this.productService.findAll(pageNum, limitNum, search);
    return {
      method: 'GET_ALL',
      data: result,
    };
  } catch (error) {
    throw new BadRequestException({
      method: 'GET_ALL',
      error: {
        status: 400,
        message: error.message || 'Invalid query parameters',
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
  @UseGuards(AuthGuard)
  async remove(@Param('id') id: string) {
    try {
      const product = await this.productService.findOne(+id);
      const imagePath = product.image
        ? join(__dirname, '..', '..', product.image)
        : undefined;

      await this.productService.remove(+id);

      if (imagePath && fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }

      return {
        method: 'DELETE',
        data: { message: `Product with ID ${id} has been deleted successfully` },
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
