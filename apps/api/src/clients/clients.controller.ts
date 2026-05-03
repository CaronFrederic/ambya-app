import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  Put
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtUser } from '../auth/decorators/current-user.decorator';
import { ClientsService } from './clients.service';
import { ListClientsDto } from './dto/list-clients.dto';
import { UpdateClientNoteDto } from './dto/update-client-note.dto';
import { UpdateDepositExemptDto } from './dto/update-deposit-exempt.dto';

@UseGuards(JwtAuthGuard)
@Controller('pro/clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get()
  findAll(@CurrentUser() user: JwtUser, @Query() query: ListClientsDto) {
    return this.clientsService.findAll(user, query);
  }

  @Get(':id')
  findOne(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.clientsService.findOne(user, id);
  }

  @Patch(':id/deposit-exempt')
  updateDepositExempt(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Body() dto: UpdateDepositExemptDto,
  ) {
    return this.clientsService.updateDepositExempt(user, id, dto);
  }

  @Put(':id/notes')
  upsertNote(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Body() dto: UpdateClientNoteDto,
  ) {
    return this.clientsService.upsertNote(user, id, dto);
  }

  @Post(':id/block')
  blockClient(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.clientsService.blockClient(user, id);
  }
}
