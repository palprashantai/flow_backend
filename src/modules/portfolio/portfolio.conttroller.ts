import {  Controller, Get, Query } from '@nestjs/common'
import { PortfolioService } from './portfolio.service'
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger'
import { Auth, GetUserId } from 'modules/auth/auth.guard'
import { FilterPortfolioDto } from './portfolio.dto'

@ApiTags('Portfolio')
@Controller('appApi/portfolio')
export class PortfolioController {
  constructor(private readonly portfolioService: PortfolioService) {}

  @Get('home')
  @ApiBearerAuth()
  @Auth()
  @ApiOperation({
    summary: 'Get home screen data',
    description: 'Returns numbers data, investment insights, market view, indices, FAQs, top gainers/losers, and research summary.',
  })
  @ApiResponse({ status: 200, description: 'Home screen data loaded successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getHomeData(@GetUserId('id') userId: number) {
    return await this.portfolioService.getHomeData(userId)
  }

  @Get('list')
  @ApiBearerAuth()
  @Auth()
  @ApiOperation({ summary: 'Get list of portfolios with filters' })
  @ApiQuery({ name: 'search', required: false })
  async listPortfolios(@Query() filterDto: FilterPortfolioDto, @GetUserId('id') userId?: number) {
    return this.portfolioService.getFilteredPortfolios(filterDto, userId)
  }

  // @Get('details')
  // // @ApiBearerAuth()
  // @ApiOperation({ summary: 'Get service portfolio details by slug' })
  // @ApiQuery({ name: 'slug', required: true, type: String })
  // @ApiResponse({ status: 200, description: 'Service portfolio details returned successfully' })
  // @ApiResponse({ status: 400, description: 'Slug is missing' })
  // @ApiResponse({ status: 404, description: 'Service not found' })
  // async getServicePortfolio(@Query('slug') slug: string, @GetUserId('id') userId?: number) {
  //   if (!slug) {
  //     throw new BadRequestException('Slug parameter is required')
  //   }

  //   return await this.portfolioService.getServicePortfolio(slug, userId)
  // }
}
