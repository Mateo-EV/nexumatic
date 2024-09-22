import { getAvailableServicesForUser } from "@/server/db/data";
import { ConnectionCard } from "./_components/ConnectionCard";

export default async function ConnectionsPage() {
  const servicesData = await getAvailableServicesForUser();

  const services = Object.values(servicesData.indexedById).filter(
    (service) => service.name !== "Manual Trigger",
  );

  return (
    <main className="container relative flex flex-col pt-8">
      <div className="sticky top-0 flex items-center justify-between border-b bg-background/50 p-6 backdrop-blur-lg">
        <div>
          <h1 className="text-4xl">Connections</h1>
          <p className="text-muted-foreground">
            Connect all your apps directly frome here
          </p>
        </div>
      </div>
      <section className="flex flex-col gap-4 py-4">
        {services.map((service) => (
          <ConnectionCard key={service.id} service={service} />
        ))}
      </section>
    </main>
  );
}
