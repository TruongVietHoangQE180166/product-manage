import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { CreateOrderDto } from './dto/create-order.dto';
import { Order } from './schemas/order.schema';
import { Product } from '../product/schemas/product.schema';
import { UserAccount } from '../auth/schemas/account.schema';

@Injectable()
export class OrderService {
  constructor(
    @InjectModel(Order.name)
    private orderModel: Model<Order>,
    @InjectModel(Product.name)
    private productModel: Model<Product>,
    @InjectModel(UserAccount.name)
    private userModel: Model<UserAccount>,
  ) {}

  async create(createDto: CreateOrderDto): Promise<Order> {
    const userExists = await this.userModel.findById(createDto.user);
    if (!userExists) {
      throw new BadRequestException('User does not exist');
    }

    let totalAmount = 0;
    const validatedItems = [];

    for (const item of createDto.items) {
      const product = await this.productModel.findById(item.product);
      if (!product) {
        throw new BadRequestException(`Product with ID ${item.product} does not exist`);
      }
      if (!product.isActive) {
        throw new BadRequestException(`Product ${product.name} is not available`);
      }
      if (product.stock < item.quantity) {
        throw new BadRequestException(`Insufficient stock for product ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`);
      }
      
      const itemSubtotal = product.price * item.quantity;
      totalAmount += itemSubtotal;
      
      validatedItems.push({
        product: item.product,
        quantity: item.quantity,
        price: product.price, 
        subtotal: itemSubtotal
      });
    }

    totalAmount = Math.round(totalAmount * 100) / 100;

    const newOrder = new this.orderModel({
      user: createDto.user,
      items: validatedItems,
      totalAmount: totalAmount,
      status: 'pending',
    });

    for (const item of createDto.items) {
      await this.productModel.findByIdAndUpdate(
        item.product,
        { $inc: { stock: -item.quantity } }
      );
    }

    return await newOrder.save();
  }

  async findAllByUser(
    userId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ data: Order[]; total: number }> {
    if (!Number.isInteger(page) || page < 1) {
      throw new BadRequestException('Page must be a positive integer');
    }
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      throw new BadRequestException('Limit must be a positive integer and not exceed 100');
    }

    // Validate user exists
    const userExists = await this.userModel.findById(userId);
    if (!userExists) {
      throw new BadRequestException('User does not exist');
    }

    try {
      const skip = (page - 1) * limit;
      const query = { user: userId };

      const [data, total] = await Promise.all([
        this.orderModel
          .find(query)
          .populate('items.product', 'name price image')
          .populate('user', 'email')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .exec(),
        this.orderModel.countDocuments(query),
      ]);

      return { data, total };
    } catch (error) {
      throw new BadRequestException('Failed to fetch orders');
    }
  }

  async findOne(id: string, userId?: string): Promise<Order> {
    console.log("service-view:", userId)
    if (!id || id.length !== 24) {
      throw new BadRequestException('Invalid order ID format');
    }
    console.log("service-view:", userId)
    const order = await this.orderModel
      .findById(id)
      .populate('items.product', 'name price image')
      .populate('user', 'email')
      .exec();

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} does not exist`);
    }
    console.log("order.user.totring:", order.user._id.toString())
    if (userId && order.user._id.toString() !== userId) {
      throw new ForbiddenException('You can only access your own orders');
    }

    return order;
  }

  async cancelOrder(id: string, userId: string): Promise<Order> {
    const order = await this.findOne(id, userId);

    if (order.status === 'cancelled') {
      throw new BadRequestException('Order is already cancelled');
    }

    if (order.status === 'completed') {
      throw new BadRequestException('Cannot cancel a completed order');
    }

    // Restore product stock
    for (const item of order.items) {
      await this.productModel.findByIdAndUpdate(
        item.product,
        { $inc: { stock: item.quantity } }
      );
    }

    const cancelledOrder = await this.orderModel
      .findByIdAndUpdate(
        id,
        { status: 'cancelled' },
        { new: true }
      )
      .populate('items.product', 'name price image')
      .populate('user', 'email')
      .exec();

    return cancelledOrder;
  }

  async remove(id: string, userId?: string): Promise<void> {
    const order = await this.findOne(id, userId);

    if (order.status !== 'cancelled') {
      throw new BadRequestException('Only cancelled orders can be deleted');
    }

    const result = await this.orderModel.deleteOne({ _id: id }).exec();

    if (result.deletedCount === 0) {
      throw new NotFoundException(`Order with ID ${id} does not exist`);
    }
  }
}