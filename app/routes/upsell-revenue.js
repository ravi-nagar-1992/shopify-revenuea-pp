import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  console.log('test');

  const orders = await admin.rest.fetch(`/orders.json?status=any&limit=50`);

  let totalRevenue = 0;
  const upsellLineItems = [];

  for (const order of orders.body.orders) {
    for (const item of order.line_items || []) {
      const props = item.properties || [];

      const isUpsell = props.some(
        (prop) => prop.name === "upsell_items" && prop.value === "Upsell Offer"
      );

      if (isUpsell) {
        const lineTotal = parseFloat(item.price) * item.quantity;
        totalRevenue += lineTotal;

        upsellLineItems.push({
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          total: lineTotal.toFixed(2),
        });
      }
    }
  }

  console.log("🟢 Upsell revenue calculated:", {
    totalRevenue,
    items: upsellLineItems,
  });

  return json({
    totalRevenue: totalRevenue.toFixed(2),
    items: upsellLineItems,
  });
};

