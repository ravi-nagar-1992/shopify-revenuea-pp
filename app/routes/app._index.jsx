import {
  Page,
  Card,
  Text,
  Layout,
  BlockStack,
  InlineGrid,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { useLoaderData } from "@remix-run/react";
import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";

export async function loader({ request }) {
  const { session } = await authenticate.admin(request);

  const res = await fetch(`https://${session.shop}/admin/api/2024-01/orders.json?status=any&limit=20`, {
    headers: {
      "X-Shopify-Access-Token": session.accessToken,
      "Content-Type": "application/json",
    },
  });

  const data = await res.json();
  const orders = data.orders || [];

  let totalRevenue = 0;
  const items = [];

  for (const order of orders) {
    for (const item of order.line_items) {
      const isUpsell = item.properties?.some(
        (prop) =>
          prop.name === "upsell_items" && prop.value === "Upsell Offer"
      );

      if (isUpsell) {
        const price = parseFloat(item.price);
        const total = price * item.quantity;
        totalRevenue += total;

        items.push({
          name: item.title,
          quantity: item.quantity,
          price: price.toFixed(2),
          total: total.toFixed(2),
        });
      }
    }
  }

  return json({
    totalRevenue: totalRevenue.toFixed(2),
    items,
  });
}

export default function AdditionalPage() {
  const { totalRevenue, items } = useLoaderData();

  return (
    <Page>
      <TitleBar title="Upsell Revenue Dashboard" />
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="300">
              <Text as="h2" variant="headingLg">
                Total Upsell Revenue: ${totalRevenue}
              </Text>
              {items.length === 0 ? (
                <Text as="p" variant="bodyMd">
                  No upsell items found.
                </Text>
              ) : (
                <BlockStack gap="200">
                  {items.map((item, i) => (
                    <Card key={i} sectioned>
                      <InlineGrid columns={{ xs: "1fr 1fr" }}>
                        <Text variant="bodyMd" fontWeight="semibold">
                          {item.name}
                        </Text>
                        <Text variant="bodyMd">
                          {item.quantity} × ${item.price} = ${item.total}
                        </Text>
                      </InlineGrid>
                    </Card>
                  ))}
                </BlockStack>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
