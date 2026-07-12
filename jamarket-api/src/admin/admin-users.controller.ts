import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { RightEnum } from '../../generated/prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequireRights, RightsGuard } from '../common/guards/rights.guard';
import { AdminUsersService } from './admin-users.service';
import { BanUserDto } from './dto/ban-user.dto';
import { FilterUsersDto } from './dto/filter-users.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';

interface AuthRequest {
  user: {
    id: number;
    role: { rights: RightEnum[] };
  };
}

@Controller('admin/users')
@UseGuards(JwtAuthGuard, RightsGuard)
@RequireRights(RightEnum.SUPER_ADMIN)
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Get()
  findAll(@Query() filters: FilterUsersDto) {
    return this.adminUsersService.findAll(filters);
  }

  @Get('roles')
  getAssignableRoles() {
    return this.adminUsersService.getAssignableRoles();
  }

  @Patch(':id/ban')
  banUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: BanUserDto,
    @Request() req: AuthRequest,
  ) {
    return this.adminUsersService.banUser(id, dto, req.user);
  }

  @Patch(':id/role')
  updateRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserRoleDto,
    @Request() req: AuthRequest,
  ) {
    return this.adminUsersService.updateRole(id, dto, req.user);
  }
}
