import { dataSource } from 'databases/data-source'

export const streetfoliosInfo = {
  title: 'About Streetfolios',
  description:
    'Streetfolios are ready-made model portfolios of stocks and ETFs, curated by SEBI-registered Research Analysts at Streetgains. They are designed to make long-term investing simple, transparent, and research-backed.',
  features: [
    {
      title: 'Curated Portfolios',
      description:
        'Built using data-driven research, covering themes like Bluechips, High Growth, Value, Sectors, and Philosophy-based investing.',
      icon: 'portfolio',
    },
    {
      title: 'Risk-Labeled',
      description: 'Every portfolio is tagged with risk level (Low, Moderate, High) so investors can choose based on comfort.',
      icon: 'risk',
    },
    {
      title: 'Transparent Performance',
      description: 'You can track past CAGR, volatility, and benchmark comparison.',
      icon: 'performance',
    },
    {
      title: 'Regular Rebalancing',
      description: 'Portfolios are reviewed and rebalanced at defined intervals (e.g., quarterly) to stay aligned with goals.',
      icon: 'rebalance',
    },
    {
      title: 'Accessible',
      description: 'Start investing with as little as ₹5,000–₹10,000 depending on the portfolio.',
      icon: 'accessible',
    },
    {
      title: 'SEBI Compliant',
      description:
        'All portfolios follow SEBI’s Jan 2025 guidelines for Research Analysts, with clear disclosure of methodology, rationale, and risks.',
      icon: 'sebi',
    },
  ],
  whoShouldInvest: [
    'Beginners Looking For Guided Investing Without Daily Trading Stress.',
    'Working Professionals With Limited Screen Time.',
    'Investors Who Want Diversified Baskets Instead Of Picking Individual Stocks.',
    'Anyone Aiming For Long-Term Wealth Creation Through A Disciplined Approach.',
  ],

  videoUrl: 'https://example.com/streetfolios-intro.mp4', // replace with actual video URL or YouTube link

  processToInvest: [
    {
      step: 'Select a Portfolio',
      description: 'Browse our curated portfolios and choose one that aligns with your investment goals and risk tolerance.',
      icon: 'select-portfolio',
    },
    {
      step: 'Invest Seamlessly',
      description: 'One-click execution through integrated brokers. Invest in minutes, with no hidden fees.',
      icon: 'invest',
    },
    {
      step: 'Track & Rebalance',
      description:
        'Get regular updates and recommendation on rebalancing your portfolio to keep it aligned with market trends and your risk comfort.',
      icon: 'rebalance',
    },
    {
      step: 'Grow Your Wealth',
      description: 'Stay invested, track your progress, and reach your financial goals with consistent, research-backed strategies.',
      icon: 'wealth',
    },
  ],
}

export async function getSubscriberInfo(subscriberid: number) {
  const ds = await dataSource
  return await ds
    .createQueryBuilder()
    .select([
      't1.id AS id',
      't1.subscriberid AS subscriberid',
      't1.fullname AS fullname',
      't1.email AS email',
      't1.mobileno AS mobileno',
      't1.imgurl AS imgurl',
      't1.state AS state',
      't1.language AS language',
      't1.address AS address',
      't2.user_fullname AS user_fullname',
      't2.user_mob2 AS user_mob2',
      't2.user_whatsapp AS user_whatsapp',
    ])
    .from('tbl_subscriber', 't1')
    .leftJoin('tbl_userinfo', 't2', 't1.assignedto = t2.id')
    .where('t1.isdelete = 0 AND t1.id = :subscriberid', { subscriberid })
    .getRawOne()
}

export async function getCompanyInfo() {
  const ds = await dataSource
  return await ds
    .createQueryBuilder()
    .select(['c.whatsapp_link', 'c.technical_email', 'c.technical_phone'])
    .from('tbl_company', 'c')
    .where('c.id = 1 AND c.isdelete = 0')
    .getRawOne()
}

export async function getFinePrint(slug: string) {
  const ds = await dataSource
  return await ds.query(
    `SELECT title, slug, heading, hasForm, description 
         FROM tbl_custom_pages 
         WHERE isdelete = 0 AND slug = ? 
         ORDER BY id`,
    [slug]
  )
}
export async function updateNotifications(updateFields: any, userId: number) {
  const ds = await dataSource

  await ds
    .createQueryBuilder()
    .update('tbl_subscriber')
    .set(updateFields)
    .where('subscriberid = :subscriberid', { subscriberid: userId })
    .execute()
}

export async function getFaqList(seoId: number) {
  try {
    const ds = await dataSource

    const faqs = await ds
      .createQueryBuilder()
      .select(['id', 'title', 'description', 'faq_type'])
      .from('tbl_seo_faq', 'faq')
      .where('faq.isdelete = :isdelete', { isdelete: 0 })
      .andWhere('faq.seo_id = :seoId', { seoId })
      .orderBy('faq.id', 'ASC')
      .getRawMany()

    return { success: true, data: faqs }
  } catch (error) {
    console.error('Error fetching FAQs:', error.message)
    return { success: false, message: 'Failed to fetch FAQ list', error: error.message }
  }
}
