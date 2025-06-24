import { IsNotEmpty, IsArray, IsString, Min, ValidateNested, ArrayMinSize, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class OrderItemDto {
  @IsNotEmpty({ message: 'Product ID is required' })
  @IsString({ message: 'Product ID must be a string' })
  product: string; 

  @IsNotEmpty({ message: 'Quantity is required' })
  @IsNumber({}, { message: 'Quantity must be a number' })
  @Min(1, { message: 'Quantity must be at least 1' })
  quantity: number;
}

export class CreateOrderDto {
  @IsNotEmpty({ message: 'User ID is required' })
  @IsString({ message: 'User ID must be a string' })
  user: string; 
  @IsNotEmpty({ message: 'Items are required' })
  @IsArray({ message: 'Items must be an array' })
  @ArrayMinSize(1, { message: 'Order must contain at least one item' })
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}