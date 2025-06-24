import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type OrderStatus = 'pending' | 'completed' | 'cancelled';

@Schema({ timestamps: true })
export class Order extends Document {
  @Prop({ type: Types.ObjectId, ref: 'UserAccount', required: true })
  user: Types.ObjectId;

  @Prop([
    {
      product: { type: Types.ObjectId, ref: 'Product', required: true },
      quantity: { type: Number, required: true, min: 1 },
      price: { type: Number, required: true }, 
      subtotal: { type: Number, required: true },
    },
  ])
  items: { 
    product: Types.ObjectId; 
    quantity: number; 
    price: number; 
    subtotal: number; 
  }[];

  @Prop({ required: true })
  totalAmount: number; // Calculated by backend

  @Prop({ enum: ['pending', 'completed', 'cancelled'], default: 'pending' })
  status: OrderStatus;
}

export const OrderSchema = SchemaFactory.createForClass(Order);