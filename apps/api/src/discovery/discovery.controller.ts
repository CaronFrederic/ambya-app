import { Controller, Get, Param, Query } from '@nestjs/common'
import { DiscoveryService } from './discovery.service'
import { HomeQueryDto } from './dto/home-query.dto'
import { SearchQueryDto } from './dto/search-query.dto'
import { SalonAvailabilityQueryDto } from './dto/salon-availability-query.dto'

@Controller()
export class DiscoveryController {
  constructor(private readonly discovery: DiscoveryService) {}

  @Get('discover/home')
  home(@Query() query: HomeQueryDto) {
    return this.discovery.home(query)
  }

  @Get('discover/search')
  search(@Query() query: SearchQueryDto) {
    return this.discovery.search(query)
  }

  @Get('salons/:id')
  salonDetails(@Param('id') id: string) {
    return this.discovery.salonDetails(id)
  }

  @Get('salons/:id/availability')
  salonAvailability(@Param('id') id: string, @Query() query: SalonAvailabilityQueryDto) {
    return this.discovery.salonAvailability(id, query)
  }
}
