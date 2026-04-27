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
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ClientsService } from './clients.service';
import { ListClientsDto } from './dto/list-clients.dto';
import { UpdateClientNoteDto } from './dto/update-client-note.dto';
import { UpdateDepositExemptDto } from './dto/update-deposit-exempt.dto';

@UseGuards(JwtAuthGuard)
@Controller('pro/clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get()
  findAll(@CurrentUser() user: any, @Query() query: ListClientsDto) {
    return this.clientsService.findAll(user, query);
  }

  @Get(':id')
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.clientsService.findOne(user, id);
  }

  @Patch(':id/deposit-exempt')
  updateDepositExempt(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateDepositExemptDto,
  ) {
    return this.clientsService.updateDepositExempt(user, id, dto);
  }

  @Put(':id/notes')
  upsertNote(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateClientNoteDto,
  ) {
    return this.clientsService.upsertNote(user, id, dto);
  }

  @Post(':id/block')
  blockClient(@CurrentUser() user: any, @Param('id') id: string) {
    return this.clientsService.blockClient(user, id);
  }
}