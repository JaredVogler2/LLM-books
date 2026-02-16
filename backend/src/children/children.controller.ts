import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ChildrenService } from './children.service';
import { CreateChildDto } from './dto/create-child.dto';
import { UpdateChildDto } from './dto/update-child.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('children')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('children')
export class ChildrenController {
  constructor(private childrenService: ChildrenService) {}

  @Post()
  @ApiOperation({ summary: 'Create a child profile' })
  create(@CurrentUser('id') userId: string, @Body() dto: CreateChildDto) {
    return this.childrenService.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all child profiles for current user' })
  findAll(@CurrentUser('id') userId: string) {
    return this.childrenService.findAllByUser(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a child profile by ID' })
  findOne(@Param('id') id: string) {
    return this.childrenService.findById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a child profile' })
  update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateChildDto,
  ) {
    return this.childrenService.update(id, userId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a child profile' })
  remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.childrenService.remove(id, userId);
  }
}
