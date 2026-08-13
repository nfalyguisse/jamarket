import { Module } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RightsGuard } from '../common/guards/rights.guard';
import { AdminRolesController } from './admin-roles.controller';
import { AdminRolesService } from './admin-roles.service';
import { AdminUsersController } from './admin-users.controller';
import { AdminUsersService } from './admin-users.service';

@Module({
  controllers: [AdminUsersController, AdminRolesController],
  providers: [AdminUsersService, AdminRolesService, RightsGuard, Reflector],
  exports: [AdminRolesService],
})
export class AdminModule {}
