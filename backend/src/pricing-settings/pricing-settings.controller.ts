import {
  Body,
  Controller,
  Get,
  Patch,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/permissions.decorator';
import { UpdatePricingSettingsDto } from './dto/update-pricing-settings.dto';
import { PricingSettingsService } from './pricing-settings.service';

@ApiTags('admin-pricing-settings')
@Controller('admin/pricing-settings')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('JWT-auth')
export class PricingSettingsController {
  constructor(
    private readonly pricingSettingsService: PricingSettingsService,
  ) {}

  @Get()
  @Permissions('finance.payout.manage')
  @ApiOperation({ summary: 'Get global pricing settings' })
  getSettings(@Request() req: { user: { sub: string } }) {
    return this.pricingSettingsService.getAdminSettings(req.user.sub);
  }

  @Patch()
  @Permissions('finance.payout.manage')
  @ApiOperation({
    summary: 'Update global pricing settings (Super Admin only)',
  })
  updateSettings(
    @Request() req: { user: { sub: string } },
    @Body() dto: UpdatePricingSettingsDto,
  ) {
    return this.pricingSettingsService.updateAdminSettings(req.user.sub, dto);
  }
}
