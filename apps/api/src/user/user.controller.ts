import { Controller, Get, Patch, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserService } from './user.service';

@ApiTags('Users')
@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  async getMe(@Request() req: any) {
    return this.userService.getProfile(req.user.userId);
  }

  @Patch('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current user profile' })
  async updateMe(@Request() req: any, @Body() data: {
    username?: string;
    avatar?: string;
    email?: string;
    twitter?: string;
    telegram?: string;
    discord?: string;
  }) {
    return this.userService.updateProfile(req.user.userId, data);
  }

  @Get('me/stats')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user statistics' })
  async getMyStats(@Request() req: any) {
    return this.userService.getStats(req.user.userId);
  }

  @Get(':wallet/profile')
  @ApiOperation({ summary: 'Get user profile by wallet address' })
  async getByWallet(@Body('wallet') wallet: string) {
    return this.userService.getByWallet(wallet);
  }
}
