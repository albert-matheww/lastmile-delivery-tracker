import "dotenv/config";
import { prisma } from "../src/lib/db/client";
import { hashPassword } from "../src/lib/auth/password";
import { createOrder } from "../src/lib/orders/create-order";
import { autoAssignOrder } from "../src/lib/orders/assign-order";
import { updateOrderStatus } from "../src/lib/orders/update-status";

const DEMO_PASSWORD = "Password123!";

async function main() {
  console.log("Seeding zones...");
  const zoneDefs = [
    { name: "North Zone", code: "N" },
    { name: "South Zone", code: "S" },
    { name: "East Zone", code: "E" },
    { name: "West Zone", code: "W" },
  ];
  const zones = new Map<string, { id: string }>();
  for (const z of zoneDefs) {
    const zone = await prisma.zone.upsert({
      where: { code: z.code },
      create: z,
      update: {},
    });
    zones.set(z.code, zone);
  }

  console.log("Seeding pincode -> zone areas...");
  const areaDefs: Array<{ pincode: string; label: string; zoneCode: string }> = [
    { pincode: "110001", label: "Connaught Place", zoneCode: "N" },
    { pincode: "110009", label: "Civil Lines", zoneCode: "N" },
    { pincode: "110033", label: "Model Town", zoneCode: "N" },
    { pincode: "560001", label: "MG Road", zoneCode: "S" },
    { pincode: "560034", label: "Koramangala", zoneCode: "S" },
    { pincode: "560095", label: "Indiranagar", zoneCode: "S" },
    { pincode: "700001", label: "BBD Bagh", zoneCode: "E" },
    { pincode: "700019", label: "Ballygunge", zoneCode: "E" },
    { pincode: "700091", label: "Salt Lake", zoneCode: "E" },
    { pincode: "400001", label: "Fort", zoneCode: "W" },
    { pincode: "400050", label: "Bandra", zoneCode: "W" },
    { pincode: "400069", label: "Andheri", zoneCode: "W" },
  ];
  for (const a of areaDefs) {
    await prisma.area.upsert({
      where: { pincode: a.pincode },
      create: { pincode: a.pincode, label: a.label, zoneId: zones.get(a.zoneCode)!.id },
      update: { label: a.label, zoneId: zones.get(a.zoneCode)!.id },
    });
  }

  console.log("Seeding rate cards...");
  const rateCardDefs = [
    { orderType: "B2C" as const, zoneRelation: "INTRA" as const, baseFee: 30, perKgRate: 12 },
    { orderType: "B2C" as const, zoneRelation: "INTER" as const, baseFee: 50, perKgRate: 18 },
    { orderType: "B2B" as const, zoneRelation: "INTRA" as const, baseFee: 20, perKgRate: 9 },
    { orderType: "B2B" as const, zoneRelation: "INTER" as const, baseFee: 35, perKgRate: 14 },
  ];
  for (const rc of rateCardDefs) {
    await prisma.rateCard.upsert({
      where: { orderType_zoneRelation: { orderType: rc.orderType, zoneRelation: rc.zoneRelation } },
      create: rc,
      update: { baseFee: rc.baseFee, perKgRate: rc.perKgRate },
    });
  }

  console.log("Seeding COD surcharge config...");
  const codDefs = [
    { orderType: "B2C" as const, flatFee: 15, percentOfCharge: 0.02 },
    { orderType: "B2B" as const, flatFee: 10, percentOfCharge: 0.01 },
  ];
  for (const c of codDefs) {
    await prisma.codSurchargeConfig.upsert({
      where: { orderType: c.orderType },
      create: c,
      update: { flatFee: c.flatFee, percentOfCharge: c.percentOfCharge },
    });
  }

  console.log("Seeding users...");
  const passwordHash = await hashPassword(DEMO_PASSWORD);

  const admin = await prisma.user.upsert({
    where: { email: "admin@lastmile.demo" },
    create: { name: "Ava Admin", email: "admin@lastmile.demo", passwordHash, role: "ADMIN" },
    update: {},
  });

  const customerDefs = [
    { name: "Priya Sharma", email: "priya@lastmile.demo" },
    { name: "Rahul Verma", email: "rahul@lastmile.demo" },
    { name: "Meera Iyer", email: "meera@lastmile.demo" },
  ];
  const customers = [];
  for (const c of customerDefs) {
    const customer = await prisma.user.upsert({
      where: { email: c.email },
      create: { name: c.name, email: c.email, passwordHash, role: "CUSTOMER" },
      update: {},
    });
    customers.push(customer);
  }

  const agentDefs = [
    { name: "Nikhil North", email: "nikhil@lastmile.demo", zoneCode: "N" },
    { name: "Sana South", email: "sana@lastmile.demo", zoneCode: "S" },
    { name: "Ehsan East", email: "ehsan@lastmile.demo", zoneCode: "E" },
    { name: "Wendy West", email: "wendy@lastmile.demo", zoneCode: "W" },
  ];
  for (const a of agentDefs) {
    const user = await prisma.user.upsert({
      where: { email: a.email },
      create: { name: a.name, email: a.email, passwordHash, role: "AGENT" },
      update: {},
    });
    await prisma.agent.upsert({
      where: { userId: user.id },
      create: { userId: user.id, zoneId: zones.get(a.zoneCode)!.id },
      update: {},
    });
  }

  console.log("Seeding demo orders...");
  const existingOrders = await prisma.order.count();
  if (existingOrders === 0) {
    const actor = { id: admin.id, role: "ADMIN" as const };

    // 1) Fresh, unassigned order (B2C, prepaid, intra-zone).
    await createOrder(
      {
        customerId: customers[0].id,
        pickupAddress: "12 MG Road, Bengaluru",
        pickupPincode: "560001",
        dropAddress: "45 Koramangala 4th Block, Bengaluru",
        dropPincode: "560034",
        lengthCm: 20,
        breadthCm: 15,
        heightCm: 10,
        actualWeightKg: 1.2,
        orderType: "B2C",
        paymentType: "PREPAID",
      },
      actor
    );

    // 2) Order that progresses to delivered (B2B, COD, inter-zone).
    const order2 = await createOrder(
      {
        customerId: customers[1].id,
        pickupAddress: "Warehouse 3, Bandra, Mumbai",
        pickupPincode: "400050",
        dropAddress: "221 Civil Lines, Delhi",
        dropPincode: "110009",
        lengthCm: 40,
        breadthCm: 30,
        heightCm: 25,
        actualWeightKg: 6,
        orderType: "B2B",
        paymentType: "COD",
      },
      actor
    );
    await autoAssignOrder(order2.id, actor);
    await updateOrderStatus(order2.id, "PICKED_UP", actor, { allowAny: true });
    await updateOrderStatus(order2.id, "IN_TRANSIT", actor, { allowAny: true });
    await updateOrderStatus(order2.id, "OUT_FOR_DELIVERY", actor, { allowAny: true });
    await updateOrderStatus(order2.id, "DELIVERED", actor, { allowAny: true });

    // 3) Order with a failed delivery attempt, awaiting reschedule.
    const order3 = await createOrder(
      {
        customerId: customers[2].id,
        pickupAddress: "9 Salt Lake Sector V, Kolkata",
        pickupPincode: "700091",
        dropAddress: "78 Ballygunge Circular Road, Kolkata",
        dropPincode: "700019",
        lengthCm: 25,
        breadthCm: 20,
        heightCm: 15,
        actualWeightKg: 2.5,
        orderType: "B2C",
        paymentType: "COD",
      },
      actor
    );
    await autoAssignOrder(order3.id, actor);
    await updateOrderStatus(order3.id, "PICKED_UP", actor, { allowAny: true });
    await updateOrderStatus(order3.id, "IN_TRANSIT", actor, { allowAny: true });
    await updateOrderStatus(order3.id, "OUT_FOR_DELIVERY", actor, { allowAny: true });
    await updateOrderStatus(order3.id, "FAILED", actor, {
      note: "Customer unavailable at address",
      allowAny: true,
    });
  }

  console.log("\nSeed complete. Demo accounts (all use the same password):");
  console.log(`  password: ${DEMO_PASSWORD}`);
  console.log("  admin:    admin@lastmile.demo");
  console.log("  customer: priya@lastmile.demo / rahul@lastmile.demo / meera@lastmile.demo");
  console.log("  agent:    nikhil@lastmile.demo (North) / sana@lastmile.demo (South) / ehsan@lastmile.demo (East) / wendy@lastmile.demo (West)");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
