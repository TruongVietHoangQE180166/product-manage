import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  BadRequestException,
  UseGuards,
  Request,
  Put,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { AuthGuard } from 'src/guard/auth.guard';

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post('create')
  @UseGuards(AuthGuard)
  async create(
    @Body() createOrderDto: CreateOrderDto,
    @Request() req: any,
  ) {
    try {
      const data = await this.orderService.create(createOrderDto);
      return {
        method: 'CREATE',
        data,
      };
    } catch (error) {
      throw new BadRequestException({
        method: 'CREATE',
        error: {
          status: 400,
          message: error.message,
        },
      });
    }
  }

  @Get('list')
  @UseGuards(AuthGuard)
  async findAllByUser(
    @Request() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    try {
      const pageNum = parseInt(page || '1', 10);
      const limitNum = parseInt(limit || '10', 10);

      if (isNaN(pageNum) || pageNum < 1) {
        throw new BadRequestException('Page must be a positive integer');
      }

      if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
        throw new BadRequestException('Limit must be between 1 and 100');
      }

      // Get userId from authenticated user
      const userId = req.user?._id;
      if (!userId) {
        throw new BadRequestException('User ID not found in request');
      }

      const result = await this.orderService.findAllByUser(userId, pageNum, limitNum);
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
  @UseGuards(AuthGuard)
  async findOne(
    @Request() req: any,
    @Param('id') id: string,
  ) {
    try {
      // Get userId from authenticated user
      const userId = req.user?._id;
      console.log("userId-view", userId)
      const data = await this.orderService.findOne(id, userId);
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

  @Put('cancel/:id')
  @UseGuards(AuthGuard)
  async cancelOrder(
    @Request() req: any,
    @Param('id') id: string,
  ) {
    try {
      const userId = req.user?._id;
      console.log("userId-cancel", userId)
      if (!userId) {
        throw new BadRequestException('User ID not found in request');
      }

      const data = await this.orderService.cancelOrder(id, userId);
      return {
        method: 'CANCEL',
        data,
      };
    } catch (error) {
      throw new BadRequestException({
        method: 'CANCEL',
        error: {
          status: 400,
          message: error.message,
        },
      });
    }
  }

  @Delete('delete/:id')
  @UseGuards(AuthGuard)
  async remove(
    @Request() req: any,
    @Param('id') id: string,
  ) {
    try {
      const userId = req.user?._id;
      if (!userId) {
        throw new BadRequestException('User ID not found in request');
      }

      await this.orderService.remove(id, userId);
      return {
        method: 'DELETE',
        data: { message: `Order with ID ${id} has been deleted successfully` },
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