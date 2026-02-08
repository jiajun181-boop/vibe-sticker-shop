import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  // 获取第一个产品
  const product = await prisma.product.findFirst()
  if (!product) {
    throw new Error('No products found. Run seed first.')
  }

  // 创建测试订单
  const order = await prisma.order.create({
    data: {
      status: 'paid',
      customerEmail: 'test@example.com',
      totalAmount: 9500, // $95.00
      shippingName: 'John Doe',
      shippingAddr: {
        line1: '123 Main St',
        city: 'Toronto',
        province: 'ON',
        postalCode: 'M5H 2N2',
        country: 'CA'
      },
      items: {
        create: {
          productId: product.id,
          name: product.name,
          unitAmount: 9500,
          printQuantity: 100,
          width: 10,
          height: 10,
        }
      }
    }
  })

  console.log(`✅ Mock Order Created: ${order.id}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())