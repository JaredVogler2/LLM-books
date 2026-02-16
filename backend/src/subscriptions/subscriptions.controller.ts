import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { SubscriptionsService } from './subscriptions.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

class CreateSubscriptionDto {
  @ApiProperty({ enum: ['BIRTHDAY_YEARLY', 'HOLIDAY_SEASONAL', 'QUARTERLY_ADVENTURE'] })
  @IsString()
  type: 'BIRTHDAY_YEARLY' | 'HOLIDAY_SEASONAL' | 'QUARTERLY_ADVENTURE';

  @ApiProperty()
  @IsUUID()
  childProfileId: string;
}

@ApiTags('subscriptions')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private subscriptionsService: SubscriptionsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new subscription' })
  create(@CurrentUser('id') userId: string, @Body() dto: CreateSubscriptionDto) {
    return this.subscriptionsService.create(userId, dto.type as any, dto.childProfileId);
  }

  @Get()
  @ApiOperation({ summary: 'List all subscriptions' })
  findAll(@CurrentUser('id') userId: string) {
    return this.subscriptionsService.findAllByUser(userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Cancel a subscription' })
  cancel(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.subscriptionsService.cancel(id, userId);
  }
}
