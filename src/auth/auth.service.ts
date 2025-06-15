import { Injectable, BadRequestException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserAccount } from './schemas/account.schema';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthService {

  constructor(
    @InjectModel(UserAccount.name) private userAccountModel: Model<UserAccount>,
  ) {

  }

  async register(createDto: CreateAuthDto): Promise<Omit<UserAccount, 'password'>> {

    
    const existingEmail = await this.userAccountModel.findOne({
      email: createDto.email,
    });

    if (existingEmail) {
      throw new BadRequestException('User with this email already exists');
    }
    
    const hashedPassword = await bcrypt.hash(createDto.password, 10);

    
    const userData = {
      ...createDto,
      password: hashedPassword,
      isActive: true,
      role: 'customer',
    };

    
    const newUser = new this.userAccountModel(userData);
    const savedUser = await newUser.save();

    const response = savedUser.toObject();
    delete response.password;
    return response;
  }

  async login(loginDto: LoginDto): Promise<{ token: string }> {
    const account = await this.userAccountModel.findOne({ email: loginDto.email });
  
    if (!account) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!account.isActive) {
      throw new UnauthorizedException('Your account has been banned');
    }
  
    const isPasswordValid = await bcrypt.compare(loginDto.password, account.password);
  
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }
  
    const token = jwt.sign(
      { email: account.email, role: account.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' },
    );
  
    return { token };
  }

  async banUser(userEmail: string): Promise<UserAccount> {
    const user = await this.userAccountModel.findOne({ email: userEmail });
    
    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.role === 'admin') {
      throw new BadRequestException('Cannot ban admin users');
    }

    user.isActive = false;
    return user.save();
  }

  async unbanUser(userEmail: string): Promise<UserAccount> {
    const user = await this.userAccountModel.findOne({ email: userEmail });
    
    if (!user) {
      throw new BadRequestException('User not found');
    }

    user.isActive = true;
    return user.save();
  }

  async findOne(email: string): Promise<UserAccount> {
  
      const account = await this.userAccountModel.findOne({ email }).exec();
  
      if (!account) {
        throw new NotFoundException(`Personal information with Email ${email} not found`);
      }
  
      return account;
    }
    async update(
      userGmail: string,
      updateUserDto: UpdateAuthDto,
      currentUserGmail: string
  ): Promise<Omit<UserAccount, 'password'>> {
      if (userGmail !== currentUserGmail) {
          throw new UnauthorizedException('You can only update your own profile');
      }
  
      const user = await this.userAccountModel.findOne({ email: userGmail });
      if (!user) {
          throw new NotFoundException(`User with Email ${userGmail} not found`);
      }
  
      if (updateUserDto.email) {
          const existingUser = await this.userAccountModel.findOne({
              email: updateUserDto.email,
          });
          if (existingUser) {
              throw new BadRequestException('User with this email already exists');
          }
      }
      const updatedUser = await this.userAccountModel
          .findOneAndUpdate(
              { email: userGmail },
              updateUserDto,
              { new: true }
          )
          .exec();
  
      const response = updatedUser.toObject();
      delete response.password;
      return response;
  }

  async remove(userEmail: string, currentUserEmail: string): Promise<void> {
    if (userEmail !== currentUserEmail) {
      throw new UnauthorizedException('You can only delete your own account');
    }

    const result = await this.userAccountModel.deleteOne({ email: userEmail }).exec();

    if (result.deletedCount === 0) {
      throw new NotFoundException(`Student with Email ${userEmail} not found`);
    }
  }
}
