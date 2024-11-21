import Plans from "./Plans";

export default function SubscriptionSection() {
  return (
    <>
      <section className="text-center">
        <h1
          className={`mt-2 font-semibold tracking-tight text-gray-900 dark:text-white`}
        >
          Pricing Plans
        </h1>
        <p className="pt-1 text-gray-600 dark:text-gray-400">
          This is what we offers to you
        </p>
        <br />
      </section>
      <section className="mt-8 flex flex-col justify-center gap-8 sm:flex-row sm:flex-wrap">
        <Plans />
      </section>
    </>
  );
}
