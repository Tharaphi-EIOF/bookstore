import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { Permissions } from '../auth/permissions.decorator';
import { PermissionsGuard } from '../auth/permissions.guard';
import { LoyaltyService } from './loyalty.service';
import { CreateLoyaltyRewardDto } from './dto/create-loyalty-reward.dto';
import { UpdateLoyaltyRewardDto } from './dto/update-loyalty-reward.dto';
import { GrantStickersDto } from './dto/grant-stickers.dto';
import { GrantPromotionDto } from './dto/grant-promotion.dto';

type AuthenticatedRequest = {
  user: {
    sub: string;
  };
};

@ApiTags('loyalty')
@Controller('loyalty')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class LoyaltyController {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  @Get('me')
  @ApiOperation({
    summary: 'Get loyalty points, history, rewards, and personal coupon gifts',
  })
  getMyDashboard(@Request() req: AuthenticatedRequest) {
    return this.loyaltyService.getMyDashboard(req.user.sub);
  }

  @Post('rewards/:id/redeem')
  @ApiOperation({ summary: 'Redeem a points reward' })
  redeemReward(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.loyaltyService.redeemReward(req.user.sub, id);
  }
}

@ApiTags('admin-loyalty')
@Controller('admin/loyalty')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('JWT-auth')
export class AdminLoyaltyController {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  @Get('rewards')
  @Permissions('finance.payout.manage')
  @ApiOperation({ summary: 'List loyalty rewards for admin management' })
  listRewards(@Request() req: AuthenticatedRequest) {
    return this.loyaltyService.listRewards(req.user.sub);
  }

  @Post('rewards')
  @Permissions('finance.payout.manage')
  @ApiOperation({ summary: 'Create loyalty reward' })
  createReward(
    @Request() req: AuthenticatedRequest,
    @Body() dto: CreateLoyaltyRewardDto,
  ) {
    return this.loyaltyService.createReward(req.user.sub, dto);
  }

  @Patch('rewards/:id')
  @Permissions('finance.payout.manage')
  @ApiOperation({ summary: 'Update loyalty reward' })
  updateReward(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateLoyaltyRewardDto,
  ) {
    return this.loyaltyService.updateReward(req.user.sub, id, dto);
  }

  @Post('grants/stickers')
  @Permissions('finance.payout.manage')
  @ApiOperation({ summary: 'Grant points to selected users' })
  grantStickers(
    @Request() req: AuthenticatedRequest,
    @Body() dto: GrantStickersDto,
  ) {
    return this.loyaltyService.grantStickers(req.user.sub, dto);
  }

  @Post('grants/promotions')
  @Permissions('finance.payout.manage')
  @ApiOperation({ summary: 'Grant user-specific coupons to selected users' })
  grantPromotions(
    @Request() req: AuthenticatedRequest,
    @Body() dto: GrantPromotionDto,
  ) {
    return this.loyaltyService.grantPromotions(req.user.sub, dto);
  }
}
