// DTO for response type
export class ReferralHomeResponseDto {
  walletBalance: number
  topCardText: string
  userReferralCode: string
  faqs: Array<{
    id: number
    title: string
    description: string
    faq_type: string
  }>
}
