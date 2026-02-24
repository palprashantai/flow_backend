import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { INestApplication } from '@nestjs/common'
import { CrmUserModule } from 'modules/user/crm-user.module'
import { CustomerModule } from 'modules/customer/customer.module'
import { QuotationModule } from 'modules/quotation/quotation.module'
import { InvoiceModule } from 'modules/invoice/invoice.module'
import { EnquiryModule } from 'modules/enquiry/enquiry.module'
import { TravelPackageModule } from 'modules/travel-package/travel-package.module'
import { ItineraryModule } from 'modules/itinerary/itinerary.module'
import { BookingModule } from 'modules/booking/booking.module'
import { CalendarEventModule } from 'modules/calendar-event/calendar-event.module'
import { CrmPaymentModule } from 'modules/crm-payment/crm-payment.module'
import { CrmAuthModule } from 'modules/crm-auth/crm-auth.module'



const releaseNotes = `
### 🆕 CRM & Travel Module Updates — 2026-02-24

      ✅ Customer & Enquiry Management
        - Customer creation and profile management
        - Enquiry tracking and follow-ups

      ✅ Quotation & Invoice System
        - Generate travel quotations
        - Convert quotation to invoice
        - Invoice payment tracking

      ✅ Travel Package & Itinerary Builder
        - Create customizable travel packages
        - Day-wise itinerary management
        - Editable itinerary timeline

      ✅ Booking & Calendar
        - Booking lifecycle management
        - Calendar event scheduling

      ✅ CRM Payments
        - Record and manage customer payments
`

export function setupSwagger(app: INestApplication) {
  const options = new DocumentBuilder()
    .setTitle('CRM & TRAVEL MANAGEMENT API')
    .setDescription(
      `
      This is the CRM & Travel Management API documentation.

      The system provides complete management for:
      - Customer & Enquiry handling
      - Travel Packages & Itinerary builder
      - Quotation & Invoice generation
      - Booking lifecycle
      - Calendar event scheduling
      - Payment tracking

      ${releaseNotes}
      `
    )
    .setVersion('1.0')
    .addBearerAuth()
    .setExternalDoc('API Guide', 'https://your-domain.com/api-guide')
    .setContact('CRM Support Team', 'https://your-domain.com/support', 'support@your-domain.com')

    // Core Tags
    // .addTag('Authentication', 'User authentication and authorization')
    // .addTag('User', 'CRM user management')
    // .addTag('Customer', 'Customer profile management')
    // .addTag('Enquiry', 'Customer enquiry tracking')
    // .addTag('Quotation', 'Travel quotation management')
    // .addTag('Invoice', 'Invoice generation and tracking')
    // .addTag('Travel Package', 'Travel package management')
    // .addTag('Itinerary', 'Day-wise itinerary builder')
    // .addTag('Booking', 'Booking management')
    // .addTag('Calendar', 'Calendar event management')
    // .addTag('Payment', 'CRM payment management')
    
    .build()

  const document = SwaggerModule.createDocument(app, options, {
    include: [
      CrmUserModule,
      CustomerModule,
      EnquiryModule,
      InvoiceModule,
      ItineraryModule,
      QuotationModule,
      TravelPackageModule,
      BookingModule,
      CalendarEventModule,
      CrmPaymentModule,
      CrmAuthModule
    ],
  })

  SwaggerModule.setup('api-docs', app, document)
}
