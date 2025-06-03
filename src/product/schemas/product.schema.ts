import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Product extends Document {
  @Prop({ required: true, unique: true })
  id: number;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  price: number;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  category: string;

  @Prop({ type: Number, default: 0 })
  stock: number;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: String, required: false })
  image?: string; 
}

export const ProductSchema = SchemaFactory.createForClass(Product);