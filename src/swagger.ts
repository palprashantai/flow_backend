import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { INestApplication } from '@nestjs/common'
import { AuthModule } from 'modules/auth/auth.module'
import { SettingModule } from 'modules/setting/setting.module'
import { PortfolioModule } from 'modules/portfolio/portfolio.module'

export function setupSwagger(app: INestApplication) {
  const options = new DocumentBuilder()
    .setTitle('STREETFOLIOS API DOCUMENTATION')
    .setDescription(
      `
        This is StreetFolios API documentation - Your gateway to data-driven investment research and analysis.
        
        StreetFolios is a SEBI-Registered Research Analyst (INH000017082) founded in 2016, dedicated to supporting 
        Indian retail traders in achieving financial independence. Our platform offers comprehensive data-driven research 
        encompassing various stock market strategies, including technical and fundamental analysis, helping clients make 
        informed investment decisions.
        
        Our APIs are organized around REST principles, featuring secure endpoints with standard resource-oriented URLs, 
        form-encoded request bodies, JSON-encoded responses, and standard HTTP response codes. These APIs can be easily 
        integrated with any platform or app to provide seamless access to our research and analytics capabilities.`
    )
    .setVersion('1.0')
    .addBearerAuth()
    .setExternalDoc('For more details click here', 'https://api-guide.streetfolios.com')
    .setTermsOfService('https://www.streetfolios.com/terms-of-service')
    .setContact('StreetFolios Support', 'https://www.streetfolios.com/support', 'support@streetfolios.com')
    .addTag('Authentication', 'User authentication and authorization')
    .addTag('Setting', 'App setting')
    .addTag('Portfolio', 'Portfolio management and insights')
    .build()

  const document = SwaggerModule.createDocument(app, options, {
    include: [
      AuthModule,
      SettingModule,
      PortfolioModule,

      // Add your actual modules here
      // AuthModule,
      // UserModule,
      // ResearchModule,
      // StockAnalysisModule,
      // PortfolioModule,
      // MarketDataModule,
      // WatchlistModule,
      // AlertModule,
      // SubscriptionModule,
      // AnalyticsModule,
      // TradingStrategyModule,
      // RiskManagementModule,
      // ReportModule,
      // ConfigModule,
    ],
  })

  if (document.components?.securitySchemes) {
    delete document.components.securitySchemes['bearerAuth'] // Remove the default Bearer Authorization
  }

  // const theme = new SwaggerTheme('v3')
  // const themeOptions = {
  //   explorer: false,
  //   customCss: `
  //   .swagger-ui .model .property{
  //     display: none
  //   }
  //   .swagger-ui .topbar {
  //     background-color: #1f2937;
  //   }
  //   .swagger-ui .topbar .download-url-wrapper .select-label {
  //     color: #ffffff;
  //   }
  // `,
  // }
  SwaggerModule.setup('api-docs', app, document)
}
