import { PartialType } from '@nestjs/swagger';
import { CreatePartnerDealDto } from './create-partner-deal.dto';

export class UpdatePartnerDealDto extends PartialType(CreatePartnerDealDto) {}
