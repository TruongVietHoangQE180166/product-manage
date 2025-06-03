import { IsNotEmpty, IsString, IsNumber, IsOptional, IsBoolean, Min, MaxLength } from 'class-validator';

export class CreateProductDto {
  @IsNotEmpty({ message: 'ID is required' })
  @IsNumber({}, { message: 'ID must be a number' })
  id: number;

  @IsNotEmpty({ message: 'Product name is required' })
  @IsString({ message: 'Product name must be a string' })
  @MaxLength(50, { message: 'Product name cannot exceed 50 characters' })
  name: string;

  @IsNotEmpty({ message: 'Price is required' })
  @IsNumber({}, { message: 'Price must be a number' })
  @Min(0, { message: 'Price must be a positive number' })
  price: number;

  @IsNotEmpty({ message: 'Description is required' })
  @IsString({ message: 'Description must be a string' })
  @MaxLength(200, { message: 'Description cannot exceed 200 characters' })
  description: string;

  @IsNotEmpty({ message: 'Category is required' })
  @IsString({ message: 'Category must be a string' })
  @MaxLength(30, { message: 'Category cannot exceed 30 characters' })
  category: string;

  @IsOptional()
  @IsNumber({}, { message: 'Stock must be a number' })
  @Min(0, { message: 'Stock cannot be a negative number' })
  stock?: number;

  @IsOptional()
  @IsBoolean({ message: 'isActive must be a boolean value' })
  isActive?: boolean;

  @IsOptional()
  @IsString({ message: 'Image must be a string (URL)' })
  image?: string; 
}