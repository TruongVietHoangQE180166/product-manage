import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document} from 'mongoose';


export type UserRole = 'customer' | 'admin'; 
@Schema({ timestamps: true })
export class UserAccount extends Document {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;


  @Prop({ default: true })
  isActive: boolean;

  @Prop({ required: true, enum: ['customer', 'admin'], default: 'customer' })
  role: UserRole; 
}

export const UserAccountSchema = SchemaFactory.createForClass(UserAccount);
