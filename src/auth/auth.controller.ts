import { Controller, Post, Body, BadRequestException, UseGuards, Get, Param, Request, Patch, Delete } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { LoginDto } from './dto/login.dto';
import { AdminGuard } from 'src/guard/admin.guard';
import { AuthGuard } from 'src/guard/auth.guard';
import { UpdateAuthDto } from './dto/update-auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() createAuthDto: CreateAuthDto) {
    try {
      const newUser = await this.authService.register(createAuthDto);
      return {
        message: 'User registered successfully',
        data: newUser,
      };
    } catch (error) {
      throw new BadRequestException({
        status: 400,
        message: error.message,
      });
    }
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    try {
      const data = await this.authService.login(loginDto);
      return {
        method: 'LOGIN',
        data,
      };
    } catch (error) {
      throw new BadRequestException({
        method: 'LOGIN',
        error: {
          status: 400,
          message: error.message,
        },
      });
    }
  }

  @UseGuards(AuthGuard, AdminGuard)
  @Post('ban/:email')
  async banUser(@Param('email') email: string) {
    try {
      const user = await this.authService.banUser(email);
      return {
        message: 'User banned successfully',
        data: {
          email: user.email,
          isActive: user.isActive,
        },
      };
    } catch (error) {
      throw new BadRequestException({
        status: 400,
        message: error.message,
      });
    }
  }

  @UseGuards(AuthGuard, AdminGuard)
  @Post('unban/:email')
  async unbanUser(@Param('email') email: string) {
    try {
      const user = await this.authService.unbanUser(email);
      return {
        message: 'User unbanned successfully',
        data: {
          email: user.email,
          isActive: user.isActive,
        },
      };
    } catch (error) {
      throw new BadRequestException({
        status: 400,
        message: error.message,
      });
    }
  }

  @UseGuards(AuthGuard, AdminGuard)
  @Get('user-status/:email')
  async findOne(@Param('email') email: string) {
    try {
      const user = await this.authService.findOne(email);
      return {
        data: user,
      };
    } catch (error) {
      throw new BadRequestException({
        status: 400,
        message: error.message,
      });
    }
  }

  @UseGuards(AuthGuard)
  @Patch('update/:email')
  async update(
    @Param('email') email: string,
    @Body() updateDto: UpdateAuthDto,
    @Request() req,
  ) {
    try {
      const data = await this.authService.update(email, updateDto, req.user.email);
      return {
        method: 'UPDATE',
        data,
      };
    } catch (error) {
      throw new BadRequestException({
        method: 'UPDATE',
        error: {
          status: 400,
          message: error.message,
        },
      });
    }
  }

  @UseGuards(AuthGuard)
  @Delete('delete/:email')
  async remove(@Param('email') email: string, @Request() req) {
    try {
      await this.authService.remove(email, req.user.email);
      return {
        method: 'DELETE',
        data: { message: `User with email ${email} deleted successfully` },
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