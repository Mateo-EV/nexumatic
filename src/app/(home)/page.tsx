import { MaxWidthWrapper } from "@/components/MaxWidthWrapper";
import SubscriptionSection from "@/app/(home)/payments/SubscriptionSection";
import { Button } from "@/components/ui/button";
import { ContainerScroll } from "./_components/ContainerScroll";
import Image from "next/image";
import ProductImage from "@/assets/img/product.jpg";

export default function Home() {
  return (
    <MaxWidthWrapper>
      <ContainerScroll
        titleComponent={
          <div className="mb-20 flex flex-col items-center">
            <Button
              variant="outline"
              size="sm"
              className="mb-4 rounded-full px-4"
            >
              <span className="mr-2">🎉</span>Supercharge your workflow with
              NexuMatic
            </Button>
            <h1 className="max-w-4xl text-5xl font-bold md:text-6xl lg:text-7xl">
              Automate, Optimize, and Scale{" "}
              <span className="text-blue-500">your tasks</span> in seconds.
            </h1>
            <p className="mt-5 max-w-prose text-muted-foreground sm:text-lg">
              Build seamless automation pipelines using our cutting-edge
              platform. Integrate with tools like Google Drive, Slack, Notion,
              and more while managing everything in real-time with our intuitive
              dashboard.
            </p>
          </div>
        }
      >
        <Image
          src={ProductImage}
          draggable={false}
          alt="hero"
          className="mx-auto h-full rounded-2xl object-cover object-left-top"
        />
      </ContainerScroll>

      <SubscriptionSection />
    </MaxWidthWrapper>
  );
}
