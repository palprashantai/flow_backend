import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { INestApplication } from '@nestjs/common'
import { AuthModule } from 'modules/auth/auth.module'
import { CrmUserModule } from 'modules/user/crm-user.module'



const releaseNotes = `
### 🆕 Smallcase Integration & Referral APIs — 2025-09-03

      ✅ New Smallcase Auth Management:
        - POST /smallcase/map-auth
          — Map Smallcase Auth Token with User Account
        - GET /smallcase/auth  
          — Retrieve user's Smallcase Auth ID
        - DELETE /smallcase/auth
          — Remove/disconnect Smallcase Auth ID
        - POST /appApi/smallcase/connect
          — Connect Smallcase account directly from app

      ✅ New Referral System:
        - GET /referral/home
          — Get wallet balance, referral code, and FAQs
          — Includes promotional card text and user referral code

      ✅ Database Updates:
        - Modified tbl_subscriber.authid to VARCHAR(50)
          — Now supports Smallcase Auth ID strings
        - Enhanced wallet balance calculation
          — Handles positive/negative amounts summation
`

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

      ${releaseNotes}  <!-- Add release notes here -->
    `
    )
    .setVersion('1.0')
    .addBearerAuth()
    .setExternalDoc('For more details click here', 'https://api-guide.streetfolios.com')
    .setTermsOfService('https://www.streetfolios.com/terms-of-service')
    .setContact('StreetFolios Support', 'https://www.streetfolios.com/support', 'support@streetfolios.com')
    .addTag('Authentication', 'User authentication and authorization')
    .addTag('User', 'User management and profile management')
    .addTag('Portfolio', 'Portfolio management and insights')
    .addTag('Payment', 'Smallcase and Razorpay investment and payment')
    .addTag('Smallcase', 'Smallcase investment and  payment ')
    .addTag('Referral', 'Referral and wallet program management')
    .addTag('Setting', 'App setting')
    .build()

  const document = SwaggerModule.createDocument(app, options, {
    include: [AuthModule, CrmUserModule ],
  })

  if (document.components?.securitySchemes) {
    delete document.components.securitySchemes['bearerAuth']
  }

  SwaggerModule.setup('api-docs', app, document)
}
