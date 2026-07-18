import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthService } from './auth.service';
import { ChangeAdminPasswordDto } from './dto/change-admin-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdateAdminProfileDto } from './dto/update-admin-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { avatarMulterOptions } from '../upload/multer.config';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('admin/login')
  @HttpCode(HttpStatus.OK)
  adminLogin(@Body() dto: LoginDto) {
    return this.authService.adminLogin(dto);
  }

  @Get('admin/me')
  @UseGuards(JwtAuthGuard)
  getAdminProfile(@Request() req: { user: { id: number } }) {
    return this.authService.getAdminProfile(req.user.id);
  }

  @Patch('admin/me')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  updateAdminProfile(
    @Request() req: { user: { id: number } },
    @Body() dto: UpdateAdminProfileDto,
  ) {
    return this.authService.updateAdminProfile(req.user.id, dto);
  }

  @Patch('admin/me/password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  changeAdminPassword(
    @Request() req: { user: { id: number } },
    @Body() dto: ChangeAdminPasswordDto,
  ) {
    return this.authService.changeAdminPassword(req.user.id, dto);
  }

  @Post('admin/me/avatar')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', avatarMulterOptions))
  @HttpCode(HttpStatus.OK)
  uploadAdminAvatar(
    @Request() req: { user: { id: number } },
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.authService.uploadAdminAvatar(req.user.id, file);
  }

  @Delete('admin/me/avatar')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  deleteAdminAvatar(@Request() req: { user: { id: number } }) {
    return this.authService.deleteAdminAvatar(req.user.id);
  }

  @Post('admin/refresh')
  @UseGuards(JwtRefreshGuard)
  @HttpCode(HttpStatus.OK)
  adminRefresh(@Request() req: { user: { id: number } }) {
    return this.authService.adminRefresh(req.user.id);
  }

  @Post('refresh')
  @UseGuards(JwtRefreshGuard)
  @HttpCode(HttpStatus.OK)
  refresh(@Request() req: { user: { id: number } }) {
    return this.authService.refresh(req.user.id);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getProfile(@Request() req: { user: { id: number } }) {
    return this.authService.getProfile(req.user.id);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  updateProfile(
    @Request() req: { user: { id: number } },
    @Body() dto: UpdateProfileDto,
  ) {
    return this.authService.updateProfile(req.user.id, dto);
  }

  @Delete('me')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  forgetMe(@Request() req: { user: { id: number } }) {
    return this.authService.forgetMe(req.user.id);
  }
}
